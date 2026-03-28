import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import healthRouter from "./routes/health";
import { registerEntitySocket } from "./sockets/entitySocket";
import entitiesRouter from "./routes/entities";
import summarizeRouter from "./routes/summarize";
import analysisRouter from "./routes/analysis";
import historyRouter from "./routes/history";
import { startAisStream } from "./services/adapters/AISAdapter";
import { startOpenSkyPolling } from "./jobs/openskyPolling";
import { startTleAdapter } from "./services/adapters/TLEAdapter";
import { logger } from "./utils";

dotenv.config({ path: "../.env" });

const requiredEnvs = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "REDIS_URL", "GROQ_API_KEY"];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    // SECURITY: FIXED - Do not crash on missing envs; emit structured warning and degrade gracefully.
    logger.warn("Missing environment variable. Some features may be disabled.", { env });
  }
}

if (!process.env.AISSTREAM_API_KEY && !process.env.AIS_STREAM_API_KEY) {
  // SECURITY: FIXED - Support both env key names and warn when neither is set.
  logger.warn("Missing AIS stream API key (AISSTREAM_API_KEY or AIS_STREAM_API_KEY).");
}

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use(healthRouter);
app.use("/api/entities", entitiesRouter);
app.use("/api/entities", summarizeRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/history", historyRouter);

// WebSocket
registerEntitySocket(io);

// Start Data Adapters
try {
  startAisStream();
} catch (error) {
  logger.error("Failed to start AIS adapter.", {
    err: error instanceof Error ? error.message : String(error),
  });
}

try {
  startOpenSkyPolling();
} catch (error) {
  logger.error("Failed to start OpenSky polling.", {
    err: error instanceof Error ? error.message : String(error),
  });
}

try {
  startTleAdapter();
} catch (error) {
  logger.error("Failed to start TLE adapter.", {
    err: error instanceof Error ? error.message : String(error),
  });
}

// Start
const PORT = parseInt(process.env.PORT || "4000", 10);
server.listen(PORT, () => {
  logger.info("Server started.", {
    port: PORT,
    health: `http://localhost:${PORT}/health`,
  });
});

export default app;
