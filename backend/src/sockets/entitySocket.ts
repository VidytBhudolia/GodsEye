import { Server as SocketIOServer } from "socket.io";
import { z } from "zod";
import {
  initializeEntityBatchBroadcaster,
  removeSocketViewport,
  updateSocketViewport,
} from "../websocket";
import { logger } from "../utils";

let ioInstance: SocketIOServer | null = null;

const viewportSchema = z.union([
  z.object({
    west: z.number(),
    south: z.number(),
    east: z.number(),
    north: z.number(),
  }),
  z.object({
    lomin: z.number(),
    lamin: z.number(),
    lomax: z.number(),
    lamax: z.number(),
  }),
]);

function toOpenSkyBounds(payload: z.infer<typeof viewportSchema>) {
  if ("west" in payload) {
    return {
      lomin: payload.west,
      lamin: payload.south,
      lomax: payload.east,
      lamax: payload.north,
    };
  }

  return payload;
}

export function registerEntitySocket(io: SocketIOServer): void {
  ioInstance = io;
  initializeEntityBatchBroadcaster(io);
  
  io.on("connection", (socket) => {
    logger.info("Socket client connected.", { socketId: socket.id });

    const pingInterval = setInterval(() => {
      socket.emit("ping", {
        message: "test ping",
        timestamp: new Date().toISOString(),
      });
    }, 5000);

    socket.on("viewport:update", (payload) => {
      const parsed = viewportSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("viewport:ack", {
          ok: false,
          error: "invalid viewport payload",
        });
        return;
      }

      const bounds = toOpenSkyBounds(parsed.data);
      const accepted = updateSocketViewport(socket.id, bounds);

      if (!accepted) {
        socket.emit("viewport:ack", {
          ok: false,
          error: "invalid viewport bounds",
        });
        return;
      }

      socket.emit("viewport:ack", {
        ok: true,
        updated_at: new Date().toISOString(),
      });
    });

    socket.on("disconnect", (reason) => {
      clearInterval(pingInterval);
      removeSocketViewport(socket.id);
      logger.info("Socket client disconnected.", { socketId: socket.id, reason });
    });
  });
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}
