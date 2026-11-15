import express from "express";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  promoteStudents,
  deleteStudent,
  uploadStudentDocument,
  updateStudentDocumentStatus,
  deleteStudentDocument,
} from "../controllers/student.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizePermission, authorizeRoles } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorizePermission("students", "allStudents", "view"),
  getStudents
);

router.post(
  "/documents",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"),
  authorizePermission("students", "studentDocuments", "create"),
  uploadStudentDocument
);

router.put(
  "/:id/documents/:docId/status",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  authorizePermission("students", "studentDocuments", "approve"),
  updateStudentDocumentStatus
);

router.delete(
  "/:id/documents/:docId",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  authorizePermission("students", "studentDocuments", "delete"),
  deleteStudentDocument
);

router.get(
  "/:id",
  authorizePermission("students", "allStudents", "view"),
  getStudentById
);

router.post(
  "/",
  authorizePermission("students", "createStudent", "create"),
  createStudent
);

router.put(
  "/:id",
  authorizePermission("students", "editStudent", "edit"),
  updateStudent
);

router.post(
  "/promote",
  authorizePermission("students", "studentPromotion", "approve"),
  promoteStudents
);

router.delete(
  "/:id",
  authorizePermission("students", "allStudents", "delete"),
  deleteStudent
);

export default router;
