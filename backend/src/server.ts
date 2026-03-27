import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import healthRouter from "./routes/health";
import { registerEntitySocket } from "./sockets/entitySocket";

dotenv.config({ path: "../.env" });

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

// WebSocket
registerEntitySocket(io);

// Start
const PORT = parseInt(process.env.PORT || "4000", 10);
server.listen(PORT, () => {
  console.log(`[GodsEye] Server running on port ${PORT}`);
  console.log(`[GodsEye] Health check: http://localhost:${PORT}/health`);
});

export default app;
