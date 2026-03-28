import { fetchOpenSkyStates } from "../services/adapters/OpenSkyAdapter";
import { cacheExists, cacheSet, cacheGet } from "../services/cache/redisClient";
import { upsertEntities } from "../services/database/supabaseClient";
import { writeHistorySnapshot } from "../services/database/historyWriter";
import { enqueueEntityUpdate } from "../websocket";
import { logger } from "../utils";

export function startOpenSkyPolling() {
  const POLLING_INTERVAL_MS = 60000;
  
  const poll = async () => {
    try {
      const exists = await cacheExists("opensky:states:all");
      if (exists) {
        logger.info("OpenSky fetch skipped; using cache.");
        // Emit from cache through the batch broadcaster.
        const cachedEntities = await cacheGet<any[]>("opensky:states:all");
        if (cachedEntities) {
          cachedEntities.forEach((entity) => enqueueEntityUpdate(entity));
        }
        return;
      }
      
      logger.info("OpenSky fetching from API.");
      const entities = await fetchOpenSkyStates();
      
      await cacheSet("opensky:states:all", entities, 60);
      await upsertEntities(entities);

      entities.forEach((entity) => {
        writeHistorySnapshot(entity);
        enqueueEntityUpdate(entity);
      });
      
      logger.info("OpenSky saved and emitted entities.", { count: entities.length });
    } catch (err: any) {
      logger.error("OpenSky polling failed.", { err: err?.message || "Unknown error" });
    }
  };

  setInterval(poll, POLLING_INTERVAL_MS);
  
  // Initial run
  poll();
}
