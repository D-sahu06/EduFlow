import mongoose from "mongoose";

const documentHistorySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Verified"],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    reason: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  documentType: { type: String, default: "Identity Proof", trim: true },
  description: { type: String, default: "", trim: true },
  fileName: { type: String, default: "document.pdf" },
  fileSize: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  mimeType: { type: String, default: "" },
  uploadDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Verified"],
    default: "Pending",
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedByName: { type: String, default: "" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedByName: { type: String, default: "" },
  approvedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedByName: { type: String, default: "" },
  verifiedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectedByName: { type: String, default: "" },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, default: "", trim: true },
  history: [documentHistorySchema],
});

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    studentId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      default: "",
    },
    className: {
      type: String,
      required: true, // e.g. "Class 10", "B.Tech - CSE"
    },
    section: {
      type: String,
      default: "A",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    dob: {
      type: Date,
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    guardianName: {
      type: String,
      default: "",
    },
    guardianPhone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "promoted", "graduated", "suspended"],
      default: "active",
    },
    academicYear: {
      type: String,
      default: "2026-2027",
    },
    documents: [documentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Student", studentSchema);
