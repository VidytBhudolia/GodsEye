import { createClient } from "@supabase/supabase-js";
import { Entity } from "../../shared/contract";
import dotenv from "dotenv";
import { logger } from "../../utils";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseKey = "placeholder-service-key";
const SUPABASE_WRITE_COOLDOWN_MS = 30_000;
const SUPABASE_SUPPRESSION_LOG_THROTTLE_MS = 30_000;
const SUPABASE_FAILURE_LOG_THROTTLE_MS = 10_000;

let suppressWritesUntil = 0;
let lastSuppressionLogAt = 0;
let lastFailureLogAt = 0;
let lastFailureMessage = "";
let entityUpsertInFlight = false;
let historyInsertInFlight = false;

if (!supabaseUrl || !supabaseKey) {
  logger.warn("SUPABASE_URL or SUPABASE_SERVICE_KEY is missing but continuing for now.");
}

export const supabase = createClient(
  supabaseUrl || fallbackSupabaseUrl,
  supabaseKey || fallbackSupabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function truncateText(input: string, maxLength = 260): string {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength)}...`;
}

function toErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return truncateText(error.replace(/\s+/g, " ").trim());
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return truncateText(message.replace(/\s+/g, " ").trim());
    }
  }

  return truncateText(String(error ?? "Unknown error"));
}

function markSupabaseWriteFailure(error: unknown): void {
  const errMessage = toErrorMessage(error);
  const now = Date.now();
  suppressWritesUntil = Math.max(suppressWritesUntil, now + SUPABASE_WRITE_COOLDOWN_MS);

  const shouldLogFailure =
    errMessage !== lastFailureMessage || now - lastFailureLogAt >= SUPABASE_FAILURE_LOG_THROTTLE_MS;

  if (shouldLogFailure) {
    lastFailureLogAt = now;
    lastFailureMessage = errMessage;
    logger.warn("Supabase write failure detected; pausing hot-path writes.", {
      err: errMessage,
      cooldownMs: SUPABASE_WRITE_COOLDOWN_MS,
    });
  }
}

export function canAttemptSupabaseWrite(): boolean {
  const now = Date.now();
  if (now >= suppressWritesUntil) {
    return true;
  }

  if (now - lastSuppressionLogAt >= SUPABASE_SUPPRESSION_LOG_THROTTLE_MS) {
    lastSuppressionLogAt = now;
    logger.warn("Supabase writes are temporarily suppressed.", {
      resumeInMs: suppressWritesUntil - now,
    });
  }

  return false;
}

/**
 * Upserts an array of entities into the Supabase database.
 * Converts the Entity objects to match the database table schema `entities`.
 */
export async function upsertEntities(entities: Entity[]) {
  if (!entities.length) return { error: null, count: 0 };
  if (!canAttemptSupabaseWrite()) return { error: null, count: 0 };
  if (entityUpsertInFlight) return { error: null, count: 0 };
  
  const records = entities.map((e) => ({
    entity_id: e.id,
    entity_type: e.type,
    name: e.metadata.name,
    country: e.metadata.country,
    flag_emoji: e.metadata.country_flag,
    // Note: PostGIS requires EWKT format, simplified here. In standard PostgreSQL:
    current_position: `SRID=4326;POINT(${e.position.lon} ${e.position.lat})`,
    metadata: e.metadata,
    cache_ttl_seconds: e.cache_ttl_seconds,
  }));

  try {
    entityUpsertInFlight = true;
    const { data, error } = await supabase
      .from("entities")
      .upsert(records, {
        onConflict: "entity_id", // ON CONFLICT DO UPDATE
        ignoreDuplicates: false,
      });

    if (error) {
      markSupabaseWriteFailure(error);
      logger.error("Failed to upsert entities.", { err: toErrorMessage(error) });
    }

    return { error, count: records.length };
  } catch (error) {
    markSupabaseWriteFailure(error);
    logger.error("Supabase upsert threw unexpectedly.", { err: toErrorMessage(error) });
    return { error: { message: toErrorMessage(error) }, count: records.length };
  } finally {
    entityUpsertInFlight = false;
  }
}

/**
 * Gets entities with optional type filter
 */
export async function getEntities(type?: string) {
  let query = supabase.from("entities").select("*");
  if (type) {
    query = query.eq("entity_type", type);
  }
  return await query;
}

export async function getEntityById(entityId: string) {
  return await supabase.from("entities").select("*").eq("entity_id", entityId).maybeSingle();
}

/**
 * Upsert AI Summary
 */
export async function upsertAiSummary(entityId: string, summary: string) {
  return await supabase.from("ai_summaries").upsert({
    entity_id: entityId,
    summary,
  }, {
    onConflict: "entity_id",
  });
}

export interface PositionHistoryRow {
  entity_id: string;
  lat: number;
  lon: number;
  alt_m?: number | null;
  speed_knots?: number | null;
  heading_deg?: number | null;
  recorded_at: string;
}

export async function insertPositionHistory(row: PositionHistoryRow) {
  if (!canAttemptSupabaseWrite()) {
    return { data: null, error: null };
  }
  if (historyInsertInFlight) {
    return { data: null, error: null };
  }

  try {
    historyInsertInFlight = true;
    const { data, error } = await supabase.from("position_history").insert(row);

    if (error) {
      markSupabaseWriteFailure(error);
      logger.error("Failed to insert position_history row.", {
        err: toErrorMessage(error),
        entityId: row.entity_id,
      });
    }

    return { data, error };
  } catch (error) {
    markSupabaseWriteFailure(error);
    logger.error("Supabase position_history insert threw unexpectedly.", {
      err: toErrorMessage(error),
      entityId: row.entity_id,
    });
    return { data: null, error: { message: toErrorMessage(error) } };
  } finally {
    historyInsertInFlight = false;
  }
}

export async function getLatestPositionHistory(entityId: string) {
  return await supabase
    .from("position_history")
    .select("lat, lon, recorded_at")
    .eq("entity_id", entityId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function getPositionHistory(entityId: string, sinceIso: string, limit = 500) {
  return await supabase
    .from("position_history")
    .select("lat, lon, alt_m, speed_knots, heading_deg, recorded_at")
    .eq("entity_id", entityId)
    .gte("recorded_at", sinceIso)
    .order("recorded_at", { ascending: false })
    .limit(limit);
}

export async function getPositionHistoryForRoutes(entityId: string, limit = 2000) {
  return await supabase
    .from("position_history")
    .select("lat, lon, recorded_at")
    .eq("entity_id", entityId)
    .order("recorded_at", { ascending: false })
    .limit(limit);
}
