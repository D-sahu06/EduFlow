import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import Admission from "../models/Admission.js";
import { Announcement, Message } from "../models/Communication.js";
import { Attendance } from "../models/Attendance.js";
import { FeeDue, FeeReceipt } from "../models/Fee.js";
import { Exam, ExamResult } from "../models/Exam.js";
import Notification from "../models/Notification.js";

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFlexibleClassRegex(className) {
  const normalized = String(className || "").trim();
  if (!normalized) return null;
  const stripped = normalized.replace(/^class\s+/i, "").trim();
  const escapedFull = escapeRegex(normalized);
  const escapedStripped = escapeRegex(stripped);
  return new RegExp(`^(?:class\\s+)?(?:${escapedFull}|${escapedStripped})$`, "i");
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
    return Array.from(new Set(teacherDoc.assignedSubjects.map((s) => s.className).filter(Boolean)));
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

// @desc    Global Search across authorized ERP records
// @route   GET /api/search?q=:query
// @access  Private (Authenticated users)
export const globalSearch = async (req, res, next) => {
  try {
    const rawQuery = (req.query.q || "").trim();
    if (!rawQuery) {
      return res.json({ success: true, count: 0, results: [] });
    }

    const escaped = escapeRegex(rawQuery);
    const regex = new RegExp(escaped, "i");

    const role = String(req.user.role || "").toUpperCase();
    const results = [];

    // 1. STUDENTS
    if (role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(req.user);
      if (ownStudentId) {
        const ownStudent = await Student.findOne({
          _id: ownStudentId,
          $or: [
            { name: regex },
            { studentId: regex },
            { rollNumber: regex },
            { email: regex },
            { className: regex },
          ],
        });
        if (ownStudent) {
          results.push({
            id: ownStudent._id,
            title: ownStudent.name,
            category: "Student",
            subtitle: `${ownStudent.className || "General"} • ID: ${ownStudent.studentId}`,
            url: "/profile",
          });
        }
      }
    } else if (role === "TEACHER") {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const classRegexes = assignedClasses
        .map((c) => buildFlexibleClassRegex(c))
        .filter(Boolean);

      const studentFilter = {
        $or: [{ name: regex }, { studentId: regex }, { rollNumber: regex }, { email: regex }],
      };
      if (classRegexes.length > 0) {
        studentFilter.className = { $in: classRegexes };
      }

      const students = await Student.find(studentFilter).limit(5);
      students.forEach((s) => {
        results.push({
          id: s._id,
          title: s.name,
          category: "Student",
          subtitle: `${s.className || ""} • ID: ${s.studentId}`,
          url: `/students-management/all?search=${encodeURIComponent(s.name)}`,
        });
      });
    } else if (role === "HOD") {
      const studentFilter = {
        $or: [{ name: regex }, { studentId: regex }, { rollNumber: regex }, { email: regex }],
      };
      if (req.user.department) {
        studentFilter.className = new RegExp(escapeRegex(req.user.department), "i");
      }
      const students = await Student.find(studentFilter).limit(5);
      students.forEach((s) => {
        results.push({
          id: s._id,
          title: s.name,
          category: "Student",
          subtitle: `${s.className || ""} • ID: ${s.studentId}`,
          url: `/students-management/all?search=${encodeURIComponent(s.name)}`,
        });
      });
    } else if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      const students = await Student.find({
        $or: [{ name: regex }, { studentId: regex }, { rollNumber: regex }, { email: regex }, { className: regex }],
      }).limit(5);
      students.forEach((s) => {
        results.push({
          id: s._id,
          title: s.name,
          category: "Student",
          subtitle: `${s.className || ""} • ID: ${s.studentId}`,
          url: `/students-management/all?search=${encodeURIComponent(s.name)}`,
        });
      });
    }

    // 2. TEACHERS (Visible only to roles authorized for /teacher-management/all-teachers)
    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD", "TEACHER"].includes(role)) {
      const teacherFilter = {
        $or: [
          { name: regex },
          { teacherId: regex },
          { department: regex },
          { designation: regex },
          { email: regex },
        ],
      };
      if (role === "HOD" && req.user.department) {
        teacherFilter.department = new RegExp(escapeRegex(req.user.department), "i");
      }
      const teachers = await Teacher.find(teacherFilter).limit(5);
      teachers.forEach((t) => {
        results.push({
          id: t._id,
          title: t.name,
          category: "Teacher",
          subtitle: `${t.designation || "Faculty"} • ${t.department || "General"}`,
          url: `/teacher-management/all-teachers?search=${encodeURIComponent(t.name)}`,
        });
      });
    }

    // 3. USER ACCOUNTS (Super Admin, Admin, Principal)
    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      const userFilter = {
        $or: [
          { name: regex },
          { username: regex },
          { email: regex },
          { department: regex },
          { rollNumber: regex },
          { studentId: regex },
          { teacherId: regex },
        ],
      };
      if (role === "ADMIN") {
        userFilter.role = { $ne: "SUPER_ADMIN" };
      } else if (role === "PRINCIPAL") {
        userFilter.role = { $nin: ["SUPER_ADMIN", "ADMIN"] };
      }
      const users = await User.find(userFilter, "name username role department").limit(5);
      users.forEach((u) => {
        results.push({
          id: u._id,
          title: u.name,
          category: "User",
          subtitle: `@${u.username} • ${String(u.role || "").replace("_", " ")}`,
          url: "/admin/users",
        });
      });
    }

    // 4. ADMISSIONS (Super Admin, Admin, Principal only)
    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      const admissions = await Admission.find({
        $or: [
          { applicantName: regex },
          { applicationNumber: regex },
          { applyingForClass: regex },
          { email: regex },
        ],
      }).limit(5);
      admissions.forEach((a) => {
        results.push({
          id: a._id,
          title: a.applicantName,
          category: "Admission",
          subtitle: `App #${a.applicationNumber} • Class: ${a.applyingForClass}`,
          url: "/admission/applications",
        });
      });
    }

    // 5. ANNOUNCEMENTS (Audience-scoped)
    const announceFilter = {
      $or: [{ title: regex }, { content: regex }, { category: regex }],
    };
    if (role === "STUDENT") {
      announceFilter.audience = { $in: ["All", "Students"] };
    } else if (role === "TEACHER" || role === "HOD") {
      announceFilter.audience = { $in: ["All", "Teachers"] };
    } else if (role === "ACCOUNTANT") {
      announceFilter.audience = { $in: ["All", "Accountant"] };
    }
    const announcements = await Announcement.find(announceFilter).sort({ createdAt: -1 }).limit(5);
    announcements.forEach((an) => {
      results.push({
        id: an._id,
        title: an.title,
        category: "Announcement",
        subtitle: `${an.category || "General"} • ${an.priority || "Medium"} Priority`,
        url: "/communication/announcements",
      });
    });

    // 6. PERSONAL NOTIFICATIONS & MESSAGES (Strictly user-scoped)
    const [notifications, messages] = await Promise.all([
      Notification.find({
        recipient: req.user._id,
        $or: [{ title: regex }, { message: regex }, { category: regex }],
      })
        .sort({ createdAt: -1 })
        .limit(4),
      Message.find({
        $or: [
          { sender: req.user._id },
          { recipientUser: req.user._id },
          { recipientRole: { $in: ["ALL", role] } },
          ...(req.user.email ? [{ recipientEmail: req.user.email.toLowerCase() }] : []),
        ],
        $and: [
          {
            $or: [
              { subject: regex },
              { content: regex },
              { senderName: regex },
              { recipient: regex },
            ],
          },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(4),
    ]);

    notifications.forEach((n) => {
      results.push({
        id: n._id,
        title: n.title,
        category: "Notification",
        subtitle: `${n.category} • ${n.message}`,
        url: n.link || "/communication/notification",
      });
    });

    messages.forEach((m) => {
      results.push({
        id: m._id,
        title: m.subject,
        category: "Message",
        subtitle: `From: ${m.senderName} → ${m.recipient}`,
        url: "/communication/messages",
      });
    });

    // 7. ATTENDANCE (Role-scoped)
    if (role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(req.user);
      if (ownStudentId) {
        const att = await Attendance.find({
          student: ownStudentId,
          $or: [{ status: regex }, { remarks: regex }, { className: regex }, { subject: regex }],
        })
          .sort({ date: -1 })
          .limit(3);
        att.forEach((r) => {
          results.push({
            id: r._id,
            title: `Attendance: ${r.status}`,
            category: "Attendance",
            subtitle: `${r.date ? new Date(r.date).toISOString().slice(0, 10) : ""} • ${r.className || ""}`,
            url: "/attendance/view",
          });
        });
      }
    } else if (role === "TEACHER") {
      const assignedClasses = await getTeacherAssignedClasses(req.user);
      const classRegexes = assignedClasses
        .map((c) => buildFlexibleClassRegex(c))
        .filter(Boolean);
      const attFilter = {
        $or: [{ className: regex }, { status: regex }, { studentName: regex }, { rollNumber: regex }],
      };
      if (classRegexes.length > 0) {
        attFilter.className = { $in: classRegexes };
      } else {
        attFilter.markedBy = req.user._id;
      }
      const att = await Attendance.find(attFilter).populate("student", "name rollNumber").sort({ date: -1 }).limit(3);
      att.forEach((r) => {
        const stuName = r.studentName || r.student?.name;
        results.push({
          id: r._id,
          title: `Attendance - ${r.className || "Class"} (${r.status})`,
          category: "Attendance",
          subtitle: stuName ? `Student: ${stuName}` : undefined,
          url: "/attendance/view",
        });
      });
    } else if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD"].includes(role)) {
      const att = await Attendance.find({
        $or: [{ className: regex }, { status: regex }, { studentName: regex }, { rollNumber: regex }],
      })
        .populate("student", "name rollNumber")
        .sort({ date: -1 })
        .limit(3);
      att.forEach((r) => {
        const stuName = r.studentName || r.student?.name;
        results.push({
          id: r._id,
          title: `Attendance - ${r.className || "Class"} (${r.status})`,
          category: "Attendance",
          subtitle: stuName ? `Student: ${stuName}` : undefined,
          url: "/attendance/view",
        });
      });
    }

    // 8. FEES & FINANCE (Role-scoped: Student sees own; Accountant/Admin/Principal sees institutional)
    if (role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(req.user);
      if (ownStudentId) {
        const dues = await FeeDue.find({
          student: ownStudentId,
          $or: [{ status: regex }, { className: regex }, { studentName: regex }],
        }).limit(3);
        dues.forEach((d) => {
          results.push({
            id: d._id,
            title: `Pending Dues: ₹${d.balanceDue}`,
            category: "Fee",
            subtitle: `Total Fee: ₹${d.totalFee} • Status: ${d.status}`,
            url: "/fees/dues",
          });
        });
        const receipts = await FeeReceipt.find({
          student: ownStudentId,
          $or: [
            { receiptNumber: regex },
            { paymentMethod: regex },
            { feeType: regex },
            { remarks: regex },
            { className: regex },
            { rollNumber: regex },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(3);
        receipts.forEach((rc) => {
          results.push({
            id: rc._id,
            title: `Receipt #${rc.receiptNumber}`,
            category: "Fee",
            subtitle: `Paid ₹${rc.amount} via ${rc.paymentMethod}`,
            url: "/fees/receipts",
          });
        });
      }
    } else if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"].includes(role)) {
      const dues = await FeeDue.find({
        $or: [{ studentName: regex }, { className: regex }, { status: regex }],
      }).limit(3);
      dues.forEach((d) => {
        results.push({
          id: d._id,
          title: `Fee Due - ${d.studentName}`,
          category: "Fee",
          subtitle: `Class: ${d.className} • Balance: ₹${d.balanceDue}`,
          url: "/fees/dues",
        });
      });
      const receipts = await FeeReceipt.find({
        $or: [
          { receiptNumber: regex },
          { studentName: regex },
          { rollNumber: regex },
          { className: regex },
          { feeType: regex },
          { remarks: regex },
          { paymentMethod: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(4);
      receipts.forEach((rc) => {
        results.push({
          id: rc._id,
          title: `Receipt #${rc.receiptNumber} (${rc.studentName})`,
          category: "Fee",
          subtitle: `Amount: ₹${rc.amount} • ${rc.paymentMethod}`,
          url: "/fees/receipts",
        });
      });
    }

    // 9. EXAMS & RESULTS (Role-scoped)
    if (role === "STUDENT") {
      const ownStudentId = await getStudentIdForUser(req.user);
      if (ownStudentId) {
        const resultsFound = await ExamResult.find({
          student: ownStudentId,
        })
          .populate("exam", "title examType")
          .limit(10);
        resultsFound
          .filter(
            (resItem) =>
              regex.test(resItem.exam?.title || "") ||
              regex.test(resItem.overallGrade || "") ||
              regex.test(resItem.status || "")
          )
          .slice(0, 3)
          .forEach((resItem) => {
            results.push({
              id: resItem._id,
              title: `Exam Result: ${resItem.exam?.title || "Exam"}`,
              category: "Exam",
              subtitle: `Grade: ${resItem.overallGrade} • ${resItem.percentage}% (${resItem.status})`,
              url: "/examinations/result-dashboard",
            });
          });
      }
    } else if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD", "TEACHER"].includes(role)) {
      const examFilter = {
        $and: [
          {
            $or: [{ title: regex }, { className: regex }, { examType: regex }, { subject: regex }],
          },
          ...(role === "TEACHER"
            ? [{ $or: [{ status: { $ne: "Draft" } }, { createdBy: req.user._id }] }]
            : []),
        ],
      };
      const exams = await Exam.find(examFilter).limit(4);
      exams.forEach((ex) => {
        results.push({
          id: ex._id,
          title: ex.title,
          category: "Exam",
          subtitle: `${ex.examType || "Exam"} • Class: ${ex.className}`,
          url: "/examinations/management",
        });
      });
    }

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};
