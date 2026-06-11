// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import certificatesRoutes from "./routes/certificates.js";
import studentsRoutes from "./routes/students.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Allow React frontend to communicate with backend
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Allow backend to receive JSON data
app.use(express.json());

// Allow backend to receive form data text fields
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "BlockCred backend is running",
  });
});

// Certificate API routes
app.use("/api/certificates", certificatesRoutes);
app.use("/api/students", studentsRoutes);

// 404 route
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});