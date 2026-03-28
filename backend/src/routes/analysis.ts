import { Router } from "express";
import { z } from "zod";
import { logger } from "../utils";
import { getEntityById } from "../services/database/supabaseClient";
import { generateOsintSummary } from "../services/llm/langchainAgent";
import { cacheSummary, getValidCachedSummary } from "../services/llm/summaries";
import { GroqTimeoutError } from "../services/llm/groqClient";

const router = Router();

const paramsSchema = z.object({
  entityId: z.string().trim().min(1).max(128),
});

const bodySchema = z.object({
  additional_context: z.string().trim().max(2000).optional(),
});

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function safeString(value: unknown, fallback = "unknown"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function buildEntityContext(entityRow: Record<string, unknown>, additionalContext?: string): string {
  const metadata = asRecord(entityRow.metadata);
  const currentRoute = asRecord(entityRow.current_route);
  const enrichment = asRecord(entityRow.enrichment);

  const entityId = safeString(entityRow.entity_id ?? entityRow.id);
  const entityType = safeString(entityRow.entity_type ?? metadata.type);
  const name = safeString(metadata.name ?? entityRow.name, "Unknown");
  const country = safeString(metadata.country ?? entityRow.country, "Unknown");
  const metadataEntityType = safeString(metadata.entity_type ?? entityType, "Unknown");
  const speedKnots = safeNumber(metadata.speed_knots, 0);
  const origin = safeString(currentRoute.origin, "Unknown");
  const destination = safeString(currentRoute.destination, "Unknown");

  const lines = [
    `id: ${entityId}`,
    `type: ${entityType}`,
    `metadata.name: ${name}`,
    `metadata.country: ${country}`,
    `metadata.entity_type: ${metadataEntityType}`,
    `metadata.speed_knots: ${speedKnots}`,
    `current_route.origin: ${origin}`,
    `current_route.destination: ${destination}`,
    `enrichment: ${JSON.stringify(enrichment)}`,
  ];

  if (additionalContext) {
    lines.push(`additional_context: ${additionalContext}`);
  }

  return lines.join("\n");
}

router.post("/:entityId", async (req, res) => {
  // SECURITY: FIXED - Validate route and body input with Zod before usage.
  const parsedParams = paramsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid entityId." });
  }

  const parsedBody = bodySchema.safeParse(req.body || {});
  if (!parsedBody.success) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const { entityId } = parsedParams.data;

  try {
    const cached = await getValidCachedSummary(entityId);
    if (cached) {
      return res.json({
        summary: cached.summary,
        cached: true,
        generated_at: cached.generatedAt,
      });
    }

    const { data: entityRow, error: entityError } = await getEntityById(entityId);
    if (entityError) {
      logger.error("Failed to read entity for analysis.", {
        err: entityError.message,
        entityId,
      });
      return res.status(502).json({ error: "Failed to read entity data." });
    }

    if (!entityRow) {
      return res.status(404).json({ error: "Entity not found." });
    }

    const context = buildEntityContext(entityRow as Record<string, unknown>, parsedBody.data.additional_context);
    const summary = await generateOsintSummary(context);
    const stored = await cacheSummary(entityId, summary);

    return res.json({
      summary: stored.summary,
      cached: false,
      generated_at: stored.generatedAt,
    });
  } catch (error) {
    if (error instanceof GroqTimeoutError) {
      return res.status(504).json({
        error: "timeout",
        fallback: "Analysis unavailable. Try again shortly.",
      });
    }

    logger.error("Analysis route failed.", {
      err: error instanceof Error ? error.message : String(error),
      entityId,
    });

    return res.status(500).json({ error: "Failed to generate analysis." });
  }
});

export default router;
