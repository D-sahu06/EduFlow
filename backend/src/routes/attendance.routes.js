import express from "express";
import {
  markAttendance,
  getAttendance,
  getAttendanceStats,
  getMyAttendance,
  getMyAttendanceStats,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
  deleteLeaveRequest,
} from "../controllers/attendance.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/self", getMyAttendance);
router.get("/self/stats", getMyAttendanceStats);
router.get("/stats", getAttendanceStats);

router.get(
  "/",
  authorizePermission("attendance", "viewAttendance", "view"),
  getAttendance
);

router.post(
  "/mark",
  authorizePermission("attendance", "markAttendance", "create"),
  markAttendance
);

router.put(
  "/:id",
  authorizePermission("attendance", "markAttendance", "edit"),
  updateAttendanceRecord
);

router.delete(
  "/:id",
  authorizePermission("attendance", "markAttendance", "delete"),
  deleteAttendanceRecord
);

router.get("/leaves", getLeaveRequests);
router.post("/leaves", createLeaveRequest);

router.put(
  "/leaves/:id/status",
  authorizePermission("attendance", "leaveManagement", "approve"),
  updateLeaveStatus
);

router.delete("/leaves/:id", deleteLeaveRequest);

export default router;
