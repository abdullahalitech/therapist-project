import app from "./app";
import { config } from "./config";
import { connectDB } from "./config/db";

let server: ReturnType<typeof app.listen> | null = null;

async function start() {
  await connectDB();

  if (server) {
    server.close();
  }

  server = app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
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
