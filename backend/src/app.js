import express from "express";
import cors from "cors";
import emailRoutes from "./routes/emailRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/emails", emailRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
