import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
export const getTeachers = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants cannot access faculty records.",
      });
    }

    const { department, status, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { teacherId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    // Role-based data scoping
    if (req.user.role === "HOD" && req.user.department) {
      filter.department = req.user.department;
    }

    // If student is querying, only project public directory fields
    let query = Teacher.find(filter).sort({ name: 1 });
    if (req.user.role === "STUDENT") {
      query = query.select("name teacherId department designation qualification assignedSubjects status");
    }

    const teachers = await query;

    res.json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
export const getTeacherById = async (req, res, next) => {
  try {
    if (req.user.role === "ACCOUNTANT") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Accountants cannot access faculty records.",
      });
    }

    let query = Teacher.findById(req.params.id);

    // If student, strip private phone
    if (req.user.role === "STUDENT") {
      query = query.select("name teacherId department designation qualification assignedSubjects status");
    }

    const teacher = await query;
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    // If teacher is viewing another teacher, sanitize private info
    if (
      req.user.role === "TEACHER" &&
      teacher.user?.toString() !== req.user._id.toString() &&
      teacher.teacherId !== req.user.teacherId
    ) {
      const sanitized = teacher.toObject();
      delete sanitized.phone;
      return res.json({ success: true, teacher: sanitized });
    }

    res.json({ success: true, teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Create teacher
// @route   POST /api/teachers
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const createTeacher = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators and principals can create faculty records.",
      });
    }

    const { name, email, phone, department, designation, qualification, assignedSubjects } =
      req.body;

    const teacherId = `TCH${Date.now().toString().slice(-4)}`;

    const teacher = await Teacher.create({
      teacherId,
      name,
      email: email.toLowerCase(),
      phone,
      department,
      designation: designation || "Assistant Professor",
      qualification: qualification || "",
      assignedSubjects: assignedSubjects || [],
    });

    res.status(201).json({
      success: true,
      message: "Teacher profile registered successfully.",
      teacher,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const updateTeacher = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators and principals can update faculty records.",
      });
    }

    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.json({
      success: true,
      message: "Teacher updated successfully.",
      teacher,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign subjects / classes to teacher
// @route   POST /api/teachers/assign-subjects or POST /api/teachers/:id/assign-subjects
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const assignSubjects = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators and principals can assign courses.",
      });
    }

    const {
      assignedSubjects,
      assignedClasses,
      classes,
      teacherId,
      teacherName,
      department,
      academicYear,
    } = req.body;

    const targetClasses =
      Array.isArray(assignedClasses) && assignedClasses.length > 0
        ? assignedClasses
        : Array.isArray(classes) && classes.length > 0
        ? classes
        : ["General"];

    let formattedSubjects = [];
    if (Array.isArray(assignedSubjects)) {
      if (assignedSubjects.length === 0) {
        formattedSubjects = [];
      } else if (typeof assignedSubjects[0] === "string") {
        for (const subj of assignedSubjects) {
          const cleanSub = String(subj || "").trim();
          if (!cleanSub) continue;
          for (const cls of targetClasses) {
            const cleanCls = String(cls || "").trim() || "General";
            formattedSubjects.push({
              subjectName: cleanSub,
              className: cleanCls,
              section: "A",
            });
          }
        }
      } else {
        formattedSubjects = assignedSubjects
          .filter((item) => item && item.subjectName && item.className)
          .map((item) => ({
            subjectName: String(item.subjectName).trim(),
            className: String(item.className).trim(),
            section: String(item.section || "A").trim() || "A",
          }));
      }
    }

    const candidateId = req.params.id || teacherId;
    const cleanTeacherName = String(teacherName || "").trim();
    const cleanDepartment = String(department || "").trim();
    const cleanAcademicYear = String(academicYear || "").trim();

    let teacher = null;
    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
      teacher = await Teacher.findById(candidateId);
    }

    if (!teacher && cleanTeacherName) {
      const escapedName = cleanTeacherName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      teacher = await Teacher.findOne({
        name: new RegExp(`^${escapedName}$`, "i"),
      });
    }

    if (!teacher && cleanTeacherName) {
      const slug = cleanTeacherName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "") || "teacher";
      const suffix = Date.now().toString().slice(-5);

      teacher = await Teacher.create({
        teacherId: `TCH${suffix}`,
        name: cleanTeacherName,
        email: `${slug}.${suffix}@teacher.eduflow.local`,
        department: cleanDepartment || "General",
        academicYear: cleanAcademicYear || "2026-27",
        assignedSubjects: formattedSubjects,
      });
    } else if (teacher) {
      teacher.assignedSubjects = formattedSubjects;
      if (cleanAcademicYear) teacher.academicYear = cleanAcademicYear;
      if (cleanDepartment) teacher.department = cleanDepartment;
      await teacher.save();
    }

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.json({
      success: true,
      message: "Teaching assignments updated successfully.",
      teacher,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const deleteTeacher = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Super Admin, Admin, and Principal can delete faculty records.",
      });
    }

    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }
    res.json({ success: true, message: "Teacher record deleted successfully." });
  } catch (error) {
    next(error);
  }
};
