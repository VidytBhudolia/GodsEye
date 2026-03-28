import WebSocket from "ws";
import { z } from "zod";
import { normalizeAisMessage } from "./Normalizer";
import { enqueueEntityUpdate } from "../../websocket";
import { upsertEntities } from "../database/supabaseClient";
import { writeHistorySnapshot } from "../database/historyWriter";
import dotenv from "dotenv";
import { logger } from "../../utils";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const MAX_RETRIES = 5;

const aisEnvelopeSchema = z
  .object({
    MessageType: z.string(),
    Message: z.record(z.string(), z.unknown()).optional(),
    MetaData: z
      .object({
        MMSI: z.union([z.string(), z.number()]),
      })
      .passthrough(),
  })
  .passthrough();

export function startAisStream(retryCount = 0) {
  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ws.on("open", () => {
    logger.info("AIS connected.");

    const apiKey = process.env.AISSTREAM_API_KEY || process.env.AIS_STREAM_API_KEY;
    if (!apiKey) {
      // SECURITY: FIXED - Read credentials only from env and fail safely if missing.
      logger.error("AIS stream API key is missing; closing AIS socket.");
      ws.close();
      return;
    }
    
    // Crucial: AIS Stream requires this subscription message on connect 
    // or it closes connection after 3s.
    ws.send(JSON.stringify({
      APIKey: apiKey,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
      FilterMessageTypes: ["PositionReport", "ShipStaticData"]
    }));
  });

  ws.on("message", async (data) => {
    try {
      const raw = JSON.parse(data.toString());
      // SECURITY: FIXED - Validate external WS payload before normalization.
      const parsed = aisEnvelopeSchema.safeParse(raw);
      if (!parsed.success) {
        logger.warn("AIS payload validation failed.", { issues: parsed.error.issues.length });
        return;
      }

      const entity = normalizeAisMessage(parsed.data);
      if (entity) {
        enqueueEntityUpdate(entity);

        writeHistorySnapshot(entity);
        
        await upsertEntities([entity]);
      }
    } catch (err: any) {
      logger.error("AIS parse error.", { err: err?.message || "Unknown error" });
    }
  });

  ws.on("close", () => {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      logger.warn("AIS closed; reconnect scheduled.", {
        delay,
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });
      setTimeout(() => startAisStream(retryCount + 1), delay);
    } else {
      logger.error("AIS max retries reached.");
    }
  });

  ws.on("error", (err) => {
    logger.error("AIS socket error.", { err: err.message });
  });
}
