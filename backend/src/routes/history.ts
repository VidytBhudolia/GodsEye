import { Router } from "express";
import { z } from "zod";
import { logger } from "../utils";
import { getPositionHistory, getPositionHistoryForRoutes } from "../services/database/supabaseClient";

const router = Router();

const paramsSchema = z.object({
  entityId: z.string().trim().min(1).max(128),
});

const historyQuerySchema = z.object({
  hours: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return 24;
      }
      return Number(value);
    },
    z.number().int().min(1).max(168)
  ),
});

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function toApproxLabel(lat: number, lon: number): string {
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

router.get("/:entityId", async (req, res) => {
  // SECURITY: FIXED - Validate params/query before using external input.
  const parsedParams = paramsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid entityId." });
  }

  const parsedQuery = historyQuerySchema.safeParse(req.query || {});
  if (!parsedQuery.success) {
    return res.status(400).json({ error: "Invalid hours parameter." });
  }

  const { entityId } = parsedParams.data;
  const { hours } = parsedQuery.data;
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await getPositionHistory(entityId, sinceIso, 500);
    if (error) {
      logger.error("Failed to query position_history.", {
        err: error.message,
        entityId,
        hours,
      });
      return res.status(502).json({ error: "Failed to load history." });
    }

    const points = (Array.isArray(data) ? data : [])
      .map((row) => {
        const lat = asNumber(row.lat);
        const lon = asNumber(row.lon);
        if (lat === null || lon === null) {
          return null;
        }

        return {
          lat,
          lon,
          alt_m: asNumber(row.alt_m),
          recorded_at: typeof row.recorded_at === "string" ? row.recorded_at : new Date().toISOString(),
        };
      })
      .filter((point): point is { lat: number; lon: number; alt_m: number | null; recorded_at: string } => point !== null);

    return res.json({
      entityId,
      points,
      count: points.length,
    });
  } catch (error) {
    logger.error("History endpoint failed.", {
      err: error instanceof Error ? error.message : String(error),
      entityId,
    });
    return res.status(500).json({ error: "Failed to load history." });
  }
});

router.get("/:entityId/routes", async (req, res) => {
  // SECURITY: FIXED - Validate entityId before route history processing.
  const parsedParams = paramsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid entityId." });
  }

  const { entityId } = parsedParams.data;

  try {
    const { data, error } = await getPositionHistoryForRoutes(entityId, 2000);
    if (error) {
      logger.error("Failed to query position_history for route groups.", {
        err: error.message,
        entityId,
      });
      return res.status(502).json({ error: "Failed to load route history." });
    }

    const orderedPoints = (Array.isArray(data) ? data : [])
      .map((row) => {
        const lat = asNumber(row.lat);
        const lon = asNumber(row.lon);
        const recordedAt = typeof row.recorded_at === "string" ? row.recorded_at : null;
        if (lat === null || lon === null || !recordedAt) {
          return null;
        }

        const timestamp = new Date(recordedAt).getTime();
        if (Number.isNaN(timestamp)) {
          return null;
        }

        return { lat, lon, recordedAt, timestamp };
      })
      .filter((point): point is { lat: number; lon: number; recordedAt: string; timestamp: number } => point !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    const grouped: Array<Array<{ lat: number; lon: number; recordedAt: string; timestamp: number }>> = [];
    let currentGroup: Array<{ lat: number; lon: number; recordedAt: string; timestamp: number }> = [];

    for (const point of orderedPoints) {
      const previousPoint = currentGroup[currentGroup.length - 1];
      const shouldSplit = previousPoint && point.timestamp - previousPoint.timestamp > FOUR_HOURS_MS;

      if (shouldSplit && currentGroup.length) {
        grouped.push(currentGroup);
        currentGroup = [];
      }

      currentGroup.push(point);
    }

    if (currentGroup.length) {
      grouped.push(currentGroup);
    }

    const routes = grouped.slice(-5).map((group) => {
      const start = group[0];
      const end = group[group.length - 1];

      return {
        start: start.recordedAt,
        end: end.recordedAt,
        origin_approx: toApproxLabel(start.lat, start.lon),
        dest_approx: toApproxLabel(end.lat, end.lon),
        points: group.map((point) => ({ lat: point.lat, lon: point.lon })),
      };
    });

    return res.json({ routes });
  } catch (error) {
    logger.error("Route grouping endpoint failed.", {
      err: error instanceof Error ? error.message : String(error),
      entityId,
    });
    return res.status(500).json({ error: "Failed to load route groups." });
  }
});

export default router;
