import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["Student", "Teacher", "Staff"],
      default: "Student",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    studentName: {
      type: String,
      trim: true,
      default: "",
    },
    rollNumber: {
      type: String,
      trim: true,
      default: "",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      required: true,
    },
    className: {
      type: String,
      trim: true,
      default: "",
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    classKey: {
      type: String,
      default: "",
    },
    sectionKey: {
      type: String,
      default: "",
    },
    rollKey: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "HalfDay", "Excused", "On Leave"],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound indexes to avoid duplicate attendance for same student or manual roll/class/section on same day
attendanceRecordSchema.index(
  { student: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { student: { $type: "objectId" } },
  }
);
attendanceRecordSchema.index(
  { user: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $type: "objectId" } },
  }
);
attendanceRecordSchema.index(
  { date: 1, classKey: 1, sectionKey: 1, rollKey: 1 },
  {
    unique: true,
    partialFilterExpression: { rollKey: { $type: "string", $gt: "" } },
  }
);

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: false,
    },
    teacherId: {
      type: String,
      default: "",
    },
    applicantName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "",
    },
    leaveType: {
      type: String,
      enum: ["Casual", "Medical", "Academic", "Maternity", "Paternity", "Other"],
      default: "Casual",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Attendance = mongoose.model("Attendance", attendanceRecordSchema);
export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
