import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    examType: {
      type: String,
      required: true,
      trim: true,
      default: "Mid-Term",
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2026-2027",
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      default: "",
      trim: true,
    },
    endTime: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: String,
      default: "",
      trim: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: 1,
    },
    passingMarks: {
      type: Number,
      default: 33,
      min: 0,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    subjects: [
      {
        subjectName: { type: String, trim: true },
        maxMarks: { type: Number, default: 100 },
        passingMarks: { type: Number, default: 33 },
        date: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Results Published", "Draft"],
      default: "Scheduled",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdByName: {
      type: String,
      default: "",
    },
    createdByRole: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const examResultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    rollNumber: {
      type: String,
      default: "",
    },
    className: {
      type: String,
      required: true,
    },
    subjects: [
      {
        subjectName: { type: String, required: true },
        marksObtained: { type: Number, required: true },
        maxMarks: { type: Number, default: 100 },
        grade: { type: String, default: "A" },
      },
    ],
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    overallGrade: {
      type: String,
      default: "A",
    },
    status: {
      type: String,
      enum: ["Pass", "Fail", "Pending"],
      default: "Pass",
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

examResultSchema.index({ exam: 1, student: 1 }, { unique: true });

export const Exam = mongoose.model("Exam", examSchema);
export const ExamResult = mongoose.model("ExamResult", examResultSchema);
