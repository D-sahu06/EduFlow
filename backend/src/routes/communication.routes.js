import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getMessageRecipients,
  getMessages,
  sendMessage,
  deleteMessage,
  getNotifications,
  getUnreadNotificationCount,
  streamNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/communication.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizePermission, authorizeRoles } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/announcements",
  authorizePermission("communication", "announcements", "view"),
  getAnnouncements
);

router.post(
  "/announcements",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  authorizePermission("communication", "announcements", "create"),
  createAnnouncement
);

router.delete(
  "/announcements/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  authorizePermission("communication", "announcements", "delete"),
  deleteAnnouncement
);

router.get(
  "/messages/recipients",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  authorizePermission("communication", "messages", "create"),
  getMessageRecipients
);

router.get(
  "/messages",
  authorizePermission("communication", "messages", "view"),
  getMessages
);

router.post(
  "/messages",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  authorizePermission("communication", "messages", "create"),
  sendMessage
);

router.delete(
  "/messages/:id",
  authorizeRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  authorizePermission("communication", "messages", "delete"),
  deleteMessage
);

// Notifications Center Routes (strictly user-scoped in controller)
router.get(
  "/notifications",
  authorizePermission("communication", "notifications", "view"),
  getNotifications
);

router.get(
  "/notifications/unread-count",
  authorizePermission("communication", "notifications", "view"),
  getUnreadNotificationCount
);

router.get(
  "/notifications/stream",
  authorizePermission("communication", "notifications", "view"),
  streamNotifications
);

router.put(
  "/notifications/read-all",
  authorizePermission("communication", "notifications", "view"),
  markAllNotificationsRead
);

router.put(
  "/notifications/:id/read",
  authorizePermission("communication", "notifications", "view"),
  markNotificationRead
);

router.put(
  "/notifications/:id/unread",
  authorizePermission("communication", "notifications", "view"),
  markNotificationUnread
);

router.delete(
  "/notifications/:id",
  authorizePermission("communication", "notifications", "view"),
  deleteNotification
);

export default router;
