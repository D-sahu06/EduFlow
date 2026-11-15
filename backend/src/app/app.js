import express from "express";
import cors from "cors";

// Routes
import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";
import studentRoutes from "../routes/student.routes.js";
import teacherRoutes from "../routes/teacher.routes.js";
import attendanceRoutes from "../routes/attendance.routes.js";
import feeRoutes from "../routes/fee.routes.js";
import examRoutes from "../routes/exam.routes.js";
import admissionRoutes from "../routes/admission.routes.js";
import communicationRoutes from "../routes/communication.routes.js";
import reportRoutes from "../routes/report.routes.js";
import searchRoutes from "../routes/search.routes.js";

// Error Middleware
import { notFound, errorHandler } from "../middleware/error.middleware.js";

const app = express();

// Core Middleware
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EduFlow ERP Backend API",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/search", searchRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
