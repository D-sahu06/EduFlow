import express from "express";
import {
  getDashboardOverview,
  getAcademicReport,
  getFinanceReport,
} from "../controllers/report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/overview",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  getDashboardOverview
);

router.get(
  "/academic",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getAcademicReport
);

router.get(
  "/fees",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"),
  getFinanceReport
);

export default router;
