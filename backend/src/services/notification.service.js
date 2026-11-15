import mongoose from "mongoose";
import Notification, { NOTIFICATION_CATEGORIES } from "../models/Notification.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

// Active SSE connections keyed by stringified user _id
const streamClientsByUser = new Map();

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFlexibleClassRegex(className) {
  const core = String(className || "")
    .trim()
    .toLowerCase()
    .replace(/^class\s+/i, "")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ");

  if (!core) return null;
  if (/^\d+$/.test(core)) {
    return new RegExp(`^(?:class\\s+)?${escapeRegex(core)}(?:st|nd|rd|th)?$`, "i");
  }
  return new RegExp(`^(?:class\\s+)?${escapeRegex(core)}$`, "i");
}

export function writeSseEvent(res, eventName, data) {
  if (!res || res.writableEnded || res.destroyed) return;
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function addNotificationStreamClient(userId, res) {
  const key = String(userId);
  if (!streamClientsByUser.has(key)) {
    streamClientsByUser.set(key, new Set());
  }
  streamClientsByUser.get(key).add(res);
}

export function removeNotificationStreamClient(userId, res) {
  const key = String(userId);
  const clients = streamClientsByUser.get(key);
  if (!clients) return;
  clients.delete(res);
  if (clients.size === 0) {
    streamClientsByUser.delete(key);
  }
}

export async function pushUnreadCountToUser(userId, extraPayload = {}) {
  const key = String(userId);
  const clients = streamClientsByUser.get(key);
  if (!clients || clients.size === 0) return;

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  const payload = {
    unreadCount,
    ...extraPayload,
  };

  for (const res of clients) {
    try {
      writeSseEvent(res, "notification", payload);
    } catch {
      removeNotificationStreamClient(key, res);
    }
  }
}

/**
 * Create persistent per-user notifications in MongoDB and push live SSE updates.
 */
export async function createNotificationsForUsers({
  recipientIds = [],
  excludeUserId = null,
  title,
  message,
  category = "General System Notifications",
  priority = "Medium",
  link = "",
  actorId = null,
  actorName = "",
  metadata = {},
}) {
  if (!title || !message) return [];

  const excluded = excludeUserId ? String(excludeUserId) : null;
  const uniqueIds = Array.from(
    new Set(
      recipientIds
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
        .map((id) => String(id))
        .filter((id) => !excluded || id !== excluded)
    )
  );

  if (uniqueIds.length === 0) return [];

  const safeCategory = NOTIFICATION_CATEGORIES.includes(category)
    ? category
    : "General System Notifications";

  const docs = uniqueIds.map((recipient) => ({
    recipient,
    title: String(title).trim(),
    message: String(message).trim(),
    category: safeCategory,
    priority: ["Low", "Medium", "High"].includes(priority) ? priority : "Medium",
    link: String(link || "").trim(),
    actor: actorId && mongoose.Types.ObjectId.isValid(actorId) ? actorId : undefined,
    actorName: String(actorName || "").trim(),
    metadata,
  }));

  const created = await Notification.insertMany(docs);

  // Emit live updates in parallel to connected recipients
  await Promise.allSettled(
    created.map((item) =>
      pushUnreadCountToUser(item.recipient, { notification: item })
    )
  );

  return created;
}

export async function resolveActiveUserIdsByRoles(roles = []) {
  if (!Array.isArray(roles) || roles.length === 0) return [];
  const users = await User.find(
    { role: { $in: roles }, status: "active" },
    "_id"
  ).lean();
  return users.map((u) => u._id);
}

export async function resolveUserIdsForAnnouncementAudience(audience = "All") {
  const roleMap = {
    Students: ["STUDENT"],
    Teachers: ["TEACHER", "HOD"],
    Accountant: ["ACCOUNTANT"],
    All: [
      "SUPER_ADMIN",
      "ADMIN",
      "PRINCIPAL",
      "HOD",
      "TEACHER",
      "ACCOUNTANT",
      "STUDENT",
    ],
  };

  const roles = roleMap[audience] || roleMap.All;
  return resolveActiveUserIdsByRoles(roles);
}

export async function resolveUserIdByEmail(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return null;

  const directUser = await User.findOne(
    { email: cleanEmail, status: "active" },
    "_id"
  ).lean();
  if (directUser) return directUser._id;

  const studentDoc = await Student.findOne({ email: cleanEmail }, "user").lean();
  if (studentDoc?.user) {
    const linked = await User.findOne(
      { _id: studentDoc.user, status: "active" },
      "_id"
    ).lean();
    if (linked) return linked._id;
  }

  return null;
}

export async function resolveStudentUserId({
  studentDoc = null,
  studentId = null,
  rollNumber = "",
  className = "",
}) {
  let student = studentDoc;
  if (!student && studentId && mongoose.Types.ObjectId.isValid(studentId)) {
    student = await Student.findById(studentId).lean();
  }

  if (student?.user) {
    const linked = await User.findOne(
      { _id: student.user, status: "active" },
      "_id"
    ).lean();
    if (linked) return linked._id;
  }

  const orClauses = [];
  if (student?.email) {
    orClauses.push({ email: student.email.trim().toLowerCase() });
  }
  const resolvedStudentId = student?.studentId || (typeof studentId === "string" && !mongoose.Types.ObjectId.isValid(studentId) ? studentId : "");
  if (resolvedStudentId) {
    orClauses.push({ studentId: resolvedStudentId });
  }
  const resolvedRoll = String(rollNumber || student?.rollNumber || "").trim();
  const classRegex = buildFlexibleClassRegex(className || student?.className);
  if (resolvedRoll && classRegex) {
    orClauses.push({
      role: "STUDENT",
      rollNumber: new RegExp(`^${escapeRegex(resolvedRoll)}$`, "i"),
      $or: [{ className: classRegex }, { class: classRegex }],
    });
  } else if (resolvedRoll) {
    orClauses.push({
      role: "STUDENT",
      rollNumber: new RegExp(`^${escapeRegex(resolvedRoll)}$`, "i"),
    });
  }

  if (orClauses.length === 0) return null;

  const matchedUser = await User.findOne(
    { status: "active", $or: orClauses },
    "_id"
  ).lean();
  return matchedUser ? matchedUser._id : null;
}

export async function resolveUserIdsForClass(
  className,
  { includeStudents = true, includeTeachers = true } = {}
) {
  const classRegex = buildFlexibleClassRegex(className);
  if (!classRegex) return [];

  const recipientIds = [];

  if (includeStudents) {
    const [students, directStudentUsers] = await Promise.all([
      Student.find({ className: classRegex, status: "active" }, "user email studentId").lean(),
      User.find(
        {
          role: "STUDENT",
          status: "active",
          $or: [{ className: classRegex }, { class: classRegex }],
        },
        "_id"
      ).lean(),
    ]);

    directStudentUsers.forEach((u) => recipientIds.push(u._id));

    const studentEmails = [];
    const studentIds = [];
    for (const s of students) {
      if (s.user) recipientIds.push(s.user);
      if (s.email) studentEmails.push(s.email.trim().toLowerCase());
      if (s.studentId) studentIds.push(s.studentId);
    }

    if (studentEmails.length > 0 || studentIds.length > 0) {
      const orClauses = [];
      if (studentEmails.length > 0) orClauses.push({ email: { $in: studentEmails } });
      if (studentIds.length > 0) orClauses.push({ studentId: { $in: studentIds } });
      const matched = await User.find({ status: "active", $or: orClauses }, "_id").lean();
      matched.forEach((u) => recipientIds.push(u._id));
    }
  }

  if (includeTeachers) {
    const [teachers, directTeacherUsers] = await Promise.all([
      Teacher.find(
        { "assignedSubjects.className": classRegex, status: "active" },
        "user email teacherId"
      ).lean(),
      User.find(
        {
          role: "TEACHER",
          status: "active",
          assignedClasses: classRegex,
        },
        "_id"
      ).lean(),
    ]);

    directTeacherUsers.forEach((u) => recipientIds.push(u._id));

    const teacherEmails = [];
    const teacherIds = [];
    for (const t of teachers) {
      if (t.user) recipientIds.push(t.user);
      if (t.email) teacherEmails.push(t.email.trim().toLowerCase());
      if (t.teacherId) teacherIds.push(t.teacherId);
    }

    if (teacherEmails.length > 0 || teacherIds.length > 0) {
      const orClauses = [];
      if (teacherEmails.length > 0) orClauses.push({ email: { $in: teacherEmails } });
      if (teacherIds.length > 0) orClauses.push({ teacherId: { $in: teacherIds } });
      const matched = await User.find({ status: "active", $or: orClauses }, "_id").lean();
      matched.forEach((u) => recipientIds.push(u._id));
    }
  }

  return recipientIds;
}

/**
 * Non-throwing wrapper so notification delivery failures never abort core ERP writes.
 */
export async function dispatchNotificationSafe(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error("Notification dispatch warning:", err?.message || err);
    return null;
  }
}
