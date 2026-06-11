// backend/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import certificatesRouter from "./routes/certificates.js";
import paymentsRouter from "./routes/payments.js";
import studentsRouter from "./routes/students.js";
import activityLogsRouter from "./routes/activityLogs.js";
import institutionSettingsRouter from "./routes/institutionSettings.js";

dotenv.config();

const app = express();

const parseCorsOrigins = (value = "") => {
  return String(value)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  ...parseCorsOrigins(process.env.CORS_ORIGINS),
].filter(Boolean);

const uniqueAllowedOrigins = Array.from(new Set(allowedOrigins));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || uniqueAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "20mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BlockCred Backend is running.",
    service: "BlockCred API",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BlockCred API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/certificates", certificatesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/students", studentsRouter);
app.use("/api/activity-logs", activityLogsRouter);
app.use("/api/institution-settings", institutionSettingsRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "This frontend origin is not allowed by the backend CORS policy.",
    });
  }

  return res.status(error.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : error.message || "Internal server error.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BlockCred backend running on port ${PORT}`);
});
