import { randomUUID } from "crypto";
import { Server as SocketIOServer } from "socket.io";
import { Entity } from "../../../../shared/contract";
import { logger } from "../../utils";
import { addAlert, Alert } from "./alertsStore";

const AIS_DARK_THRESHOLD_MS = 10 * 60 * 1000;
const AIS_DARK_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

type ShipSeenState = {
  lastSeenAt: number;
  lastLat: number;
  lastLon: number;
  entityName: string;
  wasActive: boolean;
};

const shipSeenMap = new Map<string, ShipSeenState>();
const dedupeMap = new Map<string, number>();

let ioInstance: SocketIOServer | null = null;
let aisDarkTimer: NodeJS.Timeout | null = null;

function getEntityName(entity: Entity): string {
  const callsign = typeof entity.metadata.callsign === "string" ? entity.metadata.callsign.trim() : "";
  if (callsign) {
    return callsign;
  }

  const name = typeof entity.metadata.name === "string" ? entity.metadata.name.trim() : "";
  if (name) {
    return name;
  }

  return entity.id;
}

function shouldEmitAlert(entityId: string, type: Alert["type"], nowMs: number): boolean {
  const key = `${entityId}:${type}`;
  const lastDetected = dedupeMap.get(key);

  if (typeof lastDetected === "number" && nowMs - lastDetected < DEDUPE_WINDOW_MS) {
    return false;
  }

  dedupeMap.set(key, nowMs);
  return true;
}

function emitAlert(alert: Alert): void {
  addAlert(alert);

  if (ioInstance) {
    ioInstance.emit("alert:new", alert);
  }
}

function createAndEmitAlert(
  entityId: string,
  entityName: string,
  type: Alert["type"],
  severity: Alert["severity"],
  message: string,
  lat: number,
  lon: number,
  nowMs: number
): void {
  if (!shouldEmitAlert(entityId, type, nowMs)) {
    return;
  }

  emitAlert({
    id: randomUUID(),
    entityId,
    entityName,
    type,
    severity,
    message,
    detectedAt: new Date(nowMs).toISOString(),
    lat,
    lon,
    acknowledged: false,
  });
}

function parseSquawk(entity: Entity): string | null {
  if (!entity.enrichment || typeof entity.enrichment !== "object") {
    return null;
  }

  const raw = (entity.enrichment as Record<string, unknown>).squawk_code;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }

  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }

  return null;
}

function updateShipSeenState(entity: Entity, nowMs: number): void {
  if (entity.type !== "ship") {
    return;
  }

  shipSeenMap.set(entity.id, {
    lastSeenAt: nowMs,
    lastLat: entity.position.lat,
    lastLon: entity.position.lon,
    entityName: getEntityName(entity),
    wasActive: entity.metadata.status === "active",
  });
}

function checkAisDark(): void {
  const nowMs = Date.now();

  for (const [entityId, state] of shipSeenMap.entries()) {
    if (!state.wasActive) {
      continue;
    }

    if (nowMs - state.lastSeenAt < AIS_DARK_THRESHOLD_MS) {
      continue;
    }

    createAndEmitAlert(
      entityId,
      state.entityName,
      "AIS_DARK",
      "high",
      `${state.entityName} (${entityId}) went AIS-dark near ${state.lastLat.toFixed(3)},${state.lastLon.toFixed(3)}`,
      state.lastLat,
      state.lastLon,
      nowMs
    );
  }
}

function checkSquawkAlerts(entity: Entity, nowMs: number): void {
  if (entity.type !== "aircraft") {
    return;
  }

  const squawkCode = parseSquawk(entity);
  if (!squawkCode) {
    return;
  }

  const entityName = getEntityName(entity);
  if (squawkCode === "7700") {
    createAndEmitAlert(
      entity.id,
      entityName,
      "SQUAWK_7700",
      "critical",
      `${entityName} declaring general emergency (7700)`,
      entity.position.lat,
      entity.position.lon,
      nowMs
    );
    return;
  }

  if (squawkCode === "7600") {
    createAndEmitAlert(
      entity.id,
      entityName,
      "SQUAWK_7600",
      "high",
      `${entityName} lost radio contact (7600)`,
      entity.position.lat,
      entity.position.lon,
      nowMs
    );
    return;
  }

  if (squawkCode === "7500") {
    createAndEmitAlert(
      entity.id,
      entityName,
      "SQUAWK_7500",
      "critical",
      `${entityName} squawking hijack code (7500)`,
      entity.position.lat,
      entity.position.lon,
      nowMs
    );
  }
}

function checkHighSpeed(entity: Entity, nowMs: number): void {
  if (entity.type !== "ship") {
    return;
  }

  if (entity.metadata.speed_knots <= 35) {
    return;
  }

  const speed = Math.round(entity.metadata.speed_knots);
  const entityName = getEntityName(entity);

  createAndEmitAlert(
    entity.id,
    entityName,
    "HIGH_SPEED",
    "medium",
    `${entityName} moving at ${speed}kts - abnormally fast for vessel`,
    entity.position.lat,
    entity.position.lon,
    nowMs
  );
}

export function checkEntity(entity: Entity): void {
  const nowMs = Date.now();
  updateShipSeenState(entity, nowMs);
  checkSquawkAlerts(entity, nowMs);
  checkHighSpeed(entity, nowMs);
}

export function initializeAlertsEngine(io: SocketIOServer): void {
  ioInstance = io;

  if (aisDarkTimer) {
    return;
  }

  aisDarkTimer = setInterval(() => {
    checkAisDark();
  }, AIS_DARK_CHECK_INTERVAL_MS);

  logger.info("AlertsEngine: initialized", {
    aisDarkThresholdMs: AIS_DARK_THRESHOLD_MS,
    dedupeWindowMs: DEDUPE_WINDOW_MS,
  });
}
