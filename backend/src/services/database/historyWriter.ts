import { Entity } from "../../../../shared/contract";
import { logger } from "../../utils";
import {
  canAttemptSupabaseWrite,
  getLatestPositionHistory,
  insertPositionHistory,
  PositionHistoryRow,
} from "./supabaseClient";

const MOVEMENT_THRESHOLD_DEGREES = 0.01;

type LatLon = {
  lat: number;
  lon: number;
};

const lastPositionCache = new Map<string, LatLon>();

function hasMovedEnough(current: LatLon, previous: LatLon): boolean {
  const latDelta = Math.abs(current.lat - previous.lat);
  const lonDelta = Math.abs(current.lon - previous.lon);
  return latDelta > MOVEMENT_THRESHOLD_DEGREES || lonDelta > MOVEMENT_THRESHOLD_DEGREES;
}

async function getPreviousPosition(entityId: string): Promise<LatLon | null> {
  const memoized = lastPositionCache.get(entityId);
  if (memoized) {
    return memoized;
  }

  const { data, error } = await getLatestPositionHistory(entityId);
  if (error) {
    logger.debug("Skipping dedupe lookup due to position_history read failure.", {
      err: error.message,
      entityId,
    });
    return null;
  }

  if (!data || typeof data.lat !== "number" || typeof data.lon !== "number") {
    return null;
  }

  const previous = { lat: data.lat, lon: data.lon };
  lastPositionCache.set(entityId, previous);
  return previous;
}

async function writePositionHistory(entity: Entity): Promise<void> {
  if (entity.type === "satellite") {
    // TODO: Satellites update too frequently for position_history and are intentionally excluded.
    return;
  }

  if (typeof entity.position?.lat !== "number" || typeof entity.position?.lon !== "number") {
    return;
  }

  if (!canAttemptSupabaseWrite()) {
    return;
  }

  const current = {
    lat: entity.position.lat,
    lon: entity.position.lon,
  };

  const previous = await getPreviousPosition(entity.id);
  if (previous && !hasMovedEnough(current, previous)) {
    return;
  }

  const row: PositionHistoryRow = {
    entity_id: entity.id,
    lat: current.lat,
    lon: current.lon,
    alt_m: entity.position.alt_m ?? null,
    speed_knots: Number.isFinite(entity.metadata?.speed_knots) ? entity.metadata.speed_knots : null,
    heading_deg: Number.isFinite(entity.metadata?.heading_deg) ? entity.metadata.heading_deg : null,
    recorded_at: new Date().toISOString(),
  };

  const { error } = await insertPositionHistory(row);
  if (error) {
    return;
  }

  lastPositionCache.set(entity.id, current);
}

export function writeHistorySnapshot(entity: Entity): void {
  void writePositionHistory(entity).catch((error) => {
    logger.error("Failed to write position_history snapshot.", {
      err: error instanceof Error ? error.message : String(error),
      entityId: entity.id,
    });
  });
}
