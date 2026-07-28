import http from "http";
import app from "./app";
import { config } from "./config";
import { connectDB } from "./config/db";
import { initSocket } from "./socket";
import { setChatIo } from "./services/chatRealtime";

let httpServer: http.Server | null = null;

async function start() {
  await connectDB();

  if (httpServer) {
    httpServer.close();
  }

  httpServer = http.createServer(app);
  const io = initSocket(httpServer);
  setChatIo(io);

  httpServer.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use`);
    } else {
      console.error("Server error:", err);
    }
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
