import { Server as SocketIOServer } from "socket.io";

export function registerEntitySocket(io: SocketIOServer): void {
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    const pingInterval = setInterval(() => {
      socket.emit("ping", {
        message: "test ping",
        timestamp: new Date().toISOString(),
      });
    }, 5000);

    socket.on("disconnect", (reason) => {
      clearInterval(pingInterval);
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });
}
