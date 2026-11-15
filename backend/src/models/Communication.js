import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Academic", "Teacher", "Event", "Holiday"],
      default: "Academic",
    },
    audience: {
      type: String,
      enum: ["All", "Students", "Teachers", "Accountant"],
      default: "All",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    content: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      default: "Admin User",
    },
    examDate:{
      type: String,
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      default: "",
    },
    recipient: {
      type: String,
      required: true, // Recipient Name or Audience Label
    },
    recipientEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["INDIVIDUAL", "ALL", "STUDENT", "TEACHER", "ACCOUNTANT", "HOD"],
      default: "INDIVIDUAL",
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Sent", "Draft", "Delivered", "Read"],
      default: "Sent",
    },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
export const Message = mongoose.model("Message", messageSchema);
