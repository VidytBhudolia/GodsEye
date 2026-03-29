import { Server as SocketIOServer } from "socket.io";
import { Entity } from "../shared/contract";
import { logger } from "../utils";

const DEFAULT_FLUSH_INTERVAL_MS = 250;
const DEFAULT_MAX_BATCH_SIZE = 250;
const DEFAULT_MAX_BUFFER_SIZE = 5000;

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

const FLUSH_INTERVAL_MS = parsePositiveInt(process.env.ENTITY_BATCH_FLUSH_MS, DEFAULT_FLUSH_INTERVAL_MS);
const MAX_BATCH_SIZE = parsePositiveInt(process.env.ENTITY_BATCH_MAX_SIZE, DEFAULT_MAX_BATCH_SIZE);
const MAX_BUFFER_SIZE = parsePositiveInt(process.env.ENTITY_BATCH_BUFFER_MAX, DEFAULT_MAX_BUFFER_SIZE);

let ioInstance: SocketIOServer | null = null;
let flushTimer: NodeJS.Timeout | null = null;
const queue = new Map<string, Entity>();
let droppedUpdates = 0;

function flushQueue(reason: "interval" | "size"): void {
  if (!ioInstance || queue.size === 0) {
    return;
  }

  const entries = Array.from(queue.entries()).slice(0, MAX_BATCH_SIZE);
  for (const [entityId] of entries) {
    queue.delete(entityId);
  }

  const entities = entries.map(([, entity]) => entity);
  ioInstance.emit("entity:batch", {
    entities,
    count: entities.length,
    generated_at: new Date().toISOString(),
  });

  if (droppedUpdates > 0) {
    logger.warn("Dropped entity updates due to batch buffer pressure.", {
      droppedUpdates,
      queueSize: queue.size,
    });
    droppedUpdates = 0;
  }

  logger.debug("Emitted entity batch.", {
    reason,
    batchCount: entities.length,
    queueRemaining: queue.size,
  });
}

export function initializeEntityBatchBroadcaster(io: SocketIOServer): void {
  ioInstance = io;

  if (flushTimer) {
    return;
  }

  flushTimer = setInterval(() => {
    flushQueue("interval");
  }, FLUSH_INTERVAL_MS);

  logger.info("Entity batch broadcaster initialized.", {
    flushIntervalMs: FLUSH_INTERVAL_MS,
    maxBatchSize: MAX_BATCH_SIZE,
    maxBufferSize: MAX_BUFFER_SIZE,
  });
}

export function enqueueEntityUpdate(entity: Entity): void {
  if (!ioInstance) {
    return;
  }

  if (!queue.has(entity.id) && queue.size >= MAX_BUFFER_SIZE) {
    const oldestEntityId = queue.keys().next().value as string | undefined;
    // Drop the oldest queued entity to preserve bounded memory usage.
    if (oldestEntityId) {
      queue.delete(oldestEntityId);
      droppedUpdates += 1;
    }
  }

  queue.set(entity.id, entity);

  if (queue.size >= MAX_BATCH_SIZE) {
    flushQueue("size");
  }
}

export function getEntityBatchQueueSize(): number {
  return queue.size;
}
