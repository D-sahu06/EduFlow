import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teacherId: {
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
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      required: true, // e.g. "Computer Science", "Mathematics"
    },
    designation: {
      type: String,
      default: "Assistant Professor",
    },
    qualification: {
      type: String,
      default: "",
    },
    assignedSubjects: [
      {
        subjectName: { type: String, required: true },
        className: { type: String, required: true },
        section: { type: String, default: "A" },
      },
    ],
    academicYear: {
      type: String,
      default: "2026-27",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "on_leave", "inactive"],
      default: "active",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Teacher", teacherSchema);
