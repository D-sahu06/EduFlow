import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import { Attendance } from "../models/Attendance.js";
import { FeeReceipt, FeeDue } from "../models/Fee.js";
import { ExamResult } from "../models/Exam.js";

// @desc    Dashboard overview statistics
// @route   GET /api/reports/overview
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, ACCOUNTANT)
export const getDashboardOverview = async (req, res, next) => {
  try {
    if (["TEACHER", "STUDENT"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Unauthorized to view institutional overview statistics.",
      });
    }

    if (req.user.role === "ACCOUNTANT") {
      const receipts = await FeeReceipt.find({ status: "Paid" });
      const totalRevenue = receipts.reduce((sum, item) => sum + item.amount, 0);

      const dues = await FeeDue.find();
      const totalDues = dues.reduce((sum, item) => sum + item.balanceDue, 0);

      return res.json({
        success: true,
        overview: {
          totalRevenue: `₹${(totalRevenue / 100000).toFixed(1)}L`,
          totalRevenueRaw: totalRevenue,
          pendingDues: `₹${(totalDues / 100000).toFixed(1)}L`,
          pendingDuesRaw: totalDues,
          receiptCount: receipts.length,
          dueCount: dues.length,
        },
      });
    }

    const studentCount = await Student.countDocuments({ status: "active" });
    const teacherCount = await Teacher.countDocuments({ status: "active" });
    const userCount = await User.countDocuments();

    const receipts = await FeeReceipt.find({ status: "Paid" });
    const totalRevenue = receipts.reduce((sum, item) => sum + item.amount, 0);

    const dues = await FeeDue.find();
    const totalDues = dues.reduce((sum, item) => sum + item.balanceDue, 0);

    const totalAttendance = await Attendance.countDocuments();
    const presentAttendance = await Attendance.countDocuments({ status: "Present" });
    const attendancePercentage = totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : 0;

    res.json({
      success: true,
      overview: {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalUsers: userCount,
        totalRevenue: `₹${(totalRevenue / 100000).toFixed(1)}L`,
        totalRevenueRaw: totalRevenue,
        pendingDues: `₹${(totalDues / 100000).toFixed(1)}L`,
        pendingDuesRaw: totalDues,
        averageAttendance: `${attendancePercentage}%`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Academic report
// @route   GET /api/reports/academic
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const getAcademicReport = async (req, res, next) => {
  try {
    if (["TEACHER", "STUDENT", "ACCOUNTANT"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Unauthorized to view institutional academic reports.",
      });
    }

    const results = await ExamResult.find();
    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    const topPerformers = await ExamResult.find({ status: "Pass" })
      .sort({ percentage: -1 })
      .limit(5)
      .populate("student", "name rollNumber className");

    res.json({
      success: true,
      academicReport: {
        totalEvaluated: total,
        passedStudents: passed,
        failedStudents: total - passed,
        passPercentage: `${passRate}%`,
        topPerformers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fee analytics report
// @route   GET /api/reports/fees
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, ACCOUNTANT)
export const getFinanceReport = async (req, res, next) => {
  try {
    if (["TEACHER", "STUDENT"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Unauthorized to view institutional financial reports.",
      });
    }

    const receipts = await FeeReceipt.find().sort({ createdAt: -1 });
    const dues = await FeeDue.find().sort({ balanceDue: -1 });

    const totalCollected = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalPending = dues.reduce((sum, d) => sum + d.balanceDue, 0);

    res.json({
      success: true,
      financeReport: {
        totalCollected,
        totalPending,
        totalInvoices: receipts.length + dues.length,
        recentCollections: receipts.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};
