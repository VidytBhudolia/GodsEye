import { createClient } from "@supabase/supabase-js";
import { Entity } from "../../../../shared/contract";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("[Supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY is missing but continuing for now.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.error("[Supabase] Failed to upsert entities:", error);
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
