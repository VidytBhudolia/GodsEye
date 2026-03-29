import axios from "axios";
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
} from "satellite.js";
import { z } from "zod";
import { Entity } from "../../../../shared/contract";
import { logger } from "../../utils";
import { cacheGet, cacheSet } from "../cache/redisClient";
import { enqueueEntityUpdate } from "../../websocket";

const TLE_CACHE_KEY = "tle:all";
const TLE_CACHE_TTL_SECONDS = 12 * 60 * 60;
const PROPAGATION_INTERVAL_MS = 2000;
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;

const groupFetchConfig = [
  { search: "STARLINK", limit: 200 },
  { search: "ISS" },
  { search: "COSMOS" },
  { search: "FENGYUN" },
  { search: "USA" },
] as const;

const tleMemberSchema = z.object({
  satelliteId: z.number(),
  name: z.string(),
  date: z.string(),
  line1: z.string(),
  line2: z.string(),
});

const tleResponseSchema = z.object({
  member: z.array(tleMemberSchema).default([]),
  view: z
    .object({
      next: z.string().optional(),
    })
    .optional(),
});

type TleMember = z.infer<typeof tleMemberSchema>;

let inMemoryTles: TleMember[] = [];

function inferCountry(name: string): string {
  const upper = name.toUpperCase();
  if (upper.startsWith("STARLINK") || upper.startsWith("USA")) {
    return "US";
  }
  if (upper.startsWith("COSMOS")) {
    return "RU";
  }
  if (upper.startsWith("FENGYUN")) {
    return "CN";
  }
  return "UNKNOWN";
}

function inferOrbitalClass(meanMotionRadPerMinute: number): "LEO" | "MEO" | "GEO" {
  if (!Number.isFinite(meanMotionRadPerMinute) || meanMotionRadPerMinute <= 0) {
    return "LEO";
  }

  const periodMinutes = (2 * Math.PI) / meanMotionRadPerMinute;
  if (periodMinutes >= 1200) {
    return "GEO";
  }
  if (periodMinutes >= 128) {
    return "MEO";
  }
  return "LEO";
}

function toEntity(tle: TleMember, now: Date): Entity | null {
  const satrec = twoline2satrec(tle.line1, tle.line2);
  const propagated = propagate(satrec, now);
  const eciPosition = propagated.position;

  if (!eciPosition || typeof eciPosition === "boolean") {
    return null;
  }

  const gmst = gstime(now);
  const geo = eciToGeodetic(eciPosition, gmst);

  const lat = degreesLat(geo.latitude);
  const lon = degreesLong(geo.longitude);
  const altMeters = geo.height * 1000;

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(altMeters)) {
    return null;
  }

  const orbitalClass = inferOrbitalClass((satrec as { no?: number }).no || 0);

  return {
    id: String(tle.satelliteId),
    type: "satellite",
    position: {
      lat,
      lon,
      alt_m: altMeters,
    },
    metadata: {
      name: tle.name,
      country: inferCountry(tle.name),
      country_flag: "🛰️",
      entity_type: orbitalClass,
      speed_knots: 0,
      heading_deg: 0,
      status: "active",
    },
    enrichment: {
      tle_date: tle.date,
      tle_line1: tle.line1,
      tle_line2: tle.line2,
    },
    cached_at: now.toISOString(),
    cache_ttl_seconds: TLE_CACHE_TTL_SECONDS,
  };
}

async function fetchGroup(search: string, limit?: number): Promise<TleMember[]> {
  const collected: TleMember[] = [];
  let page = 1;

  while (true) {
    const response = await axios.get("https://tle.ivanstanojevic.me/api/tle", {
      params: {
        search,
        format: "json",
        page,
      },
      timeout: 12000,
    });

    const parsed = tleResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.warn("Invalid TLE API response shape.", {
        search,
        page,
        issues: parsed.error.issues.length,
      });
      break;
    }

    collected.push(...parsed.data.member);

    if (limit && collected.length >= limit) {
      return collected.slice(0, limit);
    }

    if (!parsed.data.view?.next) {
      break;
    }

    page += 1;
    if (page > 30) {
      break;
    }
  }

  return collected;
}

async function refreshTleCache(): Promise<TleMember[]> {
  const results = await Promise.all(
    groupFetchConfig.map((cfg) => fetchGroup(cfg.search, "limit" in cfg ? cfg.limit : undefined))
  );

  const deduped = new Map<number, TleMember>();
  for (const group of results) {
    for (const tle of group) {
      deduped.set(tle.satelliteId, tle);
    }
  }

  const merged = Array.from(deduped.values());
  inMemoryTles = merged;
  await cacheSet(TLE_CACHE_KEY, merged, TLE_CACHE_TTL_SECONDS);

  logger.info("TLE cache refreshed.", { count: merged.length });
  return merged;
}

async function ensureTlesLoaded(): Promise<TleMember[]> {
  if (inMemoryTles.length) {
    return inMemoryTles;
  }

  const cached = await cacheGet<TleMember[]>(TLE_CACHE_KEY);
  if (cached?.length) {
    inMemoryTles = cached;
    return inMemoryTles;
  }

  try {
    return await refreshTleCache();
  } catch (error) {
    logger.error("Failed to refresh TLE cache.", {
      err: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function emitSatelliteUpdates(): void {
  if (!inMemoryTles.length) {
    return;
  }

  const now = new Date();
  for (const tle of inMemoryTles) {
    const entity = toEntity(tle, now);
    if (entity) {
      enqueueEntityUpdate(entity);
    }
  }
}

export function startTleAdapter(): void {
  void ensureTlesLoaded().then((loaded) => {
    logger.info(`TLEAdapter: loaded ${loaded.length} TLEs`);
  });

  setInterval(() => {
    void refreshTleCache().catch((error) => {
      logger.error("Scheduled TLE refresh failed.", {
        err: error instanceof Error ? error.message : String(error),
      });
    });
  }, REFRESH_INTERVAL_MS);

  setInterval(() => {
    emitSatelliteUpdates();
  }, PROPAGATION_INTERVAL_MS);
}
