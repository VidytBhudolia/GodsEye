import axios from "axios";
import { z } from "zod";
import { Entity } from "../../../../shared/contract";
import { upsertEntities } from "../database/supabaseClient";
import { queueEntityUpdate } from "../../websocket/batchedBroadcast";
import { logger } from "../../utils";

const AIRPLANES_LIVE_MIL_URL = "https://api.airplanes.live/v2/mil";
const POLL_INTERVAL_MS = 15_000;

const aircraftSchema = z
  .object({
    hex: z.string().trim().min(1),
    flight: z.string().optional().nullable(),
    lat: z.number().optional().nullable(),
    lon: z.number().optional().nullable(),
    alt_baro: z.union([z.number(), z.string()]).optional().nullable(),
    gs: z.number().optional().nullable(),
    track: z.number().optional().nullable(),
  })
  .passthrough();

const responseSchema = z.object({
  ac: z.array(aircraftSchema).default([]),
});

function parseAltitudeMeters(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 0.3048;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed * 0.3048;
    }
  }

  return 0;
}

function deriveCountryFromHex(hex: string): string {
  const prefix = hex.trim().toUpperCase().slice(0, 2);

  if (prefix === "AE") {
    return "US military";
  }

  if (prefix === "43") {
    return "UK";
  }

  if (prefix === "3C") {
    return "DE";
  }

  return "UNKNOWN";
}

function deriveCountryFlag(country: string): string {
  if (country === "US military") {
    return "US";
  }
  if (country === "UK") {
    return "UK";
  }
  if (country === "DE") {
    return "DE";
  }
  return "UNKNOWN";
}

function normalizeMilitaryAircraft(raw: z.infer<typeof aircraftSchema>): Entity | null {
  const lat = typeof raw.lat === "number" ? raw.lat : null;
  const lon = typeof raw.lon === "number" ? raw.lon : null;

  if (lat === null || lon === null) {
    return null;
  }

  const hex = raw.hex.trim().toLowerCase();
  const callsign = typeof raw.flight === "string" ? raw.flight.trim() : "";
  const country = deriveCountryFromHex(hex);

  return {
    id: `mil-${hex}`,
    type: "aircraft",
    position: {
      lat,
      lon,
      alt_m: parseAltitudeMeters(raw.alt_baro),
    },
    metadata: {
      name: callsign || hex,
      country,
      country_flag: deriveCountryFlag(country),
      entity_type: "MILITARY",
      speed_knots: typeof raw.gs === "number" && Number.isFinite(raw.gs) ? raw.gs : 0,
      heading_deg: typeof raw.track === "number" && Number.isFinite(raw.track) ? raw.track : 0,
      status: "active",
      icao24: hex,
      callsign: callsign || undefined,
    },
    cached_at: new Date().toISOString(),
    cache_ttl_seconds: Math.round(POLL_INTERVAL_MS / 1000),
  };
}

async function pollMilitaryAircraft(): Promise<void> {
  try {
    const response = await axios.get(AIRPLANES_LIVE_MIL_URL, {
      timeout: 12000,
    });

    const parsed = responseSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.warn("AirplanesLive: invalid response payload.", {
        issues: parsed.error.issues.length,
      });
      return;
    }

    const entities: Entity[] = parsed.data.ac
      .map((aircraft) => normalizeMilitaryAircraft(aircraft))
      .filter((entity): entity is Entity => entity !== null);

    // Frontend: military aircraft render in aircraft layer. entity_type=MILITARY can be used for filter UI.
    entities.forEach((entity) => {
      queueEntityUpdate(entity);
    });

    // TODO: add opt-in history for mil aircraft in Phase 6.
    if (entities.length > 0) {
      await upsertEntities(entities);
    }

    logger.info(`AirplanesLive: received ${entities.length} military aircraft`);
  } catch (error) {
    logger.warn("AirplanesLive poll failed.", {
      err: error instanceof Error ? error.message : String(error),
    });
  }
}

export function startAirplanesLiveAdapter(): void {
  logger.info("AirplanesLive adapter started (military aircraft)");

  void pollMilitaryAircraft();
  setInterval(() => {
    void pollMilitaryAircraft();
  }, POLL_INTERVAL_MS);
}
