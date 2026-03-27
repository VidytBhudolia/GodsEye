import { fetchOpenSkyStates } from "../services/adapters/OpenSkyAdapter";
import { cacheExists, cacheSet, cacheGet } from "../services/cache/redisClient";
import { upsertEntities } from "../services/database/supabaseClient";
import { getIO } from "../sockets/entitySocket";

export function startOpenSkyPolling() {
  const POLLING_INTERVAL_MS = 60000;
  
  const poll = async () => {
    try {
      const exists = await cacheExists("opensky:states:all");
      if (exists) {
        console.log("[OpenSky] Skipped API fetch, cache exists.");
        // Emit from cache directly
        const cachedEntities = await cacheGet<any[]>("opensky:states:all");
        const io = getIO();
        if (io && cachedEntities) {
           cachedEntities.forEach(e => io.emit("entity:update", e));
        }
        return;
      }
      
      console.log("[OpenSky] Fetching from API...");
      const entities = await fetchOpenSkyStates();
      
      await cacheSet("opensky:states:all", entities, 60);
      await upsertEntities(entities);
      
      const io = getIO();
      if (io) {
        entities.forEach(entity => io.emit("entity:update", entity));
      }
      
      console.log(`[OpenSky] Saved and emitted ${entities.length} entities.`);
    } catch (err: any) {
      console.error("[OpenSky] Polling Error:", err.message);
    }
  };

  setInterval(poll, POLLING_INTERVAL_MS);
  
  // Initial run
  poll();
}
