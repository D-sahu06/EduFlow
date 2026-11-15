import express from "express";
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  getExamResults,
  submitResult,
  getReportCard,
} from "../controllers/exam.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorizePermission("examinations", "examManagement", "view"),
  getExams
);

router.post(
  "/",
  authorizePermission("examinations", "examManagement", "create"),
  createExam
);

router.put(
  "/:id",
  authorizePermission("examinations", "examManagement", "edit"),
  updateExam
);

router.delete(
  "/:id",
  authorizePermission("examinations", "examManagement", "delete"),
  deleteExam
);

router.get(
  "/results",
  authorizePermission("examinations", "resultDashboard", "view"),
  getExamResults
);

router.post(
  "/results",
  authorizePermission("examinations", "resultProcessing", "create"),
  submitResult
);

router.post(
  "/:id/results",
  authorizePermission("examinations", "resultProcessing", "create"),
  submitResult
);

router.get(
  "/report-card/:studentId",
  authorizePermission("examinations", "reportCard", "view"),
  getReportCard
);

export default router;
