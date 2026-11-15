import express from "express";
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  assignSubjects,
  deleteTeacher,
} from "../controllers/teacher.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizePermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorizePermission("teachers", "allTeachers", "view"),
  getTeachers
);

router.get(
  "/:id",
  authorizePermission("teachers", "allTeachers", "view"),
  getTeacherById
);

router.post(
  "/",
  authorizePermission("teachers", "createTeacher", "create"),
  createTeacher
);

router.put(
  "/:id",
  authorizePermission("teachers", "editTeacher", "edit"),
  updateTeacher
);

router.post(
  "/assign-subjects",
  authorizePermission("teachers", "assignSubjects", "edit"),
  assignSubjects
);

router.post(
  "/:id/assign-subjects",
  authorizePermission("teachers", "assignSubjects", "edit"),
  assignSubjects
);

router.delete(
  "/:id",
  authorizePermission("teachers", "allTeachers", "delete"),
  deleteTeacher
);

export default router;
