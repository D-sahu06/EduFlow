import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from "../controllers/user.controller.js";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles, authorizePermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

// Require authentication for all user routes
router.use(authenticate);

// Profile endpoints (must precede /:id)
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// Administrative User Management
router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getUsers
);

router.get("/:id", getUserById);

router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  createUser
);

router.put(
  "/:id/reset-password",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  authorizePermission("roleManagement", "resetPassword", "edit"),
  resetUserPassword
);

router.put(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateUser
);

router.delete(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  authorizePermission("roleManagement", "userRoleAssignment", "delete"),
  deleteUser
);

export default router;
