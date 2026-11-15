import mongoose from "mongoose";
import { Announcement, Message } from "../models/Communication.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import Notification, { NOTIFICATION_CATEGORIES } from "../models/Notification.js";
import {
  addNotificationStreamClient,
  createNotificationsForUsers,
  dispatchNotificationSafe,
  pushUnreadCountToUser,
  removeNotificationStreamClient,
  resolveActiveUserIdsByRoles,
  resolveUserIdByEmail,
  resolveUserIdsForAnnouncementAudience,
  writeSseEvent,
} from "../services/notification.service.js";

// @desc    Get announcements
// @route   GET /api/communication/announcements
// @access  Private (announcements view)
export const getAnnouncements = async (req, res, next) => {
  try {
    const { category, audience, priority, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    if (audience && audience !== "All") {
      filter.audience = { $in: [audience, "All"] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Role-based audience filtering for students/teachers
    if (req.user.role === "STUDENT") {
      filter.audience = { $in: ["Students", "All"] };
    } else if (req.user.role === "TEACHER") {
      filter.audience = { $in: ["Teachers", "All"] };
    }

    const announcements = await Announcement.find(filter).sort({
      createdAt: -1,
    });

    res.json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new announcement
// @route   POST /api/communication/announcements
// @access  Private (announcements create permission)
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, category, audience, priority ,examDate} = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      category: category || "Academic",
      audience: audience || "All",
      priority: priority || "Medium",
      examDate: examDate || null,
      authorName: req.user.name,
      author: req.user._id,
    });

    await dispatchNotificationSafe(async () => {
      const recipientIds = await resolveUserIdsForAnnouncementAudience(announcement.audience);
      const isEventOrReminder = ["Event", "Holiday"].includes(announcement.category);
      await createNotificationsForUsers({
        recipientIds,
        excludeUserId: req.user._id,
        title: isEventOrReminder ? `Reminder: ${announcement.title}` : announcement.title,
        message: announcement.content,
        category: isEventOrReminder ? "Events and Important Reminders" : "Announcements",
        priority: announcement.priority,
        link: "/communication/announcements",
        actorId: req.user._id,
        actorName: req.user.name,
        metadata: {
          announcementId: announcement._id,
          audience: announcement.audience,
          announcementCategory: announcement.category,
        },
      });
    });

    res.status(201).json({
      success: true,
      message: "Announcement published successfully.",
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/communication/announcements/:id
// @access  Private (announcements delete permission)
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }
    res.json({ success: true, message: "Announcement deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const ROLE_GROUP_LABELS = {
  ALL: "All Users (Teachers, Students & Staff)",
  STUDENT: "All Students",
  TEACHER: "All Teachers",
  ACCOUNTANT: "All Accountants",
  HOD: "All HODs",
};

// @desc    Get valid recipients for Compose Message
// @route   GET /api/communication/messages/recipients
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const getMessageRecipients = async (req, res, next) => {
  try {
    const actorRole = req.user.role;
    const filter = {
      status: "active",
      _id: { $ne: req.user._id },
    };

    if (actorRole === "TEACHER") {
      filter.role = "STUDENT";
    }

    const users = await User.find(filter, "name email role department className rollNumber")
      .sort({ name: 1 })
      .lean();

    const byEmail = new Map();
    for (const u of users) {
      const emailKey = String(u.email || "").trim().toLowerCase();
      if (!emailKey) continue;
      byEmail.set(emailKey, {
        _id: u._id,
        name: u.name,
        email: emailKey,
        role: u.role,
        department: u.department || u.className || "",
      });
    }

    if (actorRole === "TEACHER") {
      const students = await Student.find(
        { status: "active", email: { $exists: true, $ne: "" } },
        "user name email className"
      )
        .sort({ name: 1 })
        .lean();

      for (const s of students) {
        const emailKey = String(s.email || "").trim().toLowerCase();
        if (!emailKey || byEmail.has(emailKey)) continue;
        byEmail.set(emailKey, {
          _id: s.user || undefined,
          name: s.name,
          email: emailKey,
          role: "STUDENT",
          department: s.className || "",
        });
      }
    }

    const recipients = Array.from(byEmail.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const allowedTargets =
      actorRole === "TEACHER"
        ? ["STUDENT", "INDIVIDUAL"]
        : ["ALL", "TEACHER", "STUDENT", "ACCOUNTANT", "HOD", "INDIVIDUAL"];

    res.json({
      success: true,
      recipients,
      allowedTargets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user messages
// @route   GET /api/communication/messages
// @access  Private (messages view)
export const getMessages = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    // Super Admin, Admin, and Principal have institutional message access
    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role)) {
      const userEmail = (req.user.email || "").trim().toLowerCase();
      const emails = new Set();
      if (userEmail) emails.add(userEmail);

      const escapedUserEmail = userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Resolve linked Student or Teacher emails so institutional messages always match
      if (req.user.role === "STUDENT") {
        const studentDoc = await Student.findOne({
          $or: [
            { user: req.user._id },
            ...(userEmail ? [{ email: new RegExp(`^${escapedUserEmail}$`, "i") }] : []),
          ],
        }).lean();
        if (studentDoc?.email) {
          emails.add(studentDoc.email.trim().toLowerCase());
        }
      } else if (req.user.role === "TEACHER") {
        const teacherDoc = await Teacher.findOne({
          $or: [
            { user: req.user._id },
            ...(userEmail ? [{ email: new RegExp(`^${escapedUserEmail}$`, "i") }] : []),
          ],
        }).lean();
        if (teacherDoc?.email) {
          emails.add(teacherDoc.email.trim().toLowerCase());
        }
      }

      const emailRegexes = Array.from(emails).map(
        (e) => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
      );

      filter.$or = [
        { sender: req.user._id },
        { recipientUser: req.user._id },
        { recipientRole: { $in: ["ALL", req.user.role] } },
        ...(emailRegexes.length > 0 ? [{ recipientEmail: { $in: emailRegexes } }] : []),
      ];
    }

    if (status) filter.status = status;

    const messages = await Message.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/communication/messages
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER -> Student(s))
export const sendMessage = async (req, res, next) => {
  try {
    const {
      recipient,
      recipientEmail,
      recipientRole,
      recipientUserId,
      subject,
      content,
      status,
    } = req.body;

    const actorRole = req.user.role;
    const targetRole = String(recipientRole || "INDIVIDUAL").trim().toUpperCase();
    const validTargetRoles = ["INDIVIDUAL", "ALL", "STUDENT", "TEACHER", "ACCOUNTANT", "HOD"];

    if (!validTargetRoles.includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient target role.",
      });
    }

    if (actorRole === "TEACHER" && !["STUDENT", "INDIVIDUAL"].includes(targetRole)) {
      return res.status(403).json({
        success: false,
        message: "Teachers can only send messages to students.",
      });
    }

    const cleanSubject = String(subject || "").trim();
    const cleanContent = String(content || "").trim();
    if (!cleanSubject || !cleanContent) {
      return res.status(400).json({
        success: false,
        message: "Subject and message content are required.",
      });
    }

    let finalRecipientName = String(recipient || "").trim();
    let finalRecipientEmail = String(recipientEmail || "").trim().toLowerCase();
    let resolvedRecipientUserId = null;

    if (targetRole === "INDIVIDUAL") {
      if (recipientUserId && mongoose.Types.ObjectId.isValid(recipientUserId)) {
        const userDoc = await User.findById(recipientUserId, "name email role").lean();
        if (!userDoc) {
          return res.status(404).json({
            success: false,
            message: "Selected recipient user was not found.",
          });
        }
        if (actorRole === "TEACHER" && userDoc.role !== "STUDENT") {
          return res.status(403).json({
            success: false,
            message: "Teachers can only send messages to students.",
          });
        }
        resolvedRecipientUserId = userDoc._id;
        finalRecipientName = finalRecipientName || userDoc.name;
        finalRecipientEmail = finalRecipientEmail || String(userDoc.email || "").toLowerCase();
      } else {
        if (!finalRecipientEmail) {
          return res.status(400).json({
            success: false,
            message: "Recipient email is required for individual messages.",
          });
        }
        const escapedEmail = finalRecipientEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matchedUser = await User.findOne(
          { email: new RegExp(`^${escapedEmail}$`, "i") },
          "name email role"
        ).lean();

        if (matchedUser) {
          if (actorRole === "TEACHER" && matchedUser.role !== "STUDENT") {
            return res.status(403).json({
              success: false,
              message: "Teachers can only send messages to students.",
            });
          }
          resolvedRecipientUserId = matchedUser._id;
          finalRecipientName = finalRecipientName || matchedUser.name;
        } else if (actorRole === "TEACHER") {
          const teacherMatch = await Teacher.findOne(
            { email: new RegExp(`^${escapedEmail}$`, "i") },
            "_id"
          ).lean();
          if (teacherMatch) {
            return res.status(403).json({
              success: false,
              message: "Teachers can only send messages to students.",
            });
          }
        }
      }

      if (!finalRecipientName) {
        finalRecipientName = finalRecipientEmail;
      }
    } else {
      finalRecipientName = finalRecipientName || ROLE_GROUP_LABELS[targetRole] || targetRole;
      finalRecipientEmail = finalRecipientEmail || "";
    }

    const message = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: actorRole,
      recipient: finalRecipientName,
      recipientEmail: finalRecipientEmail,
      ...(resolvedRecipientUserId ? { recipientUser: resolvedRecipientUserId } : {}),
      recipientRole: targetRole,
      subject: cleanSubject,
      content: cleanContent,
      status: status || "Sent",
    });

    if (message.status !== "Draft") {
      await dispatchNotificationSafe(async () => {
        let recipientIds = [];

        if (targetRole === "INDIVIDUAL") {
          const directUserId =
            resolvedRecipientUserId ||
            (finalRecipientEmail ? await resolveUserIdByEmail(finalRecipientEmail) : null);
          if (directUserId) recipientIds = [directUserId];
        } else if (targetRole === "ALL") {
          recipientIds = await resolveActiveUserIdsByRoles([
            "SUPER_ADMIN",
            "ADMIN",
            "PRINCIPAL",
            "HOD",
            "TEACHER",
            "ACCOUNTANT",
            "STUDENT",
          ]);
        } else {
          recipientIds = await resolveActiveUserIdsByRoles([targetRole]);
        }

        if (recipientIds.length > 0) {
          await createNotificationsForUsers({
            recipientIds,
            excludeUserId: req.user._id,
            title: `New Message: ${message.subject}`,
            message: `${req.user.name} sent a message (${finalRecipientName}): ${message.content.slice(0, 140)}`,
            category: "Messages",
            priority: "Medium",
            link: "/communication/messages",
            actorId: req.user._id,
            actorName: req.user.name,
            metadata: { messageId: message._id, recipientRole: targetRole },
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      messageData: message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete message
// @route   DELETE /api/communication/messages/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL; TEACHER own messages only)
export const deleteMessage = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid message ID." });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const isAdminOrPrincipal = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role);
    const isTeacherOwner =
      req.user.role === "TEACHER" &&
      message.sender &&
      String(message.sender) === String(req.user._id);

    if (!isAdminOrPrincipal && !isTeacherOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to delete this message.",
      });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Notification Center Handlers (Strictly Scoped to Authenticated User)
// ============================================================================

async function getNotificationSummaryCounts(userId) {
  const [totalCount, unreadCount] = await Promise.all([
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    totalCount,
    unreadCount,
    readCount: Math.max(0, totalCount - unreadCount),
  };
}

async function setNotificationReadState(req, res, next, isRead) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      {
        $set: {
          isRead,
          readAt: isRead ? new Date() : null,
        },
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found for your account.",
      });
    }

    await pushUnreadCountToUser(req.user._id);
    const summary = await getNotificationSummaryCounts(req.user._id);

    res.json({
      success: true,
      message: isRead ? "Notification marked as read." : "Notification marked as unread.",
      notification,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get current user's notifications
// @route   GET /api/communication/notifications
// @access  Private (own notifications only)
export const getNotifications = async (req, res, next) => {
  try {
    const { status, category, search, limit } = req.query;
    const filter = { recipient: req.user._id };

    if (status === "unread") filter.isRead = false;
    else if (status === "read") filter.isRead = true;

    if (category && category !== "All" && NOTIFICATION_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    if (search && String(search).trim()) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ title: regex }, { message: regex }, { category: regex }];
    }

    const query = Notification.find(filter).sort({ createdAt: -1 });
    const parsedLimit = Number.parseInt(String(limit ?? ""), 10);
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      query.limit(parsedLimit);
    }

    const [notifications, summary] = await Promise.all([
      query.lean(),
      getNotificationSummaryCounts(req.user._id),
    ]);

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      count: notifications.length,
      notifications,
      categories: NOTIFICATION_CATEGORIES,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's unread notification count
// @route   GET /api/communication/notifications/unread-count
// @access  Private (own notifications only)
export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Real-time SSE stream for current user's notifications
// @route   GET /api/communication/notifications/stream
// @access  Private (own notifications only)
export const streamNotifications = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const userId = req.user._id;
  addNotificationStreamClient(userId, res);

  try {
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
    writeSseEvent(res, "notification", { unreadCount });
  } catch {
    // Keep stream alive even if initial count lookup fails transiently
  }

  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(": keepalive\n\n");
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeNotificationStreamClient(userId, res);
  });
};

// @desc    Mark a notification as read
// @route   PUT /api/communication/notifications/:id/read
// @access  Private (own notification only)
export const markNotificationRead = (req, res, next) =>
  setNotificationReadState(req, res, next, true);

// @desc    Mark a notification as unread
// @route   PUT /api/communication/notifications/:id/unread
// @access  Private (own notification only)
export const markNotificationUnread = (req, res, next) =>
  setNotificationReadState(req, res, next, false);

// @desc    Mark all current user's notifications as read
// @route   PUT /api/communication/notifications/read-all
// @access  Private (own notifications only)
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    await pushUnreadCountToUser(req.user._id);
    const summary = await getNotificationSummaryCounts(req.user._id);

    res.json({
      success: true,
      message: "All notifications marked as read.",
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete one notification belonging to current user
// @route   DELETE /api/communication/notifications/:id
// @access  Private (own notification only)
export const deleteNotification = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found for your account.",
      });
    }

    await pushUnreadCountToUser(req.user._id);
    const summary = await getNotificationSummaryCounts(req.user._id);

    res.json({
      success: true,
      message: "Notification deleted successfully.",
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};
