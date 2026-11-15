import mongoose from "mongoose";


const admissionSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      unique: true,
      required: true,
    },
    applicantName: {
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
      required: true,
    },
    applyingForClass: {
      type: String,
      required: true,
    },
    previousQualification: {
      type: String,
      default: "",
      trim: true,
    },
    previousSchool: {
      type: String,
      default: "",
    },
    previousPercentage: {
      type: Number,
      required: true,
    },
    guardianName: {
      type: String,
      required: true,
    },
    guardianPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Merit List", "Approved", "Rejected"],
      default: "Pending",
    },
    meritRank: {
      type: Number,
      default: null,
    },
    reviewedBy: {
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

export default mongoose.model("Admission", admissionSchema);
