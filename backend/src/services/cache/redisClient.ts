import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" }); 

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  console.error("[Redis] Global Error:", err.message);
});

redis.on("connect", () => {
  console.log("[Redis] Connected to", REDIS_URL);
});

/**
 * Caches an item with a TTL
 */
export async function cacheSet(key: string, value: any, ttlSeconds: number) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`[Redis] Failed to set cache for ${key}`, err);
  }
}

/**
 * Retrieves an item from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`[Redis] Failed to get cache for ${key}`, err);
    return null;
  }
}

/**
 * Checks if a key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    return (await redis.exists(key)) > 0;
  } catch (err) {
    console.error(`[Redis] Failed to check exists for ${key}`, err);
    return false;
  }
}
