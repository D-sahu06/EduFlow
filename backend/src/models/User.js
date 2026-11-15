import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    firstName: {
      type: String,
      default: "",
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "ADMIN",
        "PRINCIPAL",
        "HOD",
        "TEACHER",
        "ACCOUNTANT",
        "STUDENT",
        "USER",
      ],
      default: "STUDENT",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
    dob: {
      type: Date,
    },
    birthDate: {
      type: Date,
    },
    maritalStatus: {
      type: String,
      default: "Unmarried",
    },
    emergencyContact: {
      type: String,
      default: "",
    },
    emergencyName: {
      type: String,
      default: "",
    },
    emergencyRelation: {
      type: String,
      default: "",
    },
    institution: {
      type: String,
      default: "EduFlow International Academy",
    },
    qualification: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "",
    },
    departmentId: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },

    // Role-specific relationship fields
    // Students
    studentId: {
      type: String,
      default: "",
    },
    class: {
      type: String,
      default: "",
    },
    className: {
      type: String,
      default: "",
    },
    section: {
      type: String,
      default: "",
    },
    rollNumber: {
      type: String,
      default: "",
    },
    parentName: {
      type: String,
      default: "",
    },
    parentPhone: {
      type: String,
      default: "",
    },
    parentEmail: {
      type: String,
      default: "",
    },

    // Teachers
    teacherId: {
      type: String,
      default: "",
    },
    employeeId: {
      type: String,
      default: "",
    },
    assignedClasses: {
      type: [String],
      default: [],
    },
    assignedSections: {
      type: [String],
      default: [],
    },
    subjects: {
      type: [String],
      default: [],
    },

    // Accountants
    financialPermissions: {
      type: [String],
      default: ["fees", "receipts", "dues", "reports"],
    },

    phone: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    resetOtpHash: {
      type: String,
      default: "",
      select: false,
    },
    resetOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform to remove password and sensitive reset fields in response
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetOtpHash;
  delete user.resetOtpExpiresAt;
  delete user.resetOtpAttempts;
  return user;
};

export default mongoose.model("User", userSchema);
