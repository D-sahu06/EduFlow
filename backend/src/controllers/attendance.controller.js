import mongoose from "mongoose";
import { Attendance, LeaveRequest } from "../models/Attendance.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import { getFeatureScope } from "../config/permissions.js";
import {
  createNotificationsForUsers,
  dispatchNotificationSafe,
  resolveActiveUserIdsByRoles,
  resolveStudentUserId,
} from "../services/notification.service.js";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeClassKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^class\s+/i, "")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ");
}

function buildClassFilterRegex(value) {
  const core = normalizeClassKey(value);
  if (!core) return null;
  if (/^\d+$/.test(core)) {
    return new RegExp(`^(?:class\\s+)?${escapeRegex(core)}(?:st|nd|rd|th)?$`, "i");
  }
  return new RegExp(`^(?:class\\s+)?${escapeRegex(core)}$`, "i");
}

function cleanSectionValue(value) {
  const trimmed = String(value || "")
    .trim()
    .replace(/^section\s+/i, "")
    .trim();
  if (!trimmed) return "";
  return trimmed.length === 1 ? trimmed.toUpperCase() : trimmed;
}

function normalizeSectionKey(value) {
  return cleanSectionValue(value).toLowerCase();
}

function normalizeRollKey(value) {
  return String(value || "").trim().toLowerCase();
}

function serializeAttendanceRecord(doc) {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    ...obj,
    targetType: obj.targetType || "Student",
    studentName: obj.studentName || obj.student?.name || obj.user?.name || "",
    rollNumber:
      obj.rollNumber ||
      obj.student?.rollNumber ||
      obj.student?.studentId ||
      obj.user?.employeeId ||
      obj.user?.username ||
      "",
    className: obj.className || obj.student?.className || obj.user?.department || "",
    section:
      obj.section ||
      obj.student?.section ||
      (obj.targetType === "Staff" ? obj.user?.role || "Staff" : ""),
  };
}

async function resolveMatchingStudent({ studentId, rollNumber, className, name }) {
  let studentDoc = null;
  let studentUser = null;

  // 1. Try studentId if provided
  if (studentId) {
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      studentDoc = await Student.findById(studentId).lean();
      if (!studentDoc) {
        studentUser = await User.findOne({ _id: studentId, role: "STUDENT" }).lean();
      }
    } else {
      const sidRegex = new RegExp(`^${escapeRegex(String(studentId).trim())}$`, "i");
      studentDoc = await Student.findOne({
        $or: [{ studentId: sidRegex }, { rollNumber: sidRegex }],
      }).lean();
      if (!studentDoc) {
        studentUser = await User.findOne({
          role: "STUDENT",
          $or: [{ studentId: sidRegex }, { rollNumber: sidRegex }, { username: sidRegex }],
        }).lean();
      }
    }
  }

  // 2. Try matching by rollNumber and className if not yet resolved
  const trimmedRoll = String(rollNumber || "").trim();
  if (!studentDoc && !studentUser && trimmedRoll) {
    const rollRegex = new RegExp(`^${escapeRegex(trimmedRoll)}$`, "i");
    const classRegex = buildClassFilterRegex(className);

    const studentQuery = {
      $or: [{ rollNumber: rollRegex }, { studentId: rollRegex }],
    };
    if (classRegex) {
      studentQuery.className = classRegex;
    }
    studentDoc = await Student.findOne(studentQuery).lean();

    if (!studentDoc && classRegex) {
      studentDoc = await Student.findOne({
        $or: [{ rollNumber: rollRegex }, { studentId: rollRegex }],
      }).lean();
    }

    if (!studentDoc) {
      const userQuery = {
        role: "STUDENT",
        $or: [{ rollNumber: rollRegex }, { studentId: rollRegex }, { username: rollRegex }],
      };
      studentUser = await User.findOne(userQuery).lean();
    }
  }

  // 3. Try matching by Name and Class if rollNumber was empty or didn't match
  const trimmedName = String(name || "").trim();
  if (!studentDoc && !studentUser && trimmedName) {
    const nameRegex = new RegExp(`^${escapeRegex(trimmedName)}$`, "i");
    const classRegex = buildClassFilterRegex(className);
    const query = { name: nameRegex };
    if (classRegex) query.className = classRegex;

    studentDoc = await Student.findOne(query).lean();
    if (!studentDoc) {
      studentUser = await User.findOne({ role: "STUDENT", name: nameRegex }).lean();
    }
  }

  // If studentDoc was found with a linked user, fetch or set studentUser
  if (studentDoc?.user && !studentUser) {
    studentUser = await User.findById(studentDoc.user).lean();
  }

  // If studentUser was found with a linked student, fetch studentDoc
  if (studentUser && !studentDoc) {
    studentDoc = await Student.findOne({
      $or: [
        { user: studentUser._id },
        { studentId: studentUser.studentId || "NONE" },
        { email: studentUser.email },
      ],
    }).lean();
  }

  return { invalidId: false, studentDoc, studentUser };
}

function buildSectionFilterRegex(value) {
  const core = cleanSectionValue(value);
  if (!core) return null;
  return new RegExp(`^(?:section\\s+)?${escapeRegex(core)}$`, "i");
}

function parseUTCDateRange(dateStr) {
  const raw = String(dateStr || "").trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const start = isoMatch
    ? new Date(
        Date.UTC(
          Number(isoMatch[1]),
          Number(isoMatch[2]) - 1,
          Number(isoMatch[3]),
          0,
          0,
          0,
          0
        )
      )
    : new Date(raw);

  if (!isoMatch && !Number.isNaN(start.getTime())) {
    start.setUTCHours(0, 0, 0, 0);
  }
  if (Number.isNaN(start.getTime())) return null;

  const nextDay = new Date(start);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return { start, nextDay };
}

async function findTeacherProfile(user) {
  return Teacher.findOne({
    $or: [
      { user: user._id },
      ...(user.teacherId ? [{ teacherId: user.teacherId }] : []),
      ...(user.email ? [{ email: user.email.toLowerCase() }] : []),
    ],
  });
}

function isTeacherAssignedScope(user, feature, reqScope) {
  if (user.role !== "TEACHER") return false;
  const effectiveScope = reqScope || getFeatureScope(user.role, "attendance", feature);
  return effectiveScope === "assigned";
}

async function getTeacherAssignedClasses(user) {
  if (user.assignedClasses && user.assignedClasses.length > 0) {
    return user.assignedClasses;
  }
  const teacherDoc = await findTeacherProfile(user);
  if (teacherDoc && teacherDoc.assignedSubjects && teacherDoc.assignedSubjects.length > 0) {
    return Array.from(new Set(teacherDoc.assignedSubjects.map((s) => s.className)));
  }
  return [];
}

async function buildStudentAttendanceClause(user) {
  const studentDoc = await Student.findOne({
    $or: [
      { user: user._id },
      { studentId: user.studentId || "NONE" },
      { email: user.email },
    ],
  }).lean();

  const ownOr = [{ user: user._id }];

  if (studentDoc?._id) {
    ownOr.push({ student: studentDoc._id });
  }

  const rollValues = [
    user.rollNumber,
    user.studentId,
    user.username,
    studentDoc?.rollNumber,
    studentDoc?.studentId,
  ].filter((v) => typeof v === "string" && v.trim().length > 0);

  const uniqueRolls = Array.from(new Set(rollValues.map((v) => v.trim())));

  uniqueRolls.forEach((r) => {
    const rollKey = normalizeRollKey(r);
    if (rollKey) {
      ownOr.push({ rollKey });
    }
    const rollRegex = new RegExp(`^${escapeRegex(r)}$`, "i");
    ownOr.push({ rollNumber: rollRegex });
  });

  return ownOr.length === 1 ? ownOr[0] : { $or: ownOr };
}

function buildAccountantAttendanceClause(user) {
  const ownOr = [{ user: user._id }];
  const empId = String(user.employeeId || "").trim();
  const fullName = String(user.name || "").trim();

  if (empId) {
    ownOr.push({
      targetType: "Staff",
      rollNumber: new RegExp(`^${escapeRegex(empId)}$`, "i"),
    });
  }
  if (fullName) {
    ownOr.push({
      targetType: "Staff",
      studentName: new RegExp(`^${escapeRegex(fullName)}$`, "i"),
    });
  }

  return {
    $and: [
      { targetType: { $ne: "Student" } },
      { targetType: { $ne: "Teacher" } },
      ownOr.length === 1 ? ownOr[0] : { $or: ownOr },
    ],
  };
}

export async function buildSelfAttendanceClause(user) {
  if (user.role === "STUDENT") {
    return await buildStudentAttendanceClause(user);
  }

  const ownOr = [{ user: user._id }];
  const empId = String(user.employeeId || "").trim();
  const fullName = String(user.name || "").trim();
  const username = String(user.username || "").trim();

  if (user.role === "TEACHER") {
    const teacherDoc = await Teacher.findOne({
      $or: [
        { user: user._id },
        { email: user.email },
        ...(empId ? [{ employeeId: empId }] : []),
      ],
    }).lean();
    if (teacherDoc?._id) {
      ownOr.push({ teacher: teacherDoc._id });
    }
  }

  if (empId) {
    ownOr.push({
      targetType: "Staff",
      rollNumber: new RegExp(`^${escapeRegex(empId)}$`, "i"),
    });
  }
  if (username) {
    ownOr.push({
      targetType: "Staff",
      rollNumber: new RegExp(`^${escapeRegex(username)}$`, "i"),
    });
  }
  if (fullName) {
    ownOr.push({
      targetType: "Staff",
      studentName: new RegExp(`^${escapeRegex(fullName)}$`, "i"),
    });
  }

  return ownOr.length === 1 ? ownOr[0] : { $or: ownOr };
}

async function notifyStudentAttendanceChange({
  studentId,
  rollNumber,
  className,
  section,
  date,
  status,
  actor,
  isUpdate = false,
}) {
  await dispatchNotificationSafe(async () => {
    const userId = await resolveStudentUserId({
      studentId,
      rollNumber,
      className,
    });
    if (!userId) return;

    const dateLabel = new Date(date).toISOString().slice(0, 10);
    const sectionText = section ? ` - Section ${section}` : "";

    await createNotificationsForUsers({
      recipientIds: [userId],
      excludeUserId: actor._id,
      title: isUpdate
        ? `Attendance Updated: ${status}`
        : `Attendance Marked: ${status}`,
      message: `Your attendance for ${className}${sectionText} on ${dateLabel} was ${isUpdate ? "updated to" : "marked as"} ${status}.`,
      category: "Attendance Updates",
      priority: status === "Absent" ? "High" : "Medium",
      link: "/attendance/view",
      actorId: actor._id,
      actorName: actor.name,
      metadata: { date: dateLabel, status, className, section },
    });
  });
}

// @desc    Mark attendance (manual student entries or studentId batch)
// @route   POST /api/attendance/mark
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const markAttendance = async (req, res, next) => {
  try {
    // Role check: Students and Accountants cannot mark attendance
    if (["STUDENT", "ACCOUNTANT"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to mark attendance.",
      });
    }

    const { date, className, section, rejectDuplicates } = req.body;
    const records = Array.isArray(req.body.records)
      ? req.body.records
      : req.body.studentId || req.body.userId
      ? [req.body]
      : null;

    if (!date || !records || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Date and at least one attendance record are required.",
      });
    }

    const dateRange = parseUTCDateRange(date);
    if (!dateRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format provided.",
      });
    }

    const cleanClass = typeof className === "string" ? className.trim() : "";
    const cleanSection = cleanSectionValue(section);
    const validStatuses = new Set(["Present", "Absent", "Late", "On Leave"]);

    // Teacher isolation: restrict to assigned classes only when RBAC scope is 'assigned'
    let teacherAllowedKeys = null;
    if (isTeacherAssignedScope(req.user, "markAttendance", req.userScope)) {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      teacherAllowedKeys = new Set(assignedClasses.map(normalizeClassKey).filter(Boolean));
      if (cleanClass && !teacherAllowedKeys.has(normalizeClassKey(cleanClass))) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You are not authorized to mark attendance for ${cleanClass}.`,
        });
      }
    }

    const attendanceDate = dateRange.start;
    const formattedDate = attendanceDate.toISOString().slice(0, 10);
    const seenPayloadKeys = new Set();
    const preparedEntries = [];

    for (const rec of records) {
      if (!validStatuses.has(rec.status)) {
        return res.status(400).json({
          success: false,
          message: "Each record must include a valid attendance status (Present, Absent, Late, On Leave).",
        });
      }

      const isStaffEntry = Boolean(rec.userId) || rec.targetType === "Staff" || req.body.targetType === "Staff";

      if (isStaffEntry) {
        if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: Only administrators and principals can mark staff attendance.",
          });
        }
        let staffUser = null;
        if (rec.userId) {
          if (!mongoose.Types.ObjectId.isValid(rec.userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId provided in attendance record." });
          }
          staffUser = await User.findById(rec.userId).lean();
          if (!staffUser) {
            return res.status(404).json({ success: false, message: "Staff user record not found." });
          }
        }
        const staffName = String(rec.studentName || rec.name || staffUser?.name || "").trim();
        const staffCode = String(
          rec.rollNumber || rec.employeeId || staffUser?.employeeId || staffUser?.username || ""
        ).trim();
        const staffDept = String(
          cleanClass || rec.className || rec.department || staffUser?.department || staffUser?.role || "Staff"
        ).trim();
        const staffSec = cleanSection || cleanSectionValue(rec.section || staffUser?.role || "Staff");

        const dedupKey = staffUser?._id ? `user:${String(staffUser._id)}` : `staff:${staffName.toLowerCase()}|${staffCode.toLowerCase()}`;
        if (seenPayloadKeys.has(dedupKey)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate staff attendance entry in submission: ${staffName}.`,
          });
        }
        seenPayloadKeys.add(dedupKey);

        preparedEntries.push({
          isStrictInsert: Boolean(rejectDuplicates),
          targetType: "Staff",
          user: staffUser?._id || undefined,
          studentName: staffName,
          rollNumber: staffCode,
          date: attendanceDate,
          className: staffDept,
          section: staffSec,
          classKey: normalizeClassKey(staffDept),
          sectionKey: normalizeSectionKey(staffSec),
          rollKey: "",
          status: rec.status,
          markedBy: req.user._id,
          remarks: String(rec.remarks || "").trim(),
        });
        continue;
      }

      const isManualEntry = !rec.studentId;
      let recClass = cleanClass || String(rec.className || "").trim();
      let recSection = cleanSection || cleanSectionValue(rec.section);
      let recName = String(rec.studentName || rec.name || "").trim();
      let recRoll = String(rec.rollNumber || rec.rollNo || "").trim();

      const { invalidId, studentDoc, studentUser } = await resolveMatchingStudent({
        studentId: rec.studentId,
        rollNumber: recRoll,
        className: recClass,
        name: recName,
      });

      if (invalidId) {
        return res.status(400).json({
          success: false,
          message: "Invalid studentId provided in attendance record.",
        });
      }

      const resolvedStudent = studentDoc || studentUser;
      if (resolvedStudent) {
        if (!recName) recName = String(resolvedStudent.name || "").trim();
        if (!recRoll) recRoll = String(resolvedStudent.rollNumber || resolvedStudent.studentId || "").trim();
        if (!recClass) recClass = String(resolvedStudent.className || resolvedStudent.class || "").trim();
        if (!recSection) recSection = cleanSectionValue(resolvedStudent.section);
      }

      if (isManualEntry) {
        if (!recClass || !recSection) {
          return res.status(400).json({
            success: false,
            message: "Class and Section are required for attendance entries.",
          });
        }
        if (!recName || !recRoll) {
          return res.status(400).json({
            success: false,
            message: "Each student entry requires both Student Name and Roll Number.",
          });
        }
      }

      if (req.user.role === "TEACHER" && teacherAllowedKeys) {
        const recClassKey = normalizeClassKey(recClass);
        if (!recClassKey || !teacherAllowedKeys.has(recClassKey)) {
          return res.status(403).json({
            success: false,
            message: `Access denied: You are not authorized to mark attendance for ${recClass || "this class"}.`,
          });
        }
      }

      const classKey = normalizeClassKey(recClass);
      const sectionKey = normalizeSectionKey(recSection);
      const rollKey = normalizeRollKey(recRoll);

      const dedupKey = rollKey
        ? `roll:${classKey}|${sectionKey}|${rollKey}`
        : `id:${String(rec.studentId)}`;

      if (seenPayloadKeys.has(dedupKey)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate student entry in submission: ${recName || rec.studentId}${recRoll ? ` (Roll: ${recRoll})` : ""}.`,
        });
      }
      seenPayloadKeys.add(dedupKey);

      const enforceStrictInsert = isManualEntry || Boolean(rejectDuplicates);
      if (enforceStrictInsert) {
        const dupOrClauses = [];
        if (rollKey) {
          dupOrClauses.push({ classKey, sectionKey, rollKey });
        }
        if (studentDoc?._id) {
          dupOrClauses.push({ student: studentDoc._id });
        }
        if (studentUser?._id) {
          dupOrClauses.push({ user: studentUser._id });
        }
        if (dupOrClauses.length > 0) {
          const existing = await Attendance.findOne({
            date: attendanceDate,
            $or: dupOrClauses,
          }).lean();

          if (existing) {
            return res.status(409).json({
              success: false,
              message: `Duplicate attendance entry: ${recName} (Roll: ${recRoll}) already has attendance marked for ${recClass} - ${recSection} on ${formattedDate}.`,
            });
          }
        }
      }

      preparedEntries.push({
        isStrictInsert: enforceStrictInsert,
        student: studentDoc?._id || (rec.studentId && mongoose.Types.ObjectId.isValid(rec.studentId) ? rec.studentId : undefined),
        user: studentUser?._id || undefined,
        studentName: recName,
        rollNumber: recRoll,
        date: attendanceDate,
        className: recClass,
        section: recSection,
        classKey,
        sectionKey,
        rollKey,
        status: rec.status,
        markedBy: req.user._id,
        remarks: String(rec.remarks || "").trim(),
      });
    }

    const operations = preparedEntries.map((entry) => {
      const payload = {
        targetType: entry.targetType || "Student",
        ...(entry.student ? { student: entry.student } : {}),
        ...(entry.user ? { user: entry.user } : {}),
        studentName: entry.studentName,
        rollNumber: entry.rollNumber,
        date: entry.date,
        className: entry.className,
        section: entry.section,
        classKey: entry.classKey,
        sectionKey: entry.sectionKey,
        rollKey: entry.rollKey,
        status: entry.status,
        markedBy: entry.markedBy,
        remarks: entry.remarks,
      };

      if (entry.isStrictInsert || (!entry.student && !entry.user)) {
        return {
          insertOne: {
            document: payload,
          },
        };
      }

      return {
        updateOne: {
          filter: entry.user
            ? { user: entry.user, date: entry.date }
            : { student: entry.student, date: entry.date },
          update: {
            $set: payload,
          },
          upsert: true,
        },
      };
    });

    const result = await Attendance.bulkWrite(operations);

    await Promise.all(
      preparedEntries
        .filter((entry) => entry.targetType !== "Staff")
        .map((entry) =>
          notifyStudentAttendanceChange({
            studentId: entry.student,
            rollNumber: entry.rollNumber,
            className: entry.className,
            section: entry.section,
            date: entry.date,
            status: entry.status,
            actor: req.user,
            isUpdate: false,
          })
        )
    );

    res.json({
      success: true,
      message: `Attendance saved successfully for ${preparedEntries.length} student${preparedEntries.length === 1 ? "" : "s"}.`,
      count: preparedEntries.length,
      result,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate attendance entry detected for the same student, class, section, and date.",
      });
    }
    next(error);
  }
};

// @desc    Get logged-in user's personal attendance records (for all roles in My Profile)
// @route   GET /api/attendance/self
// @access  Private
export const getMyAttendance = async (req, res, next) => {
  try {
    const { month, year, date, status } = req.query;
    const selfClause = await buildSelfAttendanceClause(req.user);
    const andClauses = [selfClause];

    if (date) {
      const dateRange = parseUTCDateRange(date);
      if (dateRange) {
        andClauses.push({ date: { $gte: dateRange.start, $lt: dateRange.nextDay } });
      }
    } else if (month && year) {
      const m = Number(month) - 1; // 0-indexed
      const y = Number(year);
      if (!isNaN(m) && !isNaN(y)) {
        const start = new Date(Date.UTC(y, m, 1));
        const end = new Date(Date.UTC(y, m + 1, 1));
        andClauses.push({ date: { $gte: start, $lt: end } });
      }
    }

    if (status && status !== "All") {
      andClauses.push({ status });
    }

    const records = await Attendance.find({ $and: andClauses })
      .populate("markedBy", "name")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const serialized = records.map(serializeAttendanceRecord);

    res.json({
      success: true,
      count: serialized.length,
      records: serialized,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's personal attendance statistics (for all roles in My Profile)
// @route   GET /api/attendance/self/stats
// @access  Private
export const getMyAttendanceStats = async (req, res, next) => {
  try {
    const selfClause = await buildSelfAttendanceClause(req.user);
    const filter = { ...selfClause };

    const totalRecords = await Attendance.countDocuments(filter);
    const presentCount = await Attendance.countDocuments({ ...filter, status: "Present" });
    const absentCount = await Attendance.countDocuments({ ...filter, status: "Absent" });
    const lateCount = await Attendance.countDocuments({ ...filter, status: "Late" });
    const leaveCount = await Attendance.countDocuments({
      ...filter,
      status: { $in: ["On Leave", "Excused"] },
    });

    const attendanceRate =
      totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalRecords,
        totalWorkingDays: totalRecords,
        presentCount,
        presentDays: presentCount,
        absentCount,
        absentDays: absentCount,
        lateCount,
        lateDays: lateCount,
        leaveCount,
        leaveDays: leaveCount,
        attendanceRate: `${attendanceRate}%`,
        attendancePercentage: attendanceRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance records with strict role data isolation
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res, next) => {
  try {
    const { date, className, section, status, studentId } = req.query;
    const filter = {};
    const andClauses = [];

    if (date) {
      const dateRange = parseUTCDateRange(date);
      if (dateRange) {
        filter.date = { $gte: dateRange.start, $lt: dateRange.nextDay };
      }
    }

    const classRegex = buildClassFilterRegex(className);
    if (classRegex) andClauses.push({ className: classRegex });

    const sectionRegex = buildSectionFilterRegex(section);
    if (sectionRegex) andClauses.push({ section: sectionRegex });

    if (status) filter.status = status;
    if (studentId && req.user.role !== "ACCOUNTANT") filter.student = studentId;

    // Strict self-only isolation: Accountant ONLY sees their own attendance records
    if (req.user.role === "ACCOUNTANT") {
      andClauses.push(buildAccountantAttendanceClause(req.user));
    } else if (req.user.role === "STUDENT") {
      // Student scope restriction: Student ONLY sees their own records
      andClauses.push(await buildStudentAttendanceClause(req.user));
    } else if (isTeacherAssignedScope(req.user, "viewAttendance", req.userScope)) {
      // Teacher scope restriction: applied only when RBAC scope is 'assigned'
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const assignedRegexes = assignedClasses.map(buildClassFilterRegex).filter(Boolean);
      if (assignedRegexes.length > 0) {
        andClauses.push({ className: { $in: assignedRegexes } });
      } else {
        andClauses.push({ className: { $in: [] } });
      }
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const records = await Attendance.find(filter)
      .populate("student", "name rollNumber studentId className section")
      .populate("user", "name email role department employeeId username")
      .populate("markedBy", "name")
      .sort({ date: -1, createdAt: -1 });

    const serialized = records.map(serializeAttendanceRecord);

    res.json({
      success: true,
      count: serialized.length,
      records: serialized,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an attendance record
// @route   PUT /api/attendance/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const updateAttendanceRecord = async (req, res, next) => {
  try {
    if (["STUDENT", "ACCOUNTANT"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to update attendance records.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance record ID.",
      });
    }

    const record = await Attendance.findById(req.params.id).populate(
      "student",
      "name rollNumber studentId className section"
    );
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    const nextDate = req.body.date ? parseUTCDateRange(req.body.date)?.start : record.date;
    if (!nextDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format provided.",
      });
    }

    const validStatuses = new Set(["Present", "Absent", "Late", "On Leave"]);
    const nextStatus = req.body.status !== undefined ? req.body.status : record.status;
    if (!validStatuses.has(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Present, Absent, Late, or On Leave.",
      });
    }

    const nextName =
      req.body.studentName !== undefined
        ? String(req.body.studentName).trim()
        : record.studentName || record.student?.name || "";
    const nextRoll =
      req.body.rollNumber !== undefined
        ? String(req.body.rollNumber).trim()
        : record.rollNumber || record.student?.rollNumber || record.student?.studentId || "";
    const nextClass =
      req.body.className !== undefined
        ? String(req.body.className).trim()
        : record.className || record.student?.className || "";
    const nextSection =
      req.body.section !== undefined
        ? cleanSectionValue(req.body.section)
        : cleanSectionValue(record.section || record.student?.section || "");

    if (!nextName || !nextRoll || !nextClass || !nextSection) {
      return res.status(400).json({
        success: false,
        message: "Student Name, Roll Number, Class, and Section are required.",
      });
    }

    if (isTeacherAssignedScope(req.user, "markAttendance", req.userScope)) {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const allowedKeys = new Set(assignedClasses.map(normalizeClassKey).filter(Boolean));
      const existingClassKey = normalizeClassKey(record.className || record.student?.className);
      const nextClassKeyCheck = normalizeClassKey(nextClass);
      if (!allowedKeys.has(existingClassKey) || !allowedKeys.has(nextClassKeyCheck)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You are not authorized to modify attendance for ${nextClass}.`,
        });
      }
    }

    const nextClassKey = normalizeClassKey(nextClass);
    const nextSectionKey = normalizeSectionKey(nextSection);
    const nextRollKey = normalizeRollKey(nextRoll);

    const { studentDoc } = await resolveMatchingStudent({
      studentId: null,
      rollNumber: nextRoll,
      className: nextClass,
    });

    const dupOrClauses = [];
    if (nextRollKey) {
      dupOrClauses.push({ classKey: nextClassKey, sectionKey: nextSectionKey, rollKey: nextRollKey });
    }
    if (studentDoc?._id) {
      dupOrClauses.push({ student: studentDoc._id });
    }

    if (dupOrClauses.length > 0) {
      const duplicate = await Attendance.findOne({
        _id: { $ne: record._id },
        date: nextDate,
        $or: dupOrClauses,
      }).lean();

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Duplicate attendance entry: ${nextName} (Roll: ${nextRoll}) already exists for ${nextClass} - ${nextSection} on ${nextDate.toISOString().slice(0, 10)}.`,
        });
      }
    }

    record.date = nextDate;
    record.student = studentDoc?._id || undefined;
    record.studentName = nextName;
    record.rollNumber = nextRoll;
    record.className = nextClass;
    record.section = nextSection;
    record.classKey = nextClassKey;
    record.sectionKey = nextSectionKey;
    record.rollKey = nextRollKey;
    record.status = nextStatus;
    record.markedBy = req.user._id;
    if (req.body.remarks !== undefined) {
      record.remarks = String(req.body.remarks || "").trim();
    }

    await record.save();
    await record.populate("student", "name rollNumber studentId className section");
    await record.populate("markedBy", "name");

    await notifyStudentAttendanceChange({
      studentId: record.student?._id || record.student,
      rollNumber: record.rollNumber,
      className: record.className,
      section: record.section,
      date: record.date,
      status: record.status,
      actor: req.user,
      isUpdate: true,
    });

    res.json({
      success: true,
      message: "Attendance record updated successfully.",
      record: serializeAttendanceRecord(record),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate attendance entry detected for the same student, class, section, and date.",
      });
    }
    next(error);
  }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const deleteAttendanceRecord = async (req, res, next) => {
  try {
    if (["STUDENT", "ACCOUNTANT"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to delete attendance records.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance record ID.",
      });
    }

    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    if (isTeacherAssignedScope(req.user, "markAttendance", req.userScope)) {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const allowedKeys = new Set(assignedClasses.map(normalizeClassKey).filter(Boolean));
      if (!allowedKeys.has(normalizeClassKey(record.className))) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You are not authorized to delete attendance for ${record.className || "this class"}.`,
        });
      }
    }

    await Attendance.findByIdAndDelete(record._id);

    res.json({
      success: true,
      message: "Attendance record deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance summary stats isolated by role
// @route   GET /api/attendance/stats
// @access  Private
export const getAttendanceStats = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Attendance stats are restricted from financial accounts.",
      });
    }

    const filter = {};

    if (req.user.role === "STUDENT") {
      Object.assign(filter, await buildStudentAttendanceClause(req.user));
    } else if (isTeacherAssignedScope(req.user, "attendanceDashboard", req.userScope)) {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const assignedRegexes = assignedClasses.map(buildClassFilterRegex).filter(Boolean);
      if (assignedRegexes.length > 0) {
        filter.className = { $in: assignedRegexes };
      } else {
        filter.className = { $in: [] };
      }
    }

    const totalRecords = await Attendance.countDocuments(filter);
    const presentCount = await Attendance.countDocuments({ ...filter, status: "Present" });
    const absentCount = await Attendance.countDocuments({ ...filter, status: "Absent" });
    const lateCount = await Attendance.countDocuments({ ...filter, status: "Late" });
    const leaveCount = await Attendance.countDocuments({
      ...filter,
      status: { $in: ["On Leave", "Excused"] },
    });

    const attendanceRate =
      totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalRecords,
        totalWorkingDays: totalRecords,
        presentCount,
        presentDays: presentCount,
        absentCount,
        absentDays: absentCount,
        lateCount,
        lateDays: lateCount,
        leaveCount,
        leaveDays: leaveCount,
        attendanceRate: `${attendanceRate}%`,
        attendancePercentage: attendanceRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a leave request (self-apply or admin-recorded for a teacher)
// @route   POST /api/attendance/leaves
// @access  Private
export const createLeaveRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason, teacherRef, teacherId: bodyTeacherId } = req.body;

    if (!startDate || !endDate || !reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "Start date, end date, and reason are required.",
      });
    }

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid start and end dates.",
      });
    }

    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date.",
      });
    }

    let payload;
    if (teacherRef || bodyTeacherId) {
      const canAssignForTeacher = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD"].includes(req.user.role);
      if (!canAssignForTeacher) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Only administrators can record leave for another teacher.",
        });
      }

      const teacherDoc = teacherRef
        ? await Teacher.findById(teacherRef)
        : await Teacher.findOne({ teacherId: bodyTeacherId });

      if (!teacherDoc) {
        return res.status(404).json({
          success: false,
          message: "Selected teacher record not found.",
        });
      }

      if (
        req.user.role === "HOD" &&
        req.user.department &&
        teacherDoc.department &&
        teacherDoc.department.toLowerCase() !== req.user.department.toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied: HOD can only record leaves within their department.",
        });
      }

      const linkedUser = teacherDoc.user
        ? await User.findById(teacherDoc.user).select("_id")
        : await User.findOne({ email: teacherDoc.email?.toLowerCase() }).select("_id");

      payload = {
        user: linkedUser?._id || undefined,
        teacher: teacherDoc._id,
        teacherId: teacherDoc.teacherId || "",
        applicantName: teacherDoc.name,
        role: "TEACHER",
        department: teacherDoc.department || "",
        leaveType: leaveType || "Casual",
        startDate: parsedStart,
        endDate: parsedEnd,
        reason: String(reason).trim(),
        status: "Pending",
      };
    } else {
      const teacherDoc =
        req.user.role === "TEACHER" ? await findTeacherProfile(req.user) : null;

      payload = {
        user: req.user._id,
        teacher: teacherDoc?._id || undefined,
        teacherId: teacherDoc?.teacherId || req.user.teacherId || "",
        applicantName: teacherDoc?.name || req.user.name,
        role: req.user.role,
        department: teacherDoc?.department || req.user.department || "",
        leaveType: leaveType || "Casual",
        startDate: parsedStart,
        endDate: parsedEnd,
        reason: String(reason).trim(),
        status: "Pending",
      };
    }

    const leave = await LeaveRequest.create(payload);
    const populatedLeave = await LeaveRequest.findById(leave._id)
      .populate("user", "name email role department teacherId")
      .populate("teacher", "name email teacherId department")
      .populate("reviewedBy", "name role");

    await dispatchNotificationSafe(async () => {
      const approverRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
      if (payload.role === "TEACHER") {
        approverRoles.push("HOD");
      }
      const recipientIds = await resolveActiveUserIdsByRoles(approverRoles);
      const startStr = parsedStart.toISOString().slice(0, 10);
      const endStr = parsedEnd.toISOString().slice(0, 10);
      await createNotificationsForUsers({
        recipientIds,
        excludeUserId: req.user._id,
        title: `New Leave Application (${payload.leaveType})`,
        message: `${payload.applicantName} submitted a ${payload.leaveType} leave request (${startStr} to ${endStr}).`,
        category: "Attendance Updates",
        priority: "Medium",
        link: "/attendance/leaves",
        actorId: req.user._id,
        actorName: req.user.name,
        metadata: { leaveId: leave._id, status: "Pending" },
      });
    });

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully.",
      leave: populatedLeave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave requests
// @route   GET /api/attendance/leaves
// @access  Private
export const getLeaveRequests = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (role) filter.role = String(role).toUpperCase();

    // Scope check: Teachers, students & accountants only see their own
    if (req.user.role === "TEACHER") {
      const teacherDoc = await findTeacherProfile(req.user);
      filter.$or = [
        { user: req.user._id },
        ...(teacherDoc ? [{ teacher: teacherDoc._id }] : []),
      ];
    } else if (["STUDENT", "ACCOUNTANT"].includes(req.user.role)) {
      filter.user = req.user._id;
    } else if (req.user.role === "HOD" && req.user.department) {
      filter.department = new RegExp(`^${req.user.department}$`, "i");
    }

    const leaves = await LeaveRequest.find(filter)
      .populate("user", "name email role department teacherId")
      .populate("teacher", "name email teacherId department")
      .populate("reviewedBy", "name role")
      .sort({ createdAt: -1 });

    // Enrich teacher leave records with matching Teacher directory metadata
    const hasTeacherLeaves = leaves.some((l) => l.role === "TEACHER");
    let teachersByUser = new Map();
    let teachersByEmail = new Map();
    if (hasTeacherLeaves) {
      const allTeachers = await Teacher.find({}, "user email teacherId department name").lean();
      for (const t of allTeachers) {
        if (t.user) teachersByUser.set(String(t.user), t);
        if (t.email) teachersByEmail.set(t.email.toLowerCase(), t);
      }
    }

    const enrichedLeaves = leaves.map((doc) => {
      const l = doc.toObject();
      if (l.role === "TEACHER") {
        const matchedTeacher =
          l.teacher ||
          (l.user?._id && teachersByUser.get(String(l.user._id))) ||
          (l.user?.email && teachersByEmail.get(l.user.email.toLowerCase()));

        if (matchedTeacher) {
          l.teacherId = l.teacherId || matchedTeacher.teacherId || "";
          l.department = l.department || matchedTeacher.department || l.user?.department || "";
          l.applicantName = l.applicantName || matchedTeacher.name || l.user?.name || "";
        }
      }
      return l;
    });

    res.json({
      success: true,
      count: enrichedLeaves.length,
      leaves: enrichedLeaves,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject leave request
// @route   PUT /api/attendance/leaves/:id/status
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, HOD)
export const updateLeaveStatus = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators, principals, and HODs can review leaves.",
      });
    }

    const { status, reviewNotes, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Approved' or 'Rejected'.",
      });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (
      req.user.role === "HOD" &&
      req.user.department &&
      leave.department &&
      leave.department.toLowerCase() !== req.user.department.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied: HOD can only approve or reject leaves in their own department.",
      });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    const notes = (reviewNotes ?? remarks ?? "").trim();
    if (notes) leave.reviewNotes = notes;

    await leave.save();
    await leave.populate("reviewedBy", "name role");

    await dispatchNotificationSafe(async () => {
      if (!leave.user) return;
      const startStr = new Date(leave.startDate).toISOString().slice(0, 10);
      const endStr = new Date(leave.endDate).toISOString().slice(0, 10);
      await createNotificationsForUsers({
        recipientIds: [leave.user],
        excludeUserId: req.user._id,
        title: `Leave Application ${status}`,
        message: `Your ${leave.leaveType} leave request (${startStr} to ${endStr}) has been ${status.toLowerCase()}.`,
        category: "Attendance Updates",
        priority: status === "Rejected" ? "High" : "Medium",
        link: "/attendance/leaves",
        actorId: req.user._id,
        actorName: req.user.name,
        metadata: { leaveId: leave._id, status },
      });
    });

    res.json({
      success: true,
      message: `Leave application marked as ${status}.`,
      leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / cancel a leave request
// @route   DELETE /api/attendance/leaves/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, or applicant while Pending)
export const deleteLeaveRequest = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role);
    const isOwnerPending =
      leave.user &&
      leave.user.toString() === req.user._id.toString() &&
      leave.status === "Pending";

    if (!isAdmin && !isOwnerPending) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to delete this leave request.",
      });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Leave request deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
