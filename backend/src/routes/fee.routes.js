import express from "express";
import {
  getFeeStats,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeDues,
  getFeeReceipts,
  recordPayment,
} from "../controllers/fee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/stats",
  authorizePermission("finance", "financeDashboard", "view"),
  getFeeStats
);

router.get(
  "/structures",
  authorizePermission("finance", "feesStructure", "view"),
  getFeeStructures
);

router.post(
  "/structures",
  authorizePermission("finance", "feesStructure", "create"),
  createFeeStructure
);

router.put(
  "/structures/:id",
  authorizePermission("finance", "feesStructure", "edit"),
  updateFeeStructure
);

router.delete(
  "/structures/:id",
  authorizePermission("finance", "feesStructure", "delete"),
  deleteFeeStructure
);

router.get(
  "/dues",
  authorizePermission("finance", "pendingDues", "view"),
  getFeeDues
);

router.get(
  "/receipts",
  authorizePermission("finance", "receipts", "view"),
  getFeeReceipts
);

router.post(
  "/pay",
  authorizePermission("finance", "receipts", "create"),
  recordPayment
);

export default router;
