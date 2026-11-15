import mongoose from "mongoose";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import {
  createNotificationsForUsers,
  dispatchNotificationSafe,
  resolveActiveUserIdsByRoles,
  resolveStudentUserId,
} from "../services/notification.service.js";

async function syncMissingStudentUsers() {
  const studentUsers = await User.find(
    { role: "STUDENT" },
    "name email className class department section rollNumber studentId status gender dob address"
  ).lean();

  if (studentUsers.length === 0) return;

  const existingStudents = await Student.find({}, "user email studentId").lean();
  const linkedUserIds = new Set(
    existingStudents.map((s) => (s.user ? String(s.user) : "")).filter(Boolean)
  );
  const existingEmails = new Set(
    existingStudents.map((s) => String(s.email || "").trim().toLowerCase()).filter(Boolean)
  );
  const existingStudentIds = new Set(
    existingStudents.map((s) => String(s.studentId || "").trim().toUpperCase()).filter(Boolean)
  );

  const docsToInsert = [];
  for (const u of studentUsers) {
    const uid = String(u._id);
    const emailKey = String(u.email || "").trim().toLowerCase();
    if (linkedUserIds.has(uid) || (emailKey && existingEmails.has(emailKey))) {
      continue;
    }

    let generatedId = (u.studentId || `STU${uid.slice(-5).toUpperCase()}`).toUpperCase();
    if (existingStudentIds.has(generatedId)) {
      generatedId = `STU${uid.slice(-8).toUpperCase()}`;
    }
    existingStudentIds.add(generatedId);
    if (emailKey) existingEmails.add(emailKey);

    docsToInsert.push({
      user: u._id,
      studentId: generatedId,
      name: u.name || "Student",
      email: emailKey,
      rollNumber: u.rollNumber || generatedId,
      className: u.className || u.class || u.department || "General",
      section: u.section || "A",
      gender: ["Male", "Female", "Other"].includes(u.gender) ? u.gender : undefined,
      dob: u.dob || undefined,
      address: u.address || "",
      status: ["active", "inactive", "promoted", "graduated", "suspended"].includes(u.status)
        ? u.status
        : "active",
    });
  }

  if (docsToInsert.length > 0) {
    await Student.insertMany(docsToInsert, { ordered: false }).catch(() => {});
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildClassRegex(value) {
  const core = String(value || "")
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

function buildSectionRegex(value) {
  const core = String(value || "")
    .trim()
    .replace(/^section\s+/i, "")
    .trim();
  if (!core) return null;
  return new RegExp(`^(?:section\\s+)?${escapeRegex(core)}$`, "i");
}

// Helper to get assigned classes for a teacher
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

// @desc    Get all students with strict role-based data isolation
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants cannot access student academic records.",
      });
    }

    await syncMissingStudentUsers();

    const { className, section, status, gender, academicYear, search } = req.query;
    const filter = {};
    const andClauses = [];

    const classRegex = buildClassRegex(className);
    if (classRegex) andClauses.push({ className: classRegex });

    const sectionRegex = buildSectionRegex(section);
    if (sectionRegex) andClauses.push({ section: sectionRegex });

    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (academicYear) filter.academicYear = academicYear;

    if (search) {
      andClauses.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { rollNumber: { $regex: search, $options: "i" } },
          { studentId: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Role-based data isolation at the MongoDB query level
    if (req.user.role === "STUDENT") {
      // Student A ONLY sees Student A's own record
      const userEmail = String(req.user.email || "").trim().toLowerCase();
      andClauses.push({
        $or: [
          { user: req.user._id },
          { studentId: req.user.studentId || "NONE" },
          ...(userEmail ? [{ email: new RegExp(`^${escapeRegex(userEmail)}$`, "i") }] : []),
        ],
      });
    } else if (req.user.role === "TEACHER") {
      // Teachers with explicit assigned classes see students in those classes;
      // teachers without class restrictions yet see registered students instead of an empty list.
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const assignedRegexes = assignedClasses.map(buildClassRegex).filter(Boolean);
      if (assignedRegexes.length > 0) {
        andClauses.push({ className: { $in: assignedRegexes } });
      }
    }
    // Admin, Super Admin, Principal have full institutional access

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const students = await Student.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student with ownership and assignment protection
// @route   GET /api/students/:id
// @access  Private
export const getStudentById = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants cannot access student academic records.",
      });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Student scope restriction: Cannot access another student's record
    if (req.user.role === "STUDENT") {
      const isOwner =
        student.user?.toString() === req.user._id.toString() ||
        student.studentId === req.user.studentId ||
        student.email?.toLowerCase() === req.user.email?.toLowerCase();

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You are not authorized to view another student's profile.",
        });
      }
    } else if (req.user.role === "TEACHER") {
      // Teacher scope restriction: When assigned classes exist, restrict to assigned classes
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const assignedRegexes = assignedClasses.map(buildClassRegex).filter(Boolean);
      if (
        assignedRegexes.length > 0 &&
        !assignedRegexes.some((rx) => rx.test(student.className || ""))
      ) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Student is enrolled in ${student.className}, which is outside your assigned classes.`,
        });
      }
    }

    res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const createStudent = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators and principals can create student records.",
      });
    }

    const {
      name,
      email,
      className,
      section,
      gender,
      rollNumber,
      guardianName,
      guardianPhone,
      address,
      dob,
      status,
    } = req.body;

    if (!String(name || "").trim() || !String(className || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Student name and className are required.",
      });
    }

    const studentId = `STU${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    const student = await Student.create({
      studentId,
      name: String(name).trim(),
      email: email ? String(email).trim().toLowerCase() : "",
      className: String(className).trim(),
      section: String(section || "A").trim() || "A",
      gender,
      rollNumber: String(rollNumber || "").trim(),
      guardianName,
      guardianPhone,
      address,
      dob,
      status: status ? String(status).toLowerCase() : "active",
    });

    res.status(201).json({
      success: true,
      message: "Student profile registered successfully.",
      student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const updateStudent = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have permission to modify official student records.",
      });
    }

    const isOperatorUpdate = req.body.$push || req.body.$pull || req.body.$addToSet;
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: !isOperatorUpdate,
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Keep linked User account className/section/name synced when student profile is updated
    if (!isOperatorUpdate) {
      const userSync = {};
      if (req.body.name !== undefined) userSync.name = student.name;
      if (req.body.className !== undefined) userSync.className = student.className;
      if (req.body.section !== undefined) userSync.section = student.section;
      if (req.body.studentId !== undefined) userSync.studentId = student.studentId;
      if (Object.keys(userSync).length > 0) {
        if (student.user) {
          await User.findByIdAndUpdate(student.user, { $set: userSync }).catch(() => {});
        } else {
          const matchClauses = [];
          if (student.studentId) matchClauses.push({ studentId: student.studentId });
          if (student.email) matchClauses.push({ email: String(student.email).trim().toLowerCase() });
          if (matchClauses.length > 0) {
            await User.updateMany(
              { role: "STUDENT", $or: matchClauses },
              { $set: userSync }
            ).catch(() => {});
          }
        }
      }
    }

    res.json({
      success: true,
      message: "Student updated successfully.",
      student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Promote students to next class
// @route   POST /api/students/promote
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const promoteStudents = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators and principals can promote students.",
      });
    }

    const { studentIds, fromClass, toClass, nextAcademicYear } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || !toClass) {
      return res.status(400).json({
        success: false,
        message: "Please provide studentIds array and toClass target.",
      });
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      {
        $set: {
          className: toClass,
          academicYear: nextAcademicYear || "2027-2028",
          status: "promoted",
        },
      }
    );

    res.json({
      success: true,
      message: `Successfully promoted ${result.modifiedCount} students from ${fromClass || "current class"} to ${toClass}.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const deleteStudent = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Super Admin, Admin, and Principal can delete student records.",
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, message: "Student record deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);
const ALLOWED_DOCUMENT_EXTS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

function validateDocumentPayload({ fileUrl, fileName }) {
  const cleanUrl = String(fileUrl || "").trim();
  const dataUrlMatch = cleanUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!dataUrlMatch) {
    return { error: "Invalid file payload. Please upload a valid PDF, JPG, JPEG, or PNG file." };
  }

  const mimeType = dataUrlMatch[1].toLowerCase().trim();
  if (!ALLOWED_DOCUMENT_MIMES.has(mimeType)) {
    return { error: "Unsupported file type. Allowed formats: PDF, JPG, JPEG, PNG." };
  }

  const cleanFileName = String(fileName || "document").trim() || "document";
  const dotIdx = cleanFileName.lastIndexOf(".");
  if (dotIdx !== -1) {
    const ext = cleanFileName.slice(dotIdx).toLowerCase();
    if (!ALLOWED_DOCUMENT_EXTS.has(ext)) {
      return { error: "Unsupported file extension. Allowed formats: PDF, JPG, JPEG, PNG." };
    }
  }

  const byteSize = Buffer.from(dataUrlMatch[2], "base64").length;
  if (byteSize <= 0) {
    return { error: "Uploaded file is empty." };
  }
  if (byteSize > MAX_DOCUMENT_BYTES) {
    return { error: "File exceeds maximum allowed size of 5 MB." };
  }

  const formattedSize =
    byteSize >= 1024 * 1024
      ? `${(byteSize / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(byteSize / 1024))} KB`;

  return { cleanUrl, mimeType, cleanFileName, formattedSize };
}

async function assertTeacherStudentAccess(reqUser, student) {
  if (reqUser.role !== "TEACHER") return null;
  const assignedClasses = await getTeacherAssignedClasses(reqUser);
  const assignedRegexes = assignedClasses.map(buildClassRegex).filter(Boolean);
  if (
    assignedRegexes.length > 0 &&
    !assignedRegexes.some((rx) => rx.test(student.className || ""))
  ) {
    return `Access denied: Student is in ${student.className}, outside your assigned classes.`;
  }
  return null;
}

async function findTargetStudentForDocument({ mongoStudentId, studentId, studentName }) {
  if (mongoStudentId) {
    if (!mongoose.Types.ObjectId.isValid(mongoStudentId)) {
      return { errorStatus: 400, errorMessage: "Invalid student record ID." };
    }
    const student = await Student.findById(mongoStudentId);
    return student
      ? { student }
      : { errorStatus: 404, errorMessage: "Selected student record not found." };
  }

  const cleanStudentId = String(studentId || "").trim();
  const cleanName = String(studentName || "").trim();

  if (cleanStudentId) {
    const byId = await Student.findOne({
      studentId: new RegExp(`^${escapeRegex(cleanStudentId)}$`, "i"),
    });
    if (byId) return { student: byId };
  }

  if (cleanName) {
    const byName = await Student.find({
      name: new RegExp(`^${escapeRegex(cleanName)}$`, "i"),
    }).limit(2);
    if (byName.length === 1) return { student: byName[0] };
    if (byName.length > 1) {
      return {
        errorStatus: 400,
        errorMessage: "Multiple students share this name. Please enter the Student ID / Admission Number.",
      };
    }
  }

  return {
    errorStatus: 404,
    errorMessage: "Matching student not found. Check Student Name and Student ID / Admission Number.",
  };
}

// @desc    Upload document for a student by authorized staff or own student
// @route   POST /api/students/documents
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER, STUDENT)
export const uploadStudentDocument = async (req, res, next) => {
  try {
    const allowedUploadRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"];
    if (!allowedUploadRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not authorized to upload student documents.",
      });
    }

    await syncMissingStudentUsers();

    const {
      mongoStudentId,
      studentId,
      studentName,
      title,
      documentTitle,
      documentName,
      documentType,
      description,
      fileName,
      fileUrl,
    } = req.body;

    const cleanTitle = String(title || documentTitle || documentName || "").trim();
    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: "Document title is required.",
      });
    }

    let student = null;

    if (req.user.role === "STUDENT") {
      const userEmail = String(req.user.email || "").trim().toLowerCase();
      student = await Student.findOne({
        $or: [
          { user: req.user._id },
          ...(req.user.studentId ? [{ studentId: req.user.studentId }] : []),
          ...(userEmail ? [{ email: new RegExp(`^${escapeRegex(userEmail)}$`, "i") }] : []),
        ],
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found for your account.",
        });
      }

      if (
        (mongoStudentId && String(mongoStudentId) !== String(student._id)) ||
        (studentId && String(studentId).trim().toUpperCase() !== String(student.studentId || "").trim().toUpperCase())
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Students can only upload documents to their own profile.",
        });
      }
    } else {
      if (!mongoStudentId && !String(studentId || "").trim() && !String(studentName || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Student Name and Student ID / Admission Number are required.",
        });
      }

      const lookup = await findTargetStudentForDocument({
        mongoStudentId,
        studentId,
        studentName,
      });
      if (!lookup.student) {
        return res.status(lookup.errorStatus).json({ success: false, message: lookup.errorMessage });
      }
      student = lookup.student;

      const teacherAccessError = await assertTeacherStudentAccess(req.user, student);
      if (teacherAccessError) {
        return res.status(403).json({ success: false, message: teacherAccessError });
      }
    }

    const fileValidation = validateDocumentPayload({ fileUrl, fileName });
    if (fileValidation.error) {
      return res.status(400).json({ success: false, message: fileValidation.error });
    }

    const now = new Date();
    student.documents.unshift({
      title: cleanTitle,
      documentType: String(documentType || "Identity Proof").trim() || "Identity Proof",
      description: String(description || "").trim(),
      fileName: fileValidation.cleanFileName,
      fileSize: fileValidation.formattedSize,
      fileUrl: fileValidation.cleanUrl,
      mimeType: fileValidation.mimeType,
      uploadDate: now,
      status: "Pending",
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      history: [
        {
          action: "Uploaded",
          status: "Pending",
          actor: req.user._id,
          actorName: req.user.name,
          actorRole: req.user.role,
          reason: "",
          timestamp: now,
        },
      ],
    });

    await student.save();
    const savedDoc = student.documents[0];

    await dispatchNotificationSafe(async () => {
      if (req.user.role === "STUDENT") {
        const reviewerIds = await resolveActiveUserIdsByRoles([
          "SUPER_ADMIN",
          "ADMIN",
          "PRINCIPAL",
          "TEACHER",
        ]);
        if (reviewerIds.length > 0) {
          await createNotificationsForUsers({
            recipientIds: reviewerIds,
            excludeUserId: req.user._id,
            title: `Document Uploaded: ${cleanTitle}`,
            message: `${student.name} (${student.studentId}) uploaded "${cleanTitle}" (${savedDoc.documentType}) for approval.`,
            category: "General System Notifications",
            priority: "Medium",
            link: "/students-management/documents",
            actorId: req.user._id,
            actorName: req.user.name,
            metadata: { studentId: student._id, documentId: savedDoc._id },
          });
        }
      } else {
        const studentUserId = await resolveStudentUserId({
          studentDoc: student,
          studentId: student._id,
        });
        if (studentUserId) {
          await createNotificationsForUsers({
            recipientIds: [studentUserId],
            excludeUserId: req.user._id,
            title: `Document Uploaded: ${cleanTitle}`,
            message: `${req.user.name} uploaded "${cleanTitle}" (${savedDoc.documentType}) to your student record.`,
            category: "General System Notifications",
            priority: "Medium",
            link: "/students-management/documents",
            actorId: req.user._id,
            actorName: req.user.name,
            metadata: { studentId: student._id, documentId: savedDoc._id },
          });
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      document: savedDoc,
      studentId: student._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve, verify, reject, or update status of a student document
// @route   PUT /api/students/:id/documents/:docId/status
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER)
export const updateStudentDocumentStatus = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Super Admin, Admin, Principal, or Teacher can approve or verify student documents.",
      });
    }

    const { id, docId } = req.params;
    const { status, rejectionReason } = req.body;
    if (!["Pending", "Approved", "Rejected", "Verified"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Pending, Approved, Rejected, or Verified.",
      });
    }

    const cleanReason = String(rejectionReason || "").trim();
    if (status === "Rejected" && !cleanReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting a document.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or document ID.",
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const teacherAccessError = await assertTeacherStudentAccess(req.user, student);
    if (teacherAccessError) {
      return res.status(403).json({ success: false, message: teacherAccessError });
    }

    const doc = student.documents.id(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (status === "Verified" && doc.status !== "Approved" && doc.status !== "Verified") {
      return res.status(400).json({
        success: false,
        message: "Document must be Approved before it can be marked as Verified.",
      });
    }

    const now = new Date();
    doc.status = status;

    if (status === "Approved") {
      doc.approvedBy = req.user._id;
      doc.approvedByName = req.user.name;
      doc.approvedAt = now;
      doc.verifiedBy = undefined;
      doc.verifiedByName = "";
      doc.verifiedAt = undefined;
      doc.rejectedBy = undefined;
      doc.rejectedByName = "";
      doc.rejectedAt = undefined;
      doc.rejectionReason = "";
    } else if (status === "Verified") {
      doc.verifiedBy = req.user._id;
      doc.verifiedByName = req.user.name;
      doc.verifiedAt = now;
      doc.rejectionReason = "";
    } else if (status === "Rejected") {
      doc.rejectedBy = req.user._id;
      doc.rejectedByName = req.user.name;
      doc.rejectedAt = now;
      doc.rejectionReason = cleanReason;
      doc.verifiedBy = undefined;
      doc.verifiedByName = "";
      doc.verifiedAt = undefined;
    } else if (status === "Pending") {
      doc.approvedBy = undefined;
      doc.approvedByName = "";
      doc.approvedAt = undefined;
      doc.verifiedBy = undefined;
      doc.verifiedByName = "";
      doc.verifiedAt = undefined;
      doc.rejectedBy = undefined;
      doc.rejectedByName = "";
      doc.rejectedAt = undefined;
      doc.rejectionReason = "";
    }

    doc.history = doc.history || [];
    doc.history.push({
      action:
        status === "Approved"
          ? "Approved"
          : status === "Verified"
          ? "Verified"
          : status === "Rejected"
          ? "Rejected"
          : "Reset to Pending",
      status,
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      reason: status === "Rejected" ? cleanReason : "",
      timestamp: now,
    });

    await student.save();

    await dispatchNotificationSafe(async () => {
      const studentUserId = await resolveStudentUserId({
        studentDoc: student,
        studentId: student._id,
      });
      if (studentUserId) {
        const reasonNote = status === "Rejected" && cleanReason ? ` Reason: ${cleanReason}` : "";
        await createNotificationsForUsers({
          recipientIds: [studentUserId],
          excludeUserId: req.user._id,
          title: `Document ${status}: ${doc.title}`,
          message: `Your document "${doc.title}" was marked as ${status} by ${req.user.name}.${reasonNote}`,
          category: "General System Notifications",
          priority: "Medium",
          link: "/students-management/documents",
          actorId: req.user._id,
          actorName: req.user.name,
          metadata: { studentId: student._id, documentId: doc._id, status },
        });
      }
    });

    res.json({
      success: true,
      message: `Document status updated to ${status}.`,
      document: doc,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a student's uploaded document
// @route   DELETE /api/students/:id/documents/:docId
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL only)
export const deleteStudentDocument = async (req, res, next) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Super Admin, Admin, or Principal can delete student documents.",
      });
    }

    const { id, docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ success: false, message: "Invalid student or document ID." });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const doc = student.documents.id(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    doc.deleteOne();
    await student.save();

    res.json({ success: true, message: "Document deleted successfully." });
  } catch (error) {
    next(error);
  }
};
