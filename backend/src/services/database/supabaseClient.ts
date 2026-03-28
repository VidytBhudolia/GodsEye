import { createClient } from "@supabase/supabase-js";
import { Entity } from "../../../../shared/contract";
import dotenv from "dotenv";
import { logger } from "../../utils";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseKey = "placeholder-service-key";

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

/**
 * Upserts an array of entities into the Supabase database.
 * Converts the Entity objects to match the database table schema `entities`.
 */
export async function upsertEntities(entities: Entity[]) {
  if (!entities.length) return { error: null, count: 0 };
  
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

  const { data, error } = await supabase
    .from("entities")
    .upsert(records, {
      onConflict: "entity_id", // ON CONFLICT DO UPDATE
      ignoreDuplicates: false,
    });

  if (error) {
    logger.error("Failed to upsert entities.", { err: error.message });
  }

  return { error, count: records.length };
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
  const { data, error } = await supabase.from("position_history").insert(row);

  if (error) {
    logger.error("Failed to insert position_history row.", {
      err: error.message,
      entityId: row.entity_id,
    });
  }

  return { data, error };
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
