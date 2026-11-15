import mongoose from "mongoose";
import { FeeStructure, FeeReceipt, FeeDue } from "../models/Fee.js";
import Student from "../models/Student.js";
import {
  createNotificationsForUsers,
  dispatchNotificationSafe,
  resolveActiveUserIdsByRoles,
  resolveStudentUserId,
} from "../services/notification.service.js";

// Helper to resolve student ObjectId for authenticated student
async function getStudentIdForUser(user) {
  const email = String(user.email || "").trim().toLowerCase();
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const studentDoc = await Student.findOne({
    $or: [
      { user: user._id },
      ...(user.studentId ? [{ studentId: user.studentId }] : []),
      ...(email ? [{ email: new RegExp(`^${escapedEmail}$`, "i") }] : []),
    ],
  });
  return studentDoc ? studentDoc._id : null;
}

// @desc    Get fees summary statistics
// @route   GET /api/fees/stats
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL, ACCOUNTANT)
export const getFeeStats = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only authorized finance staff and administrators can access the institutional Finance Dashboard.",
      });
    }

    const receipts = await FeeReceipt.find({ status: "Paid" });
    const totalCollection = receipts.reduce((sum, item) => sum + item.amount, 0);

    const dues = await FeeDue.find({ status: { $in: ["Overdue", "Pending", "Partial"] } });
    const totalDues = dues.reduce((sum, item) => sum + item.balanceDue, 0);

    const receiptCount = receipts.length;
    const dueCount = dues.length;

    res.json({
      success: true,
      stats: {
        totalCollection,
        totalDues,
        receiptCount,
        dueCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fee structures
// @route   GET /api/fees/structures
// @access  Private
export const getFeeStructures = async (req, res, next) => {
  try {
    if (req.user.role === "TEACHER") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Faculty members do not have access to financial records.",
      });
    }

    const structures = await FeeStructure.find().sort({ className: 1 });
    res.json({
      success: true,
      count: structures.length,
      structures,
      feeStructures: structures,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create fee structure
// @route   POST /api/fees/structures
// @access  Private (SUPER_ADMIN, ADMIN, ACCOUNTANT)
export const createFeeStructure = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only accountants and administrators can configure fee structures.",
      });
    }

    const {
      className,
      department,
      tuitionFee,
      admissionFee,
      examinationFee,
      examFee,
      libraryFee,
      transportFee,
      activityFee,
      otherFee,
      academicYear,
      amount,
      totalAmount,
      status,
    } = req.body;

    const parsedTuition = Number(tuitionFee || 0);
    const parsedAdmission = Number(admissionFee || 0);
    const parsedExam = Number(examinationFee !== undefined ? examinationFee : (examFee || 0));
    const parsedTransport = Number(transportFee !== undefined ? transportFee : (libraryFee || 0));
    const parsedOther = Number(otherFee !== undefined ? otherFee : (activityFee || 0));

    const total =
      amount !== undefined && Number(amount) > 0
        ? Number(amount)
        : totalAmount !== undefined && Number(totalAmount) > 0
        ? Number(totalAmount)
        : parsedTuition + parsedAdmission + parsedExam + parsedTransport + parsedOther;

    const structure = await FeeStructure.create({
      className: String(className || "").trim(),
      department: String(department || "General").trim(),
      tuitionFee: parsedTuition,
      admissionFee: parsedAdmission,
      examinationFee: parsedExam,
      examFee: parsedExam,
      libraryFee: parsedTransport,
      transportFee: parsedTransport,
      activityFee: parsedOther,
      otherFee: parsedOther,
      totalAmount: total,
      academicYear: academicYear || "2026-2027",
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Fee structure configured successfully.",
      structure,
      feeStructure: structure,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update fee structure
// @route   PUT /api/fees/structures/:id
// @access  Private (SUPER_ADMIN, ADMIN, ACCOUNTANT)
export const updateFeeStructure = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only accountants and administrators can update fee structures.",
      });
    }

    const existing = await FeeStructure.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Fee structure not found" });
    }

    const {
      className,
      department,
      tuitionFee,
      admissionFee,
      examinationFee,
      examFee,
      libraryFee,
      transportFee,
      activityFee,
      otherFee,
      academicYear,
      amount,
      totalAmount,
      status,
    } = req.body;

    const parsedTuition = Number(tuitionFee !== undefined ? tuitionFee : existing.tuitionFee || 0);
    const parsedAdmission = Number(admissionFee !== undefined ? admissionFee : existing.admissionFee || 0);
    const parsedExam = Number(
      examinationFee !== undefined
        ? examinationFee
        : examFee !== undefined
        ? examFee
        : existing.examinationFee || existing.examFee || 0
    );
    const parsedTransport = Number(
      transportFee !== undefined
        ? transportFee
        : libraryFee !== undefined
        ? libraryFee
        : existing.transportFee || existing.libraryFee || 0
    );
    const parsedOther = Number(
      otherFee !== undefined
        ? otherFee
        : activityFee !== undefined
        ? activityFee
        : existing.otherFee || existing.activityFee || 0
    );

    const total =
      amount !== undefined && Number(amount) > 0
        ? Number(amount)
        : totalAmount !== undefined && Number(totalAmount) > 0
        ? Number(totalAmount)
        : parsedTuition + parsedAdmission + parsedExam + parsedTransport + parsedOther;

    const updateData = {
      ...(className !== undefined ? { className: String(className).trim() } : {}),
      ...(department !== undefined ? { department: String(department).trim() } : {}),
      tuitionFee: parsedTuition,
      admissionFee: parsedAdmission,
      examinationFee: parsedExam,
      examFee: parsedExam,
      libraryFee: parsedTransport,
      transportFee: parsedTransport,
      activityFee: parsedOther,
      otherFee: parsedOther,
      totalAmount: total,
      ...(academicYear !== undefined ? { academicYear } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const structure = await FeeStructure.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Fee structure updated successfully.",
      structure,
      feeStructure: structure,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete fee structure
// @route   DELETE /api/fees/structures/:id
// @access  Private (SUPER_ADMIN, ADMIN, ACCOUNTANT)
export const deleteFeeStructure = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only accountants and administrators can delete fee structures.",
      });
    }

    const structure = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!structure) {
      return res.status(404).json({ success: false, message: "Fee structure not found" });
    }

    res.json({
      success: true,
      message: "Fee structure deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending dues with strict student isolation
// @route   GET /api/fees/dues
// @access  Private
export const getFeeDues = async (req, res, next) => {
  try {
    if (req.user.role === "TEACHER") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Faculty members do not have access to financial dues.",
      });
    }

    const { className, status, search } = req.query;
    const filter = {};

    if (className) filter.className = className;
    if (status) filter.status = status;
    if (search) {
      filter.studentName = { $regex: search, $options: "i" };
    }

    // Student scope restriction: Student ONLY sees their own dues
    if (req.user.role === "STUDENT") {
      const studentId = await getStudentIdForUser(req.user);
      const studentMatch = [];
      if (studentId) {
        studentMatch.push({ student: studentId });
      }
      if (req.user._id) {
        studentMatch.push({ student: req.user._id });
      }
      if (req.user.studentId) {
        studentMatch.push({ rollNumber: req.user.studentId });
      }
      filter.$or = studentMatch;
    }

    const dues = await FeeDue.find(filter)
      .populate("student", "name rollNumber studentId className email")
      .sort({ dueDate: 1 });

    res.json({ success: true, count: dues.length, dues });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fee payment receipts with strict student isolation
// @route   GET /api/fees/receipts
// @access  Private
export const getFeeReceipts = async (req, res, next) => {
  try {
    if (req.user.role === "TEACHER") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Faculty members do not have access to financial receipts.",
      });
    }

    const { className, search, paymentMethod } = req.query;
    const filter = {};

    if (className) filter.className = className;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Student scope restriction: Student ONLY sees their own receipts
    if (req.user.role === "STUDENT") {
      const studentId = await getStudentIdForUser(req.user);
      const studentMatch = [];
      if (studentId) {
        studentMatch.push({ student: studentId });
      }
      if (req.user._id) {
        studentMatch.push({ student: req.user._id });
      }
      if (req.user.studentId) {
        studentMatch.push({ rollNumber: req.user.studentId });
      }
      filter.$or = studentMatch;
    }

    const receipts = await FeeReceipt.find(filter)
      .populate("student", "name studentId rollNumber className")
      .populate("collectedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: receipts.length, receipts });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new fee payment
// @route   POST /api/fees/pay
// @access  Private (SUPER_ADMIN, ADMIN, ACCOUNTANT)
export const recordPayment = async (req, res, next) => {
  try {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only authorized financial officers can record fee payments.",
      });
    }

    const {
      studentId,
      studentName,
      className,
      amount,
      paymentDate,
      feeType,
      remarks,
      paymentMethod,
      transactionId,
      pendingDues,
      dueDate,
    } = req.body;

    const trimmedStudentId = String(studentId || "").trim();
    const trimmedStudentName = String(studentName || "").trim();
    const trimmedClassName = String(className || "").trim();
    const parsedAmount = Number(amount);

    if (!trimmedStudentId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid studentId and amount greater than 0 are required.",
      });
    }

    const escapedStudentRef = trimmedStudentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactIdentifierRegex = new RegExp(`^${escapedStudentRef}$`, "i");

    // Resolve student record if studentId is an ObjectId or matches studentId/rollNumber/email
    let resolvedStudent = null;
    if (mongoose.Types.ObjectId.isValid(trimmedStudentId)) {
      resolvedStudent = await Student.findById(trimmedStudentId);
    }
    if (!resolvedStudent) {
      resolvedStudent = await Student.findOne({
        $or: [
          { studentId: exactIdentifierRegex },
          { rollNumber: exactIdentifierRegex },
          { email: exactIdentifierRegex },
        ],
      });
    }

    const actualStudentObjectId = resolvedStudent ? resolvedStudent._id : undefined;
    const actualStudentName = trimmedStudentName || resolvedStudent?.name || "Student";
    const actualClassName = trimmedClassName || resolvedStudent?.className || "General";
    const actualRollNumber =
      resolvedStudent?.rollNumber || resolvedStudent?.studentId || trimmedStudentId;

    const parsedDate = paymentDate ? new Date(paymentDate) : new Date();
    const validPaymentDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const cleanedFeeType = String(feeType || "").trim() || "Tuition Fee";
    const cleanedRemarks = String(remarks || feeType || "").trim();

    // Check fee structure for this class/course to determine total structure fee
    let structureTotal = 0;
    const strippedClassName = actualClassName.replace(/^Class\s+/i, "").trim();
    const escapedClass = strippedClassName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchedStructure = await FeeStructure.findOne({
      $or: [
        { className: new RegExp(`^${escapedClass}$`, "i") },
        { className: new RegExp(`^Class\\s+${escapedClass}$`, "i") },
        { className: actualClassName },
      ],
      status: "Active",
    });
    if (matchedStructure && matchedStructure.totalAmount > 0) {
      structureTotal = matchedStructure.totalAmount;
    }

    // Determine pending dues / balance due
    let resolvedBalanceDue = null;
    if (
      pendingDues !== undefined &&
      pendingDues !== null &&
      String(pendingDues).trim() !== "" &&
      !isNaN(Number(pendingDues))
    ) {
      resolvedBalanceDue = Math.max(0, Number(pendingDues));
    } else if (structureTotal > 0) {
      // Auto-compute from fee structure if not manually specified and amount < structure total
      resolvedBalanceDue = Math.max(0, structureTotal - parsedAmount);
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    const receipt = await FeeReceipt.create({
      receiptNumber,
      ...(actualStudentObjectId ? { student: actualStudentObjectId } : {}),
      rollNumber: actualRollNumber,
      studentName: actualStudentName,
      className: actualClassName,
      amount: parsedAmount,
      pendingDues: resolvedBalanceDue !== null ? resolvedBalanceDue : 0,
      paymentDate: validPaymentDate,
      feeType: cleanedFeeType,
      remarks: cleanedRemarks,
      paymentMethod: paymentMethod || "UPI",
      transactionId: transactionId || "",
      collectedBy: req.user._id,
      status: "Paid",
    });

    // Find or update/create FeeDue record
    const dueOrClauses = [];
    if (actualStudentObjectId) {
      dueOrClauses.push({ student: actualStudentObjectId });
    }
    if (actualRollNumber) {
      dueOrClauses.push({ rollNumber: actualRollNumber });
    }
    if (actualStudentName) {
      const escapedName = actualStudentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      dueOrClauses.push({
        studentName: new RegExp(`^${escapedName}$`, "i"),
        ...(actualClassName ? { className: actualClassName } : {}),
      });
    }

    let feeDue = dueOrClauses.length > 0 ? await FeeDue.findOne({ $or: dueOrClauses }) : null;

    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const validDueDate = Number.isNaN(parsedDueDate.getTime())
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : parsedDueDate;

    if (feeDue) {
      // Update existing fee due
      const newPaid = Number(feeDue.amountPaid || 0) + parsedAmount;
      feeDue.amountPaid = newPaid;

      if (resolvedBalanceDue !== null) {
        feeDue.balanceDue = resolvedBalanceDue;
        feeDue.totalFee = Math.max(feeDue.totalFee || 0, newPaid + resolvedBalanceDue, structureTotal);
      } else {
        feeDue.balanceDue = Math.max(0, (feeDue.totalFee || 0) - newPaid);
      }

      if (feeDue.balanceDue === 0) {
        feeDue.status = "Paid";
      } else if (new Date(feeDue.dueDate) < new Date()) {
        feeDue.status = "Overdue";
      } else {
        feeDue.status = "Partial";
      }

      if (actualStudentObjectId && !feeDue.student) {
        feeDue.student = actualStudentObjectId;
      }
      if (actualRollNumber && !feeDue.rollNumber) {
        feeDue.rollNumber = actualRollNumber;
      }
      if (actualClassName && !feeDue.className) {
        feeDue.className = actualClassName;
      }
      await feeDue.save();
    } else {
      // No existing FeeDue record
      // If student has pending dues (> 0), create a new FeeDue record in MongoDB so it shows on /fees/dues!
      const finalBalance = resolvedBalanceDue !== null ? resolvedBalanceDue : 0;
      if (finalBalance > 0) {
        const totalFeeAmount = structureTotal > 0
          ? Math.max(structureTotal, parsedAmount + finalBalance)
          : parsedAmount + finalBalance;

        const isOverdue = validDueDate < new Date();
        const dueStatus = isOverdue ? "Overdue" : "Partial";

        feeDue = await FeeDue.create({
          ...(actualStudentObjectId ? { student: actualStudentObjectId } : {}),
          rollNumber: actualRollNumber,
          studentName: actualStudentName,
          className: actualClassName,
          totalFee: totalFeeAmount,
          amountPaid: parsedAmount,
          balanceDue: finalBalance,
          dueDate: validDueDate,
          feeType: cleanedFeeType || "Tuition Fee",
          status: dueStatus,
        });
      }
    }

    await dispatchNotificationSafe(async () => {
      const [studentUserId, financeUserIds] = await Promise.all([
        resolveStudentUserId({
          studentDoc: resolvedStudent,
          studentId: actualStudentObjectId || trimmedStudentId,
          rollNumber: actualRollNumber,
          className: actualClassName,
        }),
        resolveActiveUserIdsByRoles(["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"]),
      ]);

      if (studentUserId) {
        await createNotificationsForUsers({
          recipientIds: [studentUserId],
          excludeUserId: req.user._id,
          title: `Fee Payment Receipt #${receiptNumber}`,
          message: `Your payment of ₹${parsedAmount.toLocaleString("en-IN")} via ${receipt.paymentMethod} has been recorded.`,
          category: "Fees and Payment Updates",
          priority: "Medium",
          link: "/fees/receipts",
          actorId: req.user._id,
          actorName: req.user.name,
          metadata: { receiptId: receipt._id, receiptNumber },
        });
      }

      await createNotificationsForUsers({
        recipientIds: financeUserIds,
        excludeUserId: req.user._id,
        title: `Fee Payment Recorded: ₹${parsedAmount.toLocaleString("en-IN")}`,
        message: `${actualStudentName} (${actualClassName}) paid ₹${parsedAmount.toLocaleString("en-IN")} (Receipt #${receiptNumber}).`,
        category: "Fees and Payment Updates",
        priority: "Medium",
        link: "/fees/receipts",
        actorId: req.user._id,
        actorName: req.user.name,
        metadata: { receiptId: receipt._id, receiptNumber },
      });
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${parsedAmount} recorded successfully. Receipt #${receiptNumber} generated.${
        feeDue && feeDue.balanceDue > 0
          ? ` Remaining pending fee of ₹${feeDue.balanceDue.toLocaleString("en-IN")} recorded in Pending Dues.`
          : ""
      }`,
      receipt,
      feeDue,
    });
  } catch (error) {
    next(error);
  }
};
