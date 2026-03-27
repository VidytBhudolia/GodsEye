import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import healthRouter from "./routes/health";
import { registerEntitySocket } from "./sockets/entitySocket";
import entitiesRouter from "./routes/entities";
import summarizeRouter from "./routes/summarize";
import { startAisStream } from "./services/adapters/AISAdapter";
import { startOpenSkyPolling } from "./jobs/openskyPolling";

dotenv.config({ path: "../.env" });

const requiredEnvs = [
  "AISSTREAM_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "REDIS_URL",
  "GROQ_API_KEY"
];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.warn(`[GodsEye] WARNING: Missing environment variable: ${env}. Some features may be disabled.`);
  }
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

// WebSocket
registerEntitySocket(io);

// Start Data Adapters
startAisStream();
startOpenSkyPolling();

// Start
const PORT = parseInt(process.env.PORT || "4000", 10);
server.listen(PORT, () => {
  console.log(`[GodsEye] Server running on port ${PORT}`);
  console.log(`[GodsEye] Health check: http://localhost:${PORT}/health`);
});

export default app;
