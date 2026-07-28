import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { config } from "./config";
import authRoutes from "./routes/auth.routes";
import therapistsRoutes from "./routes/therapists.routes";
import bookingsRoutes from "./routes/bookings.routes";
import reviewsRoutes from "./routes/reviews.routes";
import therapistRoutes from "./routes/therapist.routes";
import adminRoutes from "./routes/admin.routes";
import contentRoutes from "./routes/content.routes";
import { handleMulterError } from "./middleware/upload";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
});

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/therapists", therapistsRoutes);
app.use("/api/v1/bookings", bookingsRoutes);
app.use("/api/v1/reviews", reviewsRoutes);
app.use("/api/v1/therapist", therapistRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", contentRoutes);

app.use(handleMulterError);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
