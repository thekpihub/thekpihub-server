import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import chatRouter from "./routes/chat.js";
import executeRouter from "./routes/execute.js";
import ragRouter from "./routes/rag.js";
import imageRouter from "./routes/image.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/execute", executeRouter);
app.use("/api/rag", ragRouter);
app.use("/api/image", imageRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0", model: "claude-opus-4-7" });
});

app.listen(PORT, () => {
  console.log(`🚀 Ditto Wingman backend running on port ${PORT}`);
  console.log(`   Model: Claude Opus 4.7`);
  console.log(`   RAG: enabled`);
  console.log(`   Autonomous agents: enabled`);
});

export default app;
