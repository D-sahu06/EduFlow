import mongoose from "mongoose";
import { Exam, ExamResult } from "../models/Exam.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import {
  createNotificationsForUsers,
  dispatchNotificationSafe,
  resolveStudentUserId,
  resolveUserIdsForClass,
} from "../services/notification.service.js";

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeClassKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^class\s+/i, "")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ");
}

function buildClassRegex(value) {
  const core = normalizeClassKey(value);
  if (!core) return null;
  if (/^\d+$/.test(core)) {
    return new RegExp(`^(?:class\\s+)?${escapeRegex(core)}(?:st|nd|rd|th)?$`, "i");
  }
  return new RegExp(`^(?:class\\s+)?${escapeRegex(core)}$`, "i");
}

function buildSectionRegex(value) {
  const core = String(value || "")
    .trim()
    .replace(/^section\s+/i, "")
    .trim();
  if (!core) return null;
  const escaped = escapeRegex(core);
  // Match exact section (e.g. "A" or "Section A") or comma/slash separated tokens (e.g. "1, 2" or "A/B")
  return new RegExp(`^(?:section\\s+)?(?:.*[,&/]\\s*)?${escaped}(?:\\s*[,&/].*)?$`, "i");
}

function parseTimeToMinutes(timeStr) {
  const match = String(timeStr || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatDurationFromMinutes(diffMins) {
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0 && mins > 0) return `${hours} hr${hours > 1 ? "s" : ""} ${mins} min`;
  if (hours > 0) return `${hours} Hour${hours > 1 ? "s" : ""}`;
  return `${mins} Minutes`;
}

async function findStudentProfile(user) {
  const email = String(user.email || "").trim().toLowerCase();
  return Student.findOne({
    $or: [
      { user: user._id },
      ...(user.studentId ? [{ studentId: user.studentId }] : []),
      ...(email ? [{ email: new RegExp(`^${escapeRegex(email)}$`, "i") }] : []),
    ],
  });
}

function calculateGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

async function getTeacherAssignedClasses(user) {
  if (user.assignedClasses && user.assignedClasses.length > 0) {
    return user.assignedClasses;
  }
  const teacherDoc = await Teacher.findOne({
    $or: [
      { user: user._id },
      { teacherId: user.teacherId || "NONE" },
      { email: user.email },
    ],
  });
  if (teacherDoc && teacherDoc.assignedSubjects && teacherDoc.assignedSubjects.length > 0) {
    return Array.from(new Set(teacherDoc.assignedSubjects.map((s) => s.className)));
  }
  return [];
}

async function getStudentIdForUser(user) {
  const studentDoc = await Student.findOne({
    $or: [
      { user: user._id },
      { studentId: user.studentId || "NONE" },
      { email: user.email },
    ],
  });
  return studentDoc ? studentDoc._id : null;
}

function buildAudienceScopeClauses(resolvedClass, resolvedSection) {
  const clauses = [];
  const classRegex = buildClassRegex(resolvedClass);
  if (classRegex) {
    clauses.push({
      $or: [
        { className: classRegex },
        { className: /^(?:all|all\s+classes)$/i },
      ],
    });
  }
  if (resolvedSection) {
    const sectionRegex = buildSectionRegex(resolvedSection);
    clauses.push({
      $or: [
        ...(sectionRegex ? [{ section: sectionRegex }] : []),
        { section: "" },
        { section: /^(?:all|all\s+sections)$/i },
      ],
    });
  }
  return clauses;
}

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants cannot access examination schedules.",
      });
    }

    const { className, section, status, academicYear } = req.query;
    const filter = {};
    const andClauses = [];
    let scope = {
      role: req.user.role,
      scopedBy: "institution",
      assignedClass: "",
      assignedSection: "",
      missingAssignment: false,
      message: "",
    };

    const classRegex = buildClassRegex(className);
    if (classRegex) andClauses.push({ className: classRegex });
    const sectionRegex = buildSectionRegex(section);
    if (sectionRegex) andClauses.push({ section: sectionRegex });
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;

    // Teachers can view all published institutional exam schedules plus their own drafts
    if (req.user.role === "TEACHER") {
      scope.scopedBy = "teacher";
      andClauses.push({
        $or: [{ status: { $ne: "Draft" } }, { createdBy: req.user._id }],
      });
    } else if (req.user.role === "STUDENT") {
      // Students only see published schedules matching their own class and section (or All Classes)
      andClauses.push({ status: { $ne: "Draft" } });
      const studentDoc = await findStudentProfile(req.user);
      const resolvedClass = String(
        studentDoc?.className || req.user.className || req.user.class || ""
      ).trim();
      const resolvedSection = String(
        studentDoc?.section || req.user.section || ""
      ).trim();
      scope = {
        role: "STUDENT",
        scopedBy: "class_section",
        assignedClass: resolvedClass,
        assignedSection: resolvedSection,
        missingAssignment: !resolvedClass,
        message: !resolvedClass
          ? "No class is assigned to your student profile. Contact an administrator to assign your class and section."
          : "",
      };
      if (!resolvedClass) {
        return res.json({ success: true, count: 0, exams: [], scope });
      }
      andClauses.push(...buildAudienceScopeClauses(resolvedClass, resolvedSection));
    } else if (req.user.role === "USER") {
      // Standard User sees published schedules: class/section-scoped if assigned, otherwise published institutional schedules
      andClauses.push({ status: { $ne: "Draft" } });
      const linkedStudent = await findStudentProfile(req.user);
      const resolvedClass = String(
        linkedStudent?.className || req.user.className || req.user.class || ""
      ).trim();
      const resolvedSection = String(
        linkedStudent?.section || req.user.section || ""
      ).trim();

      if (resolvedClass) {
        scope = {
          role: "USER",
          scopedBy: "class_section",
          assignedClass: resolvedClass,
          assignedSection: resolvedSection,
          missingAssignment: false,
          message: "",
        };
        andClauses.push(...buildAudienceScopeClauses(resolvedClass, resolvedSection));
      } else {
        scope = {
          role: "USER",
          scopedBy: "published_institutional",
          assignedClass: "",
          assignedSection: resolvedSection,
          missingAssignment: true,
          message:
            "No class or section is assigned to this User account; displaying all published institutional exam schedules.",
        };
      }
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const exams = await Exam.find(filter).sort({ startDate: 1, createdAt: -1 });

    res.json({ success: true, count: exams.length, exams, scope });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / schedule exam
// @route   POST /api/exams
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const createExam = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants and students cannot create exam schedules.",
      });
    }

    const {
      title,
      name,
      examType,
      className,
      section,
      subject,
      startDate,
      date,
      endDate,
      startTime,
      endTime,
      duration,
      totalMarks,
      passingMarks,
      instructions,
      academicYear,
      status,
    } = req.body;

    const cleanTitle = String(title || name || "").trim();
    const cleanType = String(examType || "").trim();
    const cleanClass = String(className || "").trim();
    const cleanSection = String(section || "").trim();
    const cleanSubject = String(subject || "").trim();
    const cleanDateStr = String(startDate || date || "").trim();
    const cleanStartTime = String(startTime || "").trim();
    const cleanEndTime = String(endTime || "").trim();
    let cleanDuration = String(duration || "").trim();

    if (
      !cleanTitle ||
      !cleanType ||
      !cleanClass ||
      !cleanSection ||
      !cleanSubject ||
      !cleanDateStr ||
      !cleanStartTime ||
      (!cleanEndTime && !cleanDuration)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Exam name, exam type, class, section, subject, exam date, start time, and end time or duration are required.",
      });
    }

    const parsedStartDate = new Date(cleanDateStr);
    const parsedEndDate = endDate ? new Date(endDate) : new Date(cleanDateStr);
    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid exam date.",
      });
    }

    const startMins = parseTimeToMinutes(cleanStartTime);
    const endMins = cleanEndTime ? parseTimeToMinutes(cleanEndTime) : null;
    if (cleanEndTime && startMins !== null && endMins !== null) {
      if (endMins <= startMins) {
        return res.status(400).json({
          success: false,
          message: "End time must be later than start time.",
        });
      }
      if (!cleanDuration) {
        cleanDuration = formatDurationFromMinutes(endMins - startMins);
      }
    }

    const numTotalMarks = Number(totalMarks);
    const numPassingMarks =
      passingMarks === undefined || passingMarks === null || passingMarks === ""
        ? Math.round(numTotalMarks * 0.33)
        : Number(passingMarks);

    if (!Number.isFinite(numTotalMarks) || numTotalMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total marks must be greater than 0.",
      });
    }

    if (
      !Number.isFinite(numPassingMarks) ||
      numPassingMarks < 0 ||
      numPassingMarks > numTotalMarks
    ) {
      return res.status(400).json({
        success: false,
        message: "Passing marks must be between 0 and Total Marks.",
      });
    }

    const validStatuses = ["Scheduled", "Ongoing", "Completed", "Results Published", "Draft"];
    const cleanStatus = status ? String(status).trim() : "Scheduled";
    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam status.",
      });
    }

    if (req.user.role === "TEACHER") {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const assignedRegexes = assignedClasses.map(buildClassRegex).filter(Boolean);
      if (
        assignedRegexes.length > 0 &&
        !assignedRegexes.some((rx) => rx.test(cleanClass))
      ) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Class "${cleanClass}" is outside your assigned classes.`,
        });
      }
    }

    const exam = await Exam.create({
      title: cleanTitle,
      examType: cleanType,
      className: cleanClass,
      section: cleanSection,
      subject: cleanSubject,
      academicYear: String(academicYear || "2026-2027").trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      startTime: cleanStartTime,
      endTime: cleanEndTime,
      duration: cleanDuration,
      totalMarks: numTotalMarks,
      passingMarks: numPassingMarks,
      instructions: String(instructions || "").trim(),
      subjects: [
        {
          subjectName: cleanSubject,
          maxMarks: numTotalMarks,
          passingMarks: numPassingMarks,
          date: parsedStartDate,
        },
      ],
      status: cleanStatus,
      createdBy: req.user._id,
      createdByName: req.user.name,
      createdByRole: req.user.role,
    });

    if (cleanStatus !== "Draft") {
      await dispatchNotificationSafe(async () => {
        const recipientIds = await resolveUserIdsForClass(exam.className, {
          includeStudents: true,
          includeTeachers: true,
        });
        await createNotificationsForUsers({
          recipientIds,
          excludeUserId: req.user._id,
          title: `New Exam Scheduled: ${exam.title}`,
          message: `${exam.examType} (${exam.subject}) for ${exam.className}${exam.section ? ` - ${exam.section}` : ""} on ${new Date(exam.startDate).toLocaleDateString("en-IN")} at ${exam.startTime}.`,
          category: "Examination Notifications",
          priority: "High",
          link: "/examinations/management",
          actorId: req.user._id,
          actorName: req.user.name,
          metadata: { examId: exam._id, className: exam.className, section: exam.section },
        });
      });
    }

    res.status(201).json({
      success: true,
      message: "Examination scheduled successfully.",
      exam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update examination
// @route   PUT /api/exams/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const updateExam = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only authorized staff can update exam schedules.",
      });
    }

    const existingExam = await Exam.findById(req.params.id);
    if (!existingExam) {
      return res.status(404).json({ success: false, message: "Examination not found" });
    }

    const targetClass = req.body.className !== undefined ? String(req.body.className).trim() : existingExam.className;

    if (req.user.role === "TEACHER") {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const assignedRegexes = assignedClasses.map(buildClassRegex).filter(Boolean);
      const ownsExam = existingExam.createdBy && String(existingExam.createdBy) === String(req.user._id);
      if (
        assignedRegexes.length > 0 &&
        !ownsExam &&
        (!assignedRegexes.some((rx) => rx.test(existingExam.className || "")) ||
          !assignedRegexes.some((rx) => rx.test(targetClass || "")))
      ) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Examination is outside your assigned classes.`,
        });
      }
    }

    const nextTotalMarks =
      req.body.totalMarks !== undefined ? Number(req.body.totalMarks) : existingExam.totalMarks;
    const nextPassingMarks =
      req.body.passingMarks !== undefined ? Number(req.body.passingMarks) : existingExam.passingMarks;

    if (!Number.isFinite(nextTotalMarks) || nextTotalMarks <= 0) {
      return res.status(400).json({ success: false, message: "Total marks must be greater than 0." });
    }
    if (!Number.isFinite(nextPassingMarks) || nextPassingMarks < 0 || nextPassingMarks > nextTotalMarks) {
      return res.status(400).json({
        success: false,
        message: "Passing marks must be between 0 and Total Marks.",
      });
    }

    const nextStartTime = req.body.startTime !== undefined ? String(req.body.startTime).trim() : existingExam.startTime;
    const nextEndTime = req.body.endTime !== undefined ? String(req.body.endTime).trim() : existingExam.endTime;
    let nextDuration = req.body.duration !== undefined ? String(req.body.duration).trim() : existingExam.duration;
    const startMins = parseTimeToMinutes(nextStartTime);
    const endMins = nextEndTime ? parseTimeToMinutes(nextEndTime) : null;
    if (nextEndTime && startMins !== null && endMins !== null) {
      if (endMins <= startMins) {
        return res.status(400).json({ success: false, message: "End time must be later than start time." });
      }
      if (!nextDuration) {
        nextDuration = formatDurationFromMinutes(endMins - startMins);
      }
    }

    const cleanDateStr = req.body.startDate || req.body.date;
    const parsedDate = cleanDateStr ? new Date(cleanDateStr) : existingExam.startDate;
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid exam date." });
    }

    const updateData = {
      title: String(req.body.title || req.body.name || existingExam.title).trim(),
      examType: String(req.body.examType ?? existingExam.examType).trim(),
      className: targetClass,
      section: String(req.body.section ?? existingExam.section).trim(),
      subject: String(req.body.subject ?? existingExam.subject).trim(),
      startDate: parsedDate,
      endDate: req.body.endDate ? new Date(req.body.endDate) : parsedDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      duration: nextDuration,
      totalMarks: nextTotalMarks,
      passingMarks: nextPassingMarks,
      instructions: String(req.body.instructions ?? existingExam.instructions).trim(),
      status: req.body.status || existingExam.status,
      subjects: [
        {
          subjectName: String(req.body.subject ?? existingExam.subject).trim(),
          maxMarks: nextTotalMarks,
          passingMarks: nextPassingMarks,
          date: parsedDate,
        },
      ],
    };

    const exam = await Exam.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (exam.status !== "Draft") {
      await dispatchNotificationSafe(async () => {
        const recipientIds = await resolveUserIdsForClass(exam.className, {
          includeStudents: true,
          includeTeachers: true,
        });
        await createNotificationsForUsers({
          recipientIds,
          excludeUserId: req.user._id,
          title: `Exam Schedule Updated: ${exam.title}`,
          message: `${exam.examType} exam details for ${exam.className} were updated (${exam.status}).`,
          category: "Examination Notifications",
          priority: "Medium",
          link: "/examinations/management",
          actorId: req.user._id,
          actorName: req.user.name,
          metadata: { examId: exam._id, className: exam.className, section: exam.section },
        });
      });
    }

    res.json({
      success: true,
      message: "Examination updated successfully.",
      exam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete examination
// @route   DELETE /api/exams/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const deleteExam = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators and principals can delete examinations.",
      });
    }

    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Examination not found" });
    }

    // Also delete any associated results
    await ExamResult.deleteMany({ exam: req.params.id });

    res.json({
      success: true,
      message: "Examination deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get results dashboard / lists with strict role isolation
// @route   GET /api/exams/results
// @access  Private
export const getExamResults = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants cannot access academic examination results.",
      });
    }

    const { examId, examTitle, examinationName, className, subjectName, studentId, status } =
      req.query;
    const filter = {};
    const andClauses = [];

    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      filter.exam = examId;
    } else if (examTitle || examinationName) {
      const titleQuery = String(examTitle || examinationName).trim();
      if (titleQuery) {
        const matchingExams = await Exam.find(
          { title: new RegExp(`^${escapeRegex(titleQuery)}$`, "i") },
          "_id"
        ).lean();
        filter.exam = { $in: matchingExams.map((e) => e._id) };
      }
    }

    if (studentId) filter.student = studentId;
    if (status) filter.status = status;

    const requestedClassRegex = buildClassRegex(className);
    if (requestedClassRegex) {
      andClauses.push({ className: requestedClassRegex });
    }

    if (subjectName && String(subjectName).trim()) {
      const cleanSubject = String(subjectName).trim();
      filter["subjects.subjectName"] = new RegExp(`^${escapeRegex(cleanSubject)}$`, "i");
    }

    // Student & User scope restriction: only see their own published results
    if (req.user.role === "STUDENT" || req.user.role === "USER") {
      const studentDocId = await getStudentIdForUser(req.user);
      if (studentDocId) {
        filter.student = studentDocId;
      } else {
        filter.student = req.user._id;
      }
    } else if (req.user.role === "TEACHER") {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const assignedRegexes = assignedClasses.map(buildClassRegex).filter(Boolean);
      if (assignedRegexes.length > 0) {
        andClauses.push({ className: { $in: assignedRegexes } });
      }
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const results = await ExamResult.find(filter)
      .populate("exam", "title examType className academicYear")
      .populate("student", "name rollNumber studentId className")
      .sort({ percentage: -1 });

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

async function resolveOrCreateExamDoc({ examId, examinationName, className }) {
  if (examId && mongoose.Types.ObjectId.isValid(examId)) {
    const existingById = await Exam.findById(examId);
    if (existingById) return existingById;
  }

  const cleanTitle = String(examinationName || "").trim();
  if (!cleanTitle) return null;

  const titleRegex = new RegExp(`^${escapeRegex(cleanTitle)}$`, "i");
  const classRegex = buildClassRegex(className);

  if (classRegex) {
    const exactMatch = await Exam.findOne({ title: titleRegex, className: classRegex });
    if (exactMatch) return exactMatch;
  }

  const titleMatch = await Exam.findOne({ title: titleRegex });
  if (titleMatch && !className) return titleMatch;

  return Exam.create({
    title: cleanTitle,
    examType: "Mid-Term",
    className: String(className || "General").trim() || "General",
    academicYear: "2026-2027",
    startDate: new Date(),
    endDate: new Date(),
    status: "Completed",
  });
}

// @desc    Submit student marks / result (Single or Bulk)
// @route   POST /api/exams/results or POST /api/exams/:id/results
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const submitResult = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to submit examination marks.",
      });
    }

    const requestedExamId = req.params.id || req.body.examId;
    const requestedExamName = String(
      req.body.examinationName || req.body.examTitle || req.body.title || ""
    ).trim();
    const requestedClassName = String(req.body.className || "").trim();
    const requestedSubjectName = String(req.body.subjectName || req.body.subject || "").trim();

    if (req.user.role === "TEACHER") {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const allowedKeys = new Set(assignedClasses.map(normalizeClassKey).filter(Boolean));
      const classToVerify = requestedClassName || req.body.results?.[0]?.className || "";
      if (
        allowedKeys.size > 0 &&
        classToVerify &&
        !allowedKeys.has(normalizeClassKey(classToVerify))
      ) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You are not authorized to grade students outside your assigned classes (${classToVerify || "unspecified class"}).`,
        });
      }

      if (allowedKeys.size > 0 && Array.isArray(req.body.results) && req.body.results.length > 0) {
        const studentIds = req.body.results
          .map((r) => r.studentId)
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
        const studentDocs = await Student.find(
          { _id: { $in: studentIds } },
          "_id className"
        ).lean();
        const studentClassMap = new Map(
          studentDocs.map((s) => [String(s._id), s.className])
        );

        for (const entry of req.body.results) {
          const entryClass =
            studentClassMap.get(String(entry.studentId)) ||
            entry.className ||
            requestedClassName;
          if (entryClass && !allowedKeys.has(normalizeClassKey(entryClass))) {
            return res.status(403).json({
              success: false,
              message: `Access denied: You are not authorized to grade students outside your assigned classes (${entryClass || "unspecified class"}).`,
            });
          }
        }
      }
    }

    const examDoc = await resolveOrCreateExamDoc({
      examId: requestedExamId,
      examinationName: requestedExamName,
      className: requestedClassName,
    });

    if (!examDoc) {
      return res.status(400).json({
        success: false,
        message: "Please enter an examination name or select a valid examination.",
      });
    }

    const examId = examDoc._id;

    // Support bulk submission if req.body.results is provided
    if (req.body.results && Array.isArray(req.body.results)) {
      const { results } = req.body;
      const processed = [];
      const notifyQueue = [];

      for (const entry of results) {
        const studentDoc = await Student.findById(entry.studentId);
        const marksObtained = Number(entry.marksObtained ?? entry.marks ?? 0);
        const maxMarks = Number(entry.maxMarks || req.body.maxMarks || 100);
        const subjectPercentage =
          maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 100) : 0;
        const subjectGrade = calculateGrade(subjectPercentage);
        const targetSubjectName =
          String(entry.subjectName || requestedSubjectName || examDoc.title || "General").trim() ||
          "General";

        const existingResult = await ExamResult.findOne({
          exam: examId,
          student: entry.studentId,
        });

        const existingSubjects = Array.isArray(existingResult?.subjects)
          ? existingResult.subjects.map((s) => ({
              subjectName: s.subjectName,
              marksObtained: s.marksObtained,
              maxMarks: s.maxMarks,
              grade: s.grade,
            }))
          : [];

        const nextSubjects = existingSubjects.filter(
          (s) =>
            String(s.subjectName || "").trim().toLowerCase() !==
            targetSubjectName.toLowerCase()
        );
        nextSubjects.push({
          subjectName: targetSubjectName,
          marksObtained,
          maxMarks,
          grade: subjectGrade,
        });

        const totalMarks = nextSubjects.reduce(
          (sum, item) => sum + Number(item.marksObtained || 0),
          0
        );
        const totalMaxMarks = nextSubjects.reduce(
          (sum, item) => sum + Number(item.maxMarks || 100),
          0
        );
        const percentage =
          totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
        const overallGrade = calculateGrade(percentage);
        const status = percentage >= 33 ? "Pass" : "Fail";

        const effectiveClassName =
          String(
            entry.className ||
              requestedClassName ||
              studentDoc?.className ||
              examDoc.className ||
              ""
          ).trim() || "General";

        const record = await ExamResult.findOneAndUpdate(
          { exam: examId, student: entry.studentId },
          {
            exam: examId,
            student: entry.studentId,
            studentName: entry.studentName || studentDoc?.name || "Student",
            rollNumber: entry.rollNumber || studentDoc?.rollNumber || "",
            className: effectiveClassName,
            subjects: nextSubjects,
            totalMarks,
            percentage,
            overallGrade,
            status,
            publishedBy: req.user._id,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        processed.push(record);
        notifyQueue.push({
          studentDoc,
          studentId: entry.studentId,
          className: effectiveClassName,
          percentage: subjectPercentage,
          overallGrade: subjectGrade,
          status: subjectPercentage >= 33 ? "Pass" : "Fail",
        });
      }

      await dispatchNotificationSafe(async () => {
        const examLabel = examDoc?.title || "Examination";
        await Promise.all(
          notifyQueue.map(async (item) => {
            const userId = await resolveStudentUserId({
              studentDoc: item.studentDoc,
              studentId: item.studentId,
              className: item.className,
            });
            if (!userId) return;
            await createNotificationsForUsers({
              recipientIds: [userId],
              excludeUserId: req.user._id,
              title: `Result Published: ${examLabel}`,
              message: `Your marks for ${examLabel}${requestedSubjectName ? ` (${requestedSubjectName})` : ""} have been published (${item.percentage}%, Grade ${item.overallGrade} - ${item.status}).`,
              category: "Examination Notifications",
              priority: "High",
              link: "/examinations/report-card",
              actorId: req.user._id,
              actorName: req.user.name,
              metadata: { examId, status: item.status, percentage: item.percentage },
            });
          })
        );
      });

      return res.json({
        success: true,
        message: `Successfully processed marks for ${processed.length} students.`,
        exam: examDoc,
        count: processed.length,
        results: processed,
      });
    }

    // Single student submission
    const { studentId, studentName, rollNumber, className, subjects } = req.body;

    if (!studentId || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student ID and subjects array are required.",
      });
    }

    const totalMarks = subjects.reduce(
      (sum, item) => sum + Number(item.marksObtained || 0),
      0
    );
    const maxMarks = subjects.reduce(
      (sum, item) => sum + Number(item.maxMarks || 100),
      0
    );

    const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    const overallGrade = calculateGrade(percentage);
    const status = percentage >= 33 ? "Pass" : "Fail";

    const result = await ExamResult.findOneAndUpdate(
      { exam: examId, student: studentId },
      {
        exam: examId,
        student: studentId,
        studentName: studentName || "Student",
        rollNumber: rollNumber || "",
        className: className || requestedClassName || examDoc.className || "",
        subjects,
        totalMarks,
        percentage,
        overallGrade,
        status,
        publishedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await dispatchNotificationSafe(async () => {
      const userId = await resolveStudentUserId({
        studentId,
        rollNumber,
        className: className || examDoc?.className || "",
      });
      if (!userId) return;
      const examLabel = examDoc?.title || "Examination";
      await createNotificationsForUsers({
        recipientIds: [userId],
        excludeUserId: req.user._id,
        title: `Result Published: ${examLabel}`,
        message: `Your marks for ${examLabel} have been published (${percentage}%, Grade ${overallGrade} - ${status}).`,
        category: "Examination Notifications",
        priority: "High",
        link: "/examinations/report-card",
        actorId: req.user._id,
        actorName: req.user.name,
        metadata: { examId, status, percentage },
      });
    });

    res.json({
      success: true,
      message: "Student examination marks submitted successfully.",
      exam: examDoc,
      result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student report card with strict ownership check
// @route   GET /api/exams/report-card/:studentId
// @access  Private
export const getReportCard = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants cannot access student report cards.",
      });
    }

    const { studentId } = req.params;

    // Students and User role can only view their own report card
    if (req.user.role === "STUDENT" || req.user.role === "USER") {
      const userStudentDocId = await getStudentIdForUser(req.user);
      const isOwner =
        (userStudentDocId && userStudentDocId.toString() === studentId) ||
        req.user.studentId === studentId ||
        req.user._id.toString() === studentId;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You are only permitted to view your own report card.",
        });
      }
    } else if (req.user.role === "TEACHER") {
      // Teacher can only view report card for students in assigned classes
      const targetStudent = await Student.findById(studentId);
      if (targetStudent) {
        const assignedClasses = await getTeacherAssignedClasses(req.user);
        const allowedKeys = new Set(assignedClasses.map(normalizeClassKey).filter(Boolean));
        if (allowedKeys.size > 0 && !allowedKeys.has(normalizeClassKey(targetStudent.className))) {
          return res.status(403).json({
            success: false,
            message: `Access denied: Student belongs to ${targetStudent.className}, which is outside your assigned classes.`,
          });
        }
      }
    }

    const results = await ExamResult.find({ student: studentId })
      .populate("exam", "title examType className academicYear")
      .populate("student", "name rollNumber studentId className guardianName")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: results.length, reportCard: results });
  } catch (error) {
    next(error);
  }
};
