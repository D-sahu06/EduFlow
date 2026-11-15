import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

/**
 * Validates password strength and optional confirmation match.
 * Enforces minimum 8 chars with uppercase, lowercase, number, and special character.
 */
export function validatePasswordStrength(password, confirmPassword) {
  if (typeof password !== "string" || !password) {
    return "New password is required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return "New password and confirmation password do not match.";
  }
  return null;
}

async function getResetMailTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }

  try {
    const mod = await import("nodemailer");
    const nodemailer = mod.default || mod;
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  } catch {
    return null;
  }
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "eduflow_erp_super_secure_jwt_secret_key_2026_xyz",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both username/email and password.",
      });
    }

    const cleanInput = username.trim().toLowerCase();

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact the administrator.`,
      });
    }

    // Verify selected role matches the user's database role
    if (role && role !== "all") {
      const selected = role.toUpperCase();
      const actual = user.role ? user.role.toUpperCase() : "";
      const roleMatches =
        (selected === "ADMIN" && (actual === "ADMIN" || actual === "SUPER_ADMIN")) ||
        (selected === actual);

      if (!roleMatches) {
        return res.status(403).json({
          success: false,
          message: `This account is registered as '${user.role}', not '${role}'. Please select '${user.role}' in the 'Login as' dropdown to sign in.`,
        });
      }
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public or Admin
export const register = async (req, res, next) => {
  try {
    const { username, email, password, name, role, department, departmentId, className, section, studentId, teacherId, phone } =
      req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and name are required.",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email is already registered.",
      });
    }

    const user = await User.create({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      name,
      role: role ? role.toUpperCase() : "STUDENT",
      department: department || "",
      departmentId: departmentId || "",
      className: className ? String(className).trim() : "",
      section: section ? String(section).trim() : "",
      studentId: studentId || "",
      teacherId: teacherId || "",
      phone: phone || "",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me OR GET /api/users/profile
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userObj = user.toObject();

    if (user.role === "STUDENT") {
      const studentDoc = await Student.findOne({
        $or: [
          { user: user._id },
          { studentId: user.studentId || "NONE" },
          { email: user.email },
        ],
      });
      if (studentDoc) {
        userObj.studentDocId = studentDoc._id;
        userObj.studentId = studentDoc.studentId || userObj.studentId;
        userObj.className = studentDoc.className || userObj.className;
        userObj.section = studentDoc.section || userObj.section;
        userObj.rollNumber = studentDoc.rollNumber || userObj.rollNumber;
        userObj.parentName = studentDoc.guardianName || userObj.parentName;
        userObj.parentPhone = studentDoc.guardianPhone || userObj.parentPhone;
      }
    } else if (user.role === "TEACHER") {
      const teacherDoc = await Teacher.findOne({
        $or: [
          { user: user._id },
          { teacherId: user.teacherId || "NONE" },
          { email: user.email },
        ],
      });
      if (teacherDoc) {
        userObj.teacherDocId = teacherDoc._id;
        userObj.teacherId = teacherDoc.teacherId || userObj.teacherId;
        userObj.qualification = teacherDoc.qualification || userObj.qualification;
        userObj.assignedSubjects = teacherDoc.assignedSubjects || [];
        if (teacherDoc.assignedSubjects && teacherDoc.assignedSubjects.length > 0) {
          userObj.assignedClasses = Array.from(new Set(teacherDoc.assignedSubjects.map(s => s.className)));
        }
      }
    }

    res.json({
      success: true,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = getMe;

// @desc    Update current user profile
// @route   PUT /api/auth/profile OR PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      name,
      phone,
      bio,
      avatar,
      profileImage,
      gender,
      dob,
      birthDate,
      maritalStatus,
      emergencyContact,
      emergencyName,
      emergencyRelation,
      address,
      institution,
      qualification,
      parentName,
      parentPhone,
      parentEmail,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (name) {
      user.name = name.trim();
    } else if (firstName !== undefined || lastName !== undefined) {
      user.name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username;
    }

    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
      user.avatar = profileImage;
    }
    if (gender !== undefined) user.gender = gender;
    if (dob) {
      user.dob = new Date(dob);
      user.birthDate = new Date(dob);
    }
    if (birthDate) {
      user.birthDate = new Date(birthDate);
      user.dob = new Date(birthDate);
    }
    if (maritalStatus !== undefined) user.maritalStatus = maritalStatus;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (emergencyName !== undefined) user.emergencyName = emergencyName;
    if (emergencyRelation !== undefined) user.emergencyRelation = emergencyRelation;
    if (address !== undefined) user.address = address.trim();
    if (institution !== undefined) user.institution = institution.trim();
    if (qualification !== undefined) user.qualification = qualification.trim();
    if (parentName !== undefined) user.parentName = parentName.trim();
    if (parentPhone !== undefined) user.parentPhone = parentPhone.trim();
    if (parentEmail !== undefined) user.parentEmail = parentEmail.trim();

    await user.save();

    // Synchronize to Student / Teacher documents if applicable
    if (user.role === "STUDENT") {
      await Student.findOneAndUpdate(
        {
          $or: [
            { user: user._id },
            { studentId: user.studentId || "NONE" },
            { email: user.email },
          ],
        },
        {
          $set: {
            name: user.name,
            gender: user.gender || "Male",
            dob: user.dob,
            address: user.address,
            guardianName: user.parentName || undefined,
            guardianPhone: user.parentPhone || undefined,
          },
        }
      );
    } else if (user.role === "TEACHER") {
      await Teacher.findOneAndUpdate(
        {
          $or: [
            { user: user._id },
            { teacherId: user.teacherId || "NONE" },
            { email: user.email },
          ],
        },
        {
          $set: {
            name: user.name,
            phone: user.phone,
            qualification: user.qualification,
          },
        }
      );
    }

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password OR PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const strengthError = validatePasswordStrength(newPassword, confirmPassword);
    if (strengthError) {
      return res.status(400).json({
        success: false,
        message: strengthError,
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password.",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check whether email OTP recovery is configured on server
// @route   GET /api/auth/recovery-status
// @access  Public
export const getRecoveryStatus = async (_req, res) => {
  const transporter = await getResetMailTransport();
  res.json({
    success: true,
    emailRecoveryEnabled: Boolean(transporter),
  });
};

// @desc    Request password reset OTP via verified email delivery
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const rawIdentifier = req.body.identifier ?? req.body.email ?? req.body.username ?? "";
    const identifier = String(rawIdentifier).trim().toLowerCase();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Please provide your registered email address or username.",
      });
    }

    const transporter = await getResetMailTransport();
    if (!transporter) {
      return res.status(503).json({
        success: false,
        recoveryMode: "ADMIN_ASSISTED",
        message:
          "Automated email OTP recovery is not configured on this server. Please contact your Super Admin, Admin, or Principal to reset your password in User Management.",
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts");

    const genericSuccessMessage =
      "If an active account exists for that email or username, a 6-digit verification OTP has been sent to the registered email address.";

    if (!user || user.status !== "active" || !user.email) {
      return res.json({
        success: true,
        message: genericSuccessMessage,
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    user.resetOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: "EduFlow ERP - Password Reset Verification OTP",
        text: `Hello ${user.name || user.username},\n\nYour password reset verification OTP is: ${otp}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`,
      });
    } catch (mailError) {
      user.resetOtpHash = "";
      user.resetOtpExpiresAt = null;
      user.resetOtpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return next(mailError);
    }

    res.json({
      success: true,
      message: genericSuccessMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const rawIdentifier = req.body.identifier ?? req.body.email ?? req.body.username ?? "";
    const identifier = String(rawIdentifier).trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const { newPassword, confirmPassword } = req.body;

    if (!identifier || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please provide your registered email/username and a valid 6-digit OTP.",
      });
    }

    const strengthError = validatePasswordStrength(newPassword, confirmPassword);
    if (strengthError) {
      return res.status(400).json({
        success: false,
        message: strengthError,
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts");

    if (
      !user ||
      user.status !== "active" ||
      !user.resetOtpHash ||
      !user.resetOtpExpiresAt ||
      user.resetOtpExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset OTP. Please request a new OTP.",
      });
    }

    if ((user.resetOtpAttempts || 0) >= 5) {
      return res.status(429).json({
        success: false,
        message: "Maximum OTP verification attempts exceeded. Please request a new OTP.",
      });
    }

    const expectedBuf = Buffer.from(user.resetOtpHash, "hex");
    const providedBuf = Buffer.from(hashOtp(otp), "hex");
    const otpMatches =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!otpMatches) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        message: "Invalid password reset OTP.",
      });
    }

    user.password = newPassword;
    user.resetOtpHash = "";
    user.resetOtpExpiresAt = null;
    user.resetOtpAttempts = 0;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};
