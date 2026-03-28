import { logger } from "../../utils";
import { supabase } from "../database/supabaseClient";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export interface CachedSummary {
  summary: string;
  generatedAt: string;
  expiresAt: string;
}

function parseDateString(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export async function getValidCachedSummary(entityId: string): Promise<CachedSummary | null> {
  const { data, error } = await supabase.from("ai_summaries").select("*").eq("entity_id", entityId).maybeSingle();

  if (error) {
    logger.error("Failed to query ai_summaries cache.", { err: error.message, entityId });
    return null;
  }

  if (!data || typeof data.summary !== "string" || !data.summary.trim()) {
    return null;
  }

  const generatedAt =
    parseDateString(data.generated_at)?.toISOString() ||
    parseDateString(data.created_at)?.toISOString() ||
    new Date().toISOString();

  const expiresAtDate =
    parseDateString(data.expires_at) ||
    new Date(new Date(generatedAt).getTime() + SIX_HOURS_MS);

  if (expiresAtDate.getTime() <= Date.now()) {
    return null;
  }

  return {
    summary: data.summary,
    generatedAt,
    expiresAt: expiresAtDate.toISOString(),
  };
}

export async function cacheSummary(entityId: string, summary: string): Promise<CachedSummary> {
  const generatedAtDate = new Date();
  const expiresAtDate = new Date(generatedAtDate.getTime() + SIX_HOURS_MS);
  const generatedAt = generatedAtDate.toISOString();
  const expiresAt = expiresAtDate.toISOString();

  const payloads = [
    { entity_id: entityId, summary, generated_at: generatedAt, expires_at: expiresAt },
    { entity_id: entityId, summary, expires_at: expiresAt },
    { entity_id: entityId, summary },
  ];

  let lastError: string | null = null;

  for (const payload of payloads) {
    const { error } = await supabase.from("ai_summaries").upsert(payload, {
      onConflict: "entity_id",
      ignoreDuplicates: false,
    });

    if (!error) {
      return {
        summary,
        generatedAt,
        expiresAt,
      };
    }

    lastError = error.message;
  }

  throw new Error(lastError || "Failed to cache summary.");
}
