import WebSocket from "ws";
import { normalizeAisMessage } from "./Normalizer";
import { getIO } from "../../sockets/entitySocket";
import { upsertEntities } from "../database/supabaseClient";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const MAX_RETRIES = 5;

export function startAisStream(retryCount = 0) {
  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ws.on("open", () => {
    console.log("[AIS] Connected");
    
    // Crucial: AIS Stream requires this subscription message on connect 
    // or it closes connection after 3s.
    ws.send(JSON.stringify({
      APIKey: process.env.AISSTREAM_API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
      FilterMessageTypes: ["PositionReport", "ShipStaticData"]
    }));
  });

  ws.on("message", async (data) => {
    try {
      const raw = JSON.parse(data.toString());
      const entity = normalizeAisMessage(raw);
      if (entity) {
        const io = getIO();
        if (io) io.emit("entity:update", entity);
        
        await upsertEntities([entity]);
      }
    } catch (err: any) {
      console.error("[AIS] Parse Error:", err.message);
    }
  });

  ws.on("close", () => {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`[AIS] Closed. Reconnecting in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => startAisStream(retryCount + 1), delay);
    } else {
      console.error("[AIS] Max retries reached.");
    }
  });

  ws.on("error", (err) => {
    console.error("[AIS] Error:", err.message);
  });
}
