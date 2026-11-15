import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2026-2027",
      trim: true,
    },
    tuitionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    admissionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    examinationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    examFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    libraryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    transportFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    activityFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const feeReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
    },
    rollNumber: {
      type: String,
      default: "",
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    feeType: {
      type: String,
      default: "Tuition Fee",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Net Banking", "Card", "Cheque", "Bank Transfer"],
      default: "UPI",
    },
    transactionId: {
      type: String,
      default: "",
    },
    pendingDues: {
      type: Number,
      default: 0,
      min: 0,
    },
    academicYear: {
      type: String,
      default: "2026-2027",
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Paid",
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const feeDueSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
      sparse: true,
    },
    rollNumber: {
      type: String,
      default: "",
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    totalFee: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    feeType: {
      type: String,
      default: "Tuition Fee",
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2026-2027",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Overdue", "Pending", "Due Soon"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
export const FeeReceipt = mongoose.model("FeeReceipt", feeReceiptSchema);
export const FeeDue = mongoose.model("FeeDue", feeDueSchema);
