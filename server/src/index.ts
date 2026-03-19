import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler, notFound } from "./middleware/error.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import snippetRoutes from "./routes/snippets.js";
import syncRoutes from "./routes/sync.js";
import tagRoutes from "./routes/tags.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (config.isAllowedClientOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin ?? "unknown"} is not allowed by CORS.`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/snippets", snippetRoutes);
app.use("/api/sync", syncRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Snippet Manager API listening on port ${config.port}`);
});
