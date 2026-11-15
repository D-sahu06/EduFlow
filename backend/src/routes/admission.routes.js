import express from "express";
import {
  getApplications,
  submitApplication,
  updateApplicationStatus,
  getMeritList,
  getAdmissionStats,
} from "../controllers/admission.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

// Public route to apply for admission
router.post("/apply", submitApplication);

// Protected routes
router.get(
  "/stats",
  authenticate,
  authorizePermission("admission", "admissionDashboard", "view"),
  getAdmissionStats
);
router.get(
  "/applications",
  authenticate,
  authorizePermission("admission", "applications", "view"),
  getApplications
);

router.put(
  "/applications/:id/status",
  authenticate,
  authorizePermission("admission", "applications", "approve"),
  updateApplicationStatus
);

router.get(
  "/merit-list",
  authenticate,
  authorizePermission("admission", "meritList", "view"),
  getMeritList
);

export default router;
