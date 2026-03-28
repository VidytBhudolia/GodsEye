import { Entity } from "../../../shared/contract";
import { fetchOpenSkyStates, OpenSkyBbox } from "../services/adapters/OpenSkyAdapter";
import { cacheExists, cacheSet, cacheGet } from "../services/cache/redisClient";
import { upsertEntities } from "../services/database/supabaseClient";
import { writeHistorySnapshot } from "../services/database/historyWriter";
import { enqueueEntityUpdate, getAggregatedViewportBounds, getViewportStateSummary } from "../websocket";
import { logger } from "../utils";

const DEFAULT_POLLING_INTERVAL_MS = 12000;

type OpenSkyPollMode = "viewport" | "env" | "global";

function parsePositiveInt(input: string | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }

  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseNumber(input: string | undefined): number | null {
  if (!input) {
    return null;
  }

  const parsed = Number.parseFloat(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function getEnvFallbackBbox(): OpenSkyBbox | null {
  const lamin = parseNumber(process.env.OPENSKY_BBOX_LAMIN || process.env.OPENSKY_LAMIN || process.env.OPENSKY_SOUTH);
  const lamax = parseNumber(process.env.OPENSKY_BBOX_LAMAX || process.env.OPENSKY_LAMAX || process.env.OPENSKY_NORTH);
  const lomin = parseNumber(process.env.OPENSKY_BBOX_LOMIN || process.env.OPENSKY_LOMIN || process.env.OPENSKY_WEST);
  const lomax = parseNumber(process.env.OPENSKY_BBOX_LOMAX || process.env.OPENSKY_LOMAX || process.env.OPENSKY_EAST);

  if (lamin === null || lamax === null || lomin === null || lomax === null) {
    return null;
  }

  if (lamax <= lamin || lomax <= lomin) {
    return null;
  }

  return { lamin, lamax, lomin, lomax };
}

function formatBboxToken(bbox: OpenSkyBbox | null): string {
  if (!bbox) {
    return "global";
  }

  return [bbox.lamin, bbox.lamax, bbox.lomin, bbox.lomax].map((value) => value.toFixed(2)).join(":");
}

function cacheKeyForTarget(mode: OpenSkyPollMode, bbox: OpenSkyBbox | null): string {
  if (mode === "global") {
    return "opensky:states:all";
  }

  return `opensky:states:${mode}:${formatBboxToken(bbox)}`;
}

function resolvePollingTarget(): { mode: OpenSkyPollMode; bbox: OpenSkyBbox | null; reason: string } {
  const viewportBbox = getAggregatedViewportBounds();
  if (viewportBbox) {
    return {
      mode: "viewport",
      bbox: viewportBbox,
      reason: "active viewport updates",
    };
  }

  const envBbox = getEnvFallbackBbox();
  if (envBbox) {
    return {
      mode: "env",
      bbox: envBbox,
      reason: "environment bbox fallback",
    };
  }

  return {
    mode: "global",
    bbox: null,
    reason: "no active viewport and no env bbox",
  };
}

export function startOpenSkyPolling() {
  const pollingIntervalMs = parsePositiveInt(process.env.OPENSKY_POLLING_INTERVAL_MS, DEFAULT_POLLING_INTERVAL_MS);
  const cacheTtlSeconds = Math.max(5, Math.round(pollingIntervalMs / 1000));
  
  const poll = async () => {
    const startedAt = Date.now();
    const viewportSummary = getViewportStateSummary();
    const target = resolvePollingTarget();
    const cacheKey = cacheKeyForTarget(target.mode, target.bbox);

    try {
      const exists = await cacheExists(cacheKey);
      if (exists) {
        logger.info("OpenSky poll cache hit.", {
          mode: target.mode,
          reason: target.reason,
          cacheKey,
          activeViewports: viewportSummary.activeSockets,
        });

        // Emit from cache through the batch broadcaster.
        const cachedEntities = await cacheGet<Entity[]>(cacheKey);
        if (cachedEntities) {
          cachedEntities.forEach((entity) => enqueueEntityUpdate(entity));
        }
        return;
      }
      
      logger.info("OpenSky polling API.", {
        mode: target.mode,
        reason: target.reason,
        bbox: target.bbox,
        activeViewports: viewportSummary.activeSockets,
      });

      const entities = await fetchOpenSkyStates(target.bbox ?? undefined);
      
      await cacheSet(cacheKey, entities, cacheTtlSeconds);
      await upsertEntities(entities);

      entities.forEach((entity) => {
        writeHistorySnapshot(entity);
        enqueueEntityUpdate(entity);
      });
      
      logger.info("OpenSky poll complete.", {
        mode: target.mode,
        reason: target.reason,
        cacheKey,
        count: entities.length,
        durationMs: Date.now() - startedAt,
      });
    } catch (err: any) {
      logger.error("OpenSky polling failed.", {
        err: err?.message || "Unknown error",
        mode: target.mode,
        reason: target.reason,
        cacheKey,
      });
    }
  };

  setInterval(poll, pollingIntervalMs);
  
  // Initial run
  poll();
}
