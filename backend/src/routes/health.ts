import { Router, Request, Response } from "express";
import { getRedisHealth, redis } from "../services/cache/redisClient";
import { supabase } from "../services/database/supabaseClient";
import { logger } from "../utils";

const router = Router();

type DependencyState = "healthy" | "degraded";

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T | null> {
  return await Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

type SupabaseHealthResult = {
  error: { message: string } | null;
};

async function getSupabaseHealth() {
  const start = Date.now();
  try {
    const query = supabase
      .from("entities")
      .select("id", { head: true, count: "estimated" })
      .limit(1);

    const result = await withTimeout(
      query.then((value) => value as SupabaseHealthResult),
      2500
    );

    if (!result) {
      return {
        status: "degraded" as DependencyState,
        latency_ms: Date.now() - start,
        error: "timeout",
      };
    }

    if (result.error) {
      return {
        status: "degraded" as DependencyState,
        latency_ms: Date.now() - start,
        error: result.error.message,
      };
    }

    return {
      status: "healthy" as DependencyState,
      latency_ms: Date.now() - start,
      error: null,
    };
  } catch (error) {
    return {
      status: "degraded" as DependencyState,
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function getRedisDependencyHealth() {
  const base = getRedisHealth();
  const start = Date.now();

  if (!base.configured) {
    return {
      status: "degraded" as DependencyState,
      latency_ms: 0,
      details: {
        configured: false,
        ready: base.ready,
        redis_status: base.status,
      },
      error: "REDIS_URL missing",
    };
  }

  if (!base.ready) {
    return {
      status: "degraded" as DependencyState,
      latency_ms: 0,
      details: {
        configured: base.configured,
        ready: base.ready,
        redis_status: base.status,
        last_error: base.lastErrorMessage,
        last_error_at: base.lastErrorAt,
      },
      error: base.lastErrorMessage || "redis not ready",
    };
  }

  try {
    const pingResult = await withTimeout(redis.ping(), 1500);
    if (pingResult !== "PONG") {
      return {
        status: "degraded" as DependencyState,
        latency_ms: Date.now() - start,
        details: {
          configured: base.configured,
          ready: base.ready,
          redis_status: base.status,
        },
        error: "ping failed",
      };
    }

    return {
      status: "healthy" as DependencyState,
      latency_ms: Date.now() - start,
      details: {
        configured: base.configured,
        ready: base.ready,
        redis_status: base.status,
      },
      error: null,
    };
  } catch (error) {
    return {
      status: "degraded" as DependencyState,
      latency_ms: Date.now() - start,
      details: {
        configured: base.configured,
        ready: base.ready,
        redis_status: base.status,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

router.get("/health", async (_req: Request, res: Response) => {
  const [redisHealth, supabaseHealth] = await Promise.all([
    getRedisDependencyHealth(),
    getSupabaseHealth(),
  ]);

  const redis = redisHealth.status === "healthy";
  const supabase = supabaseHealth.status === "healthy";
  const state = redis && supabase ? "healthy" : "degraded";

  if (!redis || !supabase) {
    logger.warn("Health check degraded.", {
      redis: redisHealth.status,
      supabase: supabaseHealth.status,
    });
  }

  res.status(200).json({
    status: "ok",
    redis,
    supabase,
    state,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    dependencies: {
      redis: redisHealth,
      supabase: supabaseHealth,
    },
  });
});

export default router;
