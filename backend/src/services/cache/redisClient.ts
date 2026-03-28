import Redis from "ioredis";
import dotenv from "dotenv";
import { logger } from "../../utils";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" }); 

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_ERROR_LOG_THROTTLE_MS = 30000;

let lastErrorLogAt = 0;
let redisReady = false;
let lastErrorMessage: string | null = null;
let lastErrorAt: string | null = null;

function shouldLogErrorNow(message: string): boolean {
  const now = Date.now();
  const shouldLog =
    message !== lastErrorMessage || now - lastErrorLogAt >= REDIS_ERROR_LOG_THROTTLE_MS;

  if (shouldLog) {
    lastErrorLogAt = now;
    lastErrorMessage = message;
  }

  return shouldLog;
}

function trackRedisError(message: string, error?: unknown): void {
  lastErrorMessage = message;
  lastErrorAt = new Date().toISOString();
  redisReady = false;

  if (shouldLogErrorNow(message)) {
    logger.warn(message, {
      err: error instanceof Error ? error.message : String(error || "unknown"),
    });
  }
}

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 5000,
  retryStrategy: (attempt) => {
    if (attempt > 20) {
      trackRedisError("Redis retry limit reached; continuing in degraded cache mode.");
      return null;
    }

    return Math.min(attempt * 200, 2000);
  },
});

redis.on("error", (err) => {
  trackRedisError("Redis connection error.", err);
});

redis.on("ready", () => {
  redisReady = true;
  lastErrorMessage = null;
  logger.info("Redis ready.", { url: REDIS_URL });
});

redis.on("connect", () => {
  logger.info("Redis socket connected.");
});

redis.on("close", () => {
  redisReady = false;
  logger.warn("Redis connection closed; cache reads/writes will degrade until reconnect.");
});

redis.on("end", () => {
  redisReady = false;
  logger.warn("Redis connection ended; cache is in degraded mode.");
});

redis.on("reconnecting", (delay: number) => {
  redisReady = false;
  if (shouldLogErrorNow("Redis reconnecting.")) {
    logger.warn("Redis reconnecting.", { delayMs: delay });
  }
});

export function getRedisHealth() {
  return {
    configured: Boolean(process.env.REDIS_URL),
    status: redis.status,
    ready: redisReady,
    lastErrorMessage,
    lastErrorAt,
  };
}

function canUseRedis(): boolean {
  return redisReady && redis.status === "ready";
}

/**
 * Caches an item with a TTL
 */
export async function cacheSet(key: string, value: any, ttlSeconds: number) {
  if (!canUseRedis()) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    trackRedisError(`Redis set failed for key: ${key}.`, err);
  }
}

/**
 * Retrieves an item from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!canUseRedis()) {
    return null;
  }

  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    trackRedisError(`Redis get failed for key: ${key}.`, err);
    return null;
  }
}

/**
 * Checks if a key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (!canUseRedis()) {
    return false;
  }

  try {
    return (await redis.exists(key)) > 0;
  } catch (err) {
    trackRedisError(`Redis exists failed for key: ${key}.`, err);
    return false;
  }
}
