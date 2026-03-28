import axios from "axios";
import { z } from "zod";
import { normalizeOpenSkyState } from "./Normalizer";
import { Entity } from "../../../../shared/contract";
import dotenv from "dotenv";
import { logger } from "../../utils";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const stateVectorSchema = z.array(z.unknown()).min(17);
const openSkyResponseSchema = z.object({
  states: z.array(z.unknown()).nullable(),
});

export type OpenSkyBbox = {
  lamin: number;
  lamax: number;
  lomin: number;
  lomax: number;
};

export async function fetchOpenSkyStates(bbox?: OpenSkyBbox): Promise<Entity[]> {
  try {
    const username = process.env.OPENSKY_USERNAME || process.env.OPENSKY_EMAIL || "";
    const password = process.env.OPENSKY_PASSWORD || process.env.OPENSKY_CLIENT_SECRET || "";

    const headers: Record<string, string> = {};
    if (username && password) {
      // SECURITY: FIXED - Credentials are sourced from process.env only.
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");
      headers.Authorization = `Basic ${credentials}`;
    } else {
      logger.warn("OpenSky credentials missing; using unauthenticated request mode.");
    }

    const response = await axios.get("https://api.opensky-network.org/states/all", {
      headers,
      params: bbox
        ? {
            lamin: bbox.lamin,
            lamax: bbox.lamax,
            lomin: bbox.lomin,
            lomax: bbox.lomax,
          }
        : undefined,
      timeout: 15000,
    });

    // SECURITY: FIXED - Validate external API payload before normalization.
    const parsed = openSkyResponseSchema.safeParse(response.data);
    if (!parsed.success || !parsed.data.states) {
      return [];
    }

    const entities: Entity[] = [];
    for (const rawState of parsed.data.states) {
      const validatedState = stateVectorSchema.safeParse(rawState);
      if (!validatedState.success) {
        continue;
      }

      entities.push(normalizeOpenSkyState(validatedState.data));
    }

    return entities;
  } catch (error) {
    logger.error("OpenSky fetch failed.", {
      err: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
