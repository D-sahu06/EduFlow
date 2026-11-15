import mongoose from "mongoose";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Notification from "../models/Notification.js";
import { validatePasswordStrength } from "./auth.controller.js";
import {
  createNotificationsForUsers,
  dispatchNotificationSafe,
} from "../services/notification.service.js";

function getDisallowedTargetRoles(actorRole) {
  if (actorRole === "SUPER_ADMIN") return [];
  if (actorRole === "ADMIN") return ["SUPER_ADMIN"];
  if (actorRole === "PRINCIPAL") return ["SUPER_ADMIN", "ADMIN"];
  return ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD", "TEACHER", "ACCOUNTANT", "STUDENT", "USER"];
}

function getManageUserError(actorRole, targetRole, actionVerb = "manage") {
  const targetLabel = actionVerb === "delete" ? "user accounts" : "user passwords";
  if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(actorRole)) {
    return `Access denied: Role '${actorRole}' is not authorized to ${actionVerb} ${targetLabel}.`;
  }
  if (targetRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    return `Only Super Admin can ${actionVerb} a Super Admin account.`;
  }
  if (actorRole === "PRINCIPAL" && ["SUPER_ADMIN", "ADMIN"].includes(targetRole)) {
    return `Principals cannot ${actionVerb} Super Admin or Admin accounts.`;
  }
  return null;
}

// @desc    Get all users with search & filters
// @route   GET /api/users
// @access  Private (Role Management / User View)
export const getUsers = async (req, res, next) => {
  try {
    const { role, department, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    const disallowedRoles = getDisallowedTargetRoles(req.user.role);

    if (role && role !== "All Roles" && role !== "ALL") {
      const requestedRole = role.toUpperCase();
      if (disallowedRoles.includes(requestedRole)) {
        return res.json({
          success: true,
          count: 0,
          total: 0,
          page: Number(page),
          pages: 0,
          users: [],
        });
      }
      filter.role = requestedRole;
    } else if (disallowedRoles.length > 0) {
      filter.role = { $nin: disallowedRoles };
    }

    if (department && department !== "All Departments") {
      filter.department = department;
    }

    if (status && status !== "all") {
      filter.status = status.toLowerCase();
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Role-based data scoping
    if (req.userScope === "department" && req.user.department) {
      filter.department = req.user.department;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    const isPrivileged = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role);
    if (!isPrivileged && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view other user profiles.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user account
// @route   POST /api/users
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const createUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      password,
      role,
      gender,
      dob,
      address,
      department,
      designation,
      joiningDate,
      status,
    } = req.body;

    // Check required fields
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email are required.",
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const targetRole = role ? role.toUpperCase() : "STUDENT";

    // Permission check: Only SUPER_ADMIN can create a SUPER_ADMIN account
    if (targetRole === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can create another Super Admin account.",
      });
    }

    // Admin restrictions: Cannot create SUPER_ADMIN accounts
    if (req.user.role === "ADMIN" && targetRole === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrators cannot create Super Admin accounts.",
      });
    }

    // Principal restrictions: Cannot create SUPER_ADMIN or ADMIN accounts
    if (req.user.role === "PRINCIPAL" && ["SUPER_ADMIN", "ADMIN"].includes(targetRole)) {
      return res.status(403).json({
        success: false,
        message: "Principals cannot create Super Admin or Admin accounts.",
      });
    }

    const constructedName =
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      req.body.name ||
      cleanUsername;

    const resolvedDob = dob
      ? new Date(dob)
      : req.body.birthDate
      ? new Date(req.body.birthDate)
      : undefined;

    // Check uniqueness
    const existing = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existing) {
      const isSelf =
        req.user &&
        (existing._id.toString() === req.user._id.toString() ||
          existing.email.toLowerCase() === req.user.email.toLowerCase());

      const canManage =
        isSelf ||
        req.user.role === "SUPER_ADMIN" ||
        (req.user.role === "ADMIN" && existing.role !== "SUPER_ADMIN") ||
        (req.user.role === "PRINCIPAL" && !["SUPER_ADMIN", "ADMIN"].includes(existing.role));

      if (canManage) {
        if (firstName !== undefined) existing.firstName = firstName.trim();
        if (lastName !== undefined) existing.lastName = lastName.trim();
        existing.name = constructedName || existing.name;
        if (phone !== undefined) existing.phone = phone.trim();
        if (gender !== undefined) existing.gender = gender;
        if (dob !== undefined || req.body.birthDate !== undefined) {
          const rawDob = dob || req.body.birthDate;
          existing.dob = rawDob ? new Date(rawDob) : undefined;
          existing.birthDate = rawDob ? new Date(rawDob) : undefined;
        }
        if (req.body.maritalStatus !== undefined) existing.maritalStatus = String(req.body.maritalStatus).trim();
        if (req.body.emergencyContact !== undefined) existing.emergencyContact = String(req.body.emergencyContact).trim();
        if (req.body.emergencyName !== undefined) existing.emergencyName = String(req.body.emergencyName).trim();
        if (req.body.emergencyRelation !== undefined) existing.emergencyRelation = String(req.body.emergencyRelation).trim();
        if (address !== undefined) existing.address = String(address).trim();
        if (department !== undefined) existing.department = String(department).trim();
        if (req.body.className !== undefined) existing.className = String(req.body.className).trim();
        if (req.body.section !== undefined) existing.section = String(req.body.section).trim();
        if (designation !== undefined) existing.designation = String(designation).trim();
        if (status !== undefined) existing.status = String(status).toLowerCase();
        if (password && String(password).trim().length >= 6) {
          existing.password = password;
        }

        await existing.save();

        return res.status(200).json({
          success: true,
          message: isSelf
            ? "Your profile details have been successfully updated!"
            : `Account details updated successfully for ${existing.name}!`,
          user: existing,
          isUpdated: true,
        });
      }

      const matchField = existing.username === cleanUsername ? "username" : "email";
      return res.status(409).json({
        success: false,
        message: `A user with this ${matchField} already exists.`,
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for new accounts.",
      });
    }

    const newUser = await User.create({
      firstName: firstName ? firstName.trim() : "",
      lastName: lastName ? lastName.trim() : "",
      name: constructedName,
      username: cleanUsername,
      email: cleanEmail,
      phone: phone ? phone.trim() : "",
      password,
      role: targetRole,
      gender: gender || "",
      dob: resolvedDob,
      birthDate: resolvedDob,
      maritalStatus: req.body.maritalStatus ? String(req.body.maritalStatus).trim() : "Unmarried",
      emergencyContact: req.body.emergencyContact ? String(req.body.emergencyContact).trim() : "",
      emergencyName: req.body.emergencyName ? String(req.body.emergencyName).trim() : "",
      emergencyRelation: req.body.emergencyRelation ? String(req.body.emergencyRelation).trim() : "",
      address: address ? address.trim() : "",
      department: department ? department.trim() : "General",
      className: req.body.className ? String(req.body.className).trim() : "",
      section: req.body.section ? String(req.body.section).trim() : "",
      designation: designation ? designation.trim() : "",
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: status ? status.toLowerCase() : "active",
      institution: req.body.institution || "EduFlow International Academy",
      qualification: req.body.qualification ? String(req.body.qualification).trim() : "",
    });

    if (targetRole === "STUDENT") {
      const existingStudent = await Student.findOne({
        $or: [{ user: newUser._id }, { email: cleanEmail }],
      });

      if (!existingStudent) {
        const generatedStudentId =
          req.body.studentId ||
          `STU${String(newUser._id).slice(-5).toUpperCase()}`;
        const studentClassName =
          (req.body.className && String(req.body.className).trim()) ||
          newUser.department ||
          "General";
        const studentSection =
          (req.body.section && String(req.body.section).trim()) || "A";

        await Student.create({
          user: newUser._id,
          studentId: generatedStudentId,
          name: newUser.name,
          email: cleanEmail,
          rollNumber: req.body.rollNumber || generatedStudentId,
          className: studentClassName,
          section: studentSection,
          gender: newUser.gender || undefined,
          dob: newUser.dob || undefined,
          address: newUser.address || "",
          status: "active",
        });

        newUser.studentId = generatedStudentId;
        newUser.className = studentClassName;
        newUser.section = studentSection;
        await newUser.save();
      }
    }

    res.status(201).json({
      success: true,
      message: `User account for "${newUser.name}" (${newUser.role}) created successfully.`,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (SUPER_ADMIN, ADMIN)
export const updateUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      name,
      email,
      phone,
      role,
      gender,
      dob,
      address,
      department,
      designation,
      joiningDate,
      status,
      password,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Restriction: Cannot modify SUPER_ADMIN unless caller is SUPER_ADMIN
    if (user.role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can modify a Super Admin account.",
      });
    }

    // Restriction: Non-SUPER_ADMIN cannot escalate role to SUPER_ADMIN
    if (
      role &&
      role.toUpperCase() === "SUPER_ADMIN" &&
      req.user.role !== "SUPER_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can assign the Super Admin role.",
      });
    }

    // Restriction: Admin cannot change their own role
    if (
      user._id.toString() === req.user._id.toString() &&
      role &&
      role.toUpperCase() !== user.role
    ) {
      if (req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({
          success: false,
          message: "You cannot change your own role.",
        });
      }
    }

    // If email is changing, check uniqueness
    if (email && email.trim().toLowerCase() !== user.email) {
      const emailTaken = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: "Email is already taken by another account.",
        });
      }
      user.email = email.trim().toLowerCase();
    }

    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (name) {
      user.name = name.trim();
    } else if (firstName !== undefined || lastName !== undefined) {
      user.name =
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.username;
    }

    if (phone !== undefined) user.phone = phone.trim();
    if (role) user.role = role.toUpperCase();
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined || req.body.birthDate !== undefined) {
      const rawDob = dob || req.body.birthDate;
      user.dob = rawDob ? new Date(rawDob) : undefined;
      user.birthDate = rawDob ? new Date(rawDob) : undefined;
    }
    if (req.body.maritalStatus !== undefined) user.maritalStatus = String(req.body.maritalStatus).trim();
    if (req.body.emergencyContact !== undefined) user.emergencyContact = String(req.body.emergencyContact).trim();
    if (req.body.emergencyName !== undefined) user.emergencyName = String(req.body.emergencyName).trim();
    if (req.body.emergencyRelation !== undefined) user.emergencyRelation = String(req.body.emergencyRelation).trim();
    if (address !== undefined) user.address = address.trim();
    if (department !== undefined) user.department = department.trim();
    if (req.body.className !== undefined) user.className = String(req.body.className).trim();
    if (req.body.section !== undefined) user.section = String(req.body.section).trim();
    if (designation !== undefined) user.designation = designation.trim();
    if (joiningDate) user.joiningDate = new Date(joiningDate);
    if (status !== undefined) user.status = status.toLowerCase();
    if (password !== undefined && String(password).trim() !== "") {
      const strengthError = validatePasswordStrength(String(password));
      if (strengthError) {
        return res.status(400).json({
          success: false,
          message: strengthError,
        });
      }
      user.password = String(password);
    }

    await user.save();

    if (user.role === "STUDENT") {
      const studentSync = {};
      if (name || firstName !== undefined || lastName !== undefined) studentSync.name = user.name;
      if (req.body.className !== undefined) studentSync.className = user.className;
      if (req.body.section !== undefined) studentSync.section = user.section;
      if (email) studentSync.email = user.email;
      if (Object.keys(studentSync).length > 0) {
        await Student.findOneAndUpdate(
          { $or: [{ user: user._id }, { email: user.email }] },
          { $set: studentSync }
        ).catch(() => {});
      }
    }

    res.json({
      success: true,
      message: "User updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset a user's password (Super Admin / Admin / Principal with hierarchy enforcement)
// @route   PUT /api/users/:id/reset-password
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const resetUserPassword = async (req, res, next) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Super Admin, Admin, and Principal can reset user passwords.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const { newPassword, confirmPassword } = req.body;
    const strengthError = validatePasswordStrength(newPassword, confirmPassword);
    if (strengthError) {
      return res.status(400).json({
        success: false,
        message: strengthError,
      });
    }

    const targetUser = await User.findById(req.params.id).select(
      "+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts"
    );
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const hierarchyError = getManageUserError(
      req.user.role,
      targetUser.role,
      "reset the password for"
    );
    if (hierarchyError) {
      return res.status(403).json({
        success: false,
        message: hierarchyError,
      });
    }

    targetUser.password = newPassword;
    targetUser.resetOtpHash = "";
    targetUser.resetOtpExpiresAt = null;
    targetUser.resetOtpAttempts = 0;
    await targetUser.save();

    await dispatchNotificationSafe(async () => {
      await createNotificationsForUsers({
        recipientIds: [targetUser._id],
        excludeUserId: req.user._id,
        title: "Account Password Updated",
        message: `Your account password was reset by ${req.user.name} (${req.user.role}). Please sign in with your updated password.`,
        category: "General System Notifications",
        priority: "High",
        link: "/profile",
        actorId: req.user._id,
        actorName: req.user.name,
      });
    });

    res.json({
      success: true,
      message: `Password for ${targetUser.name} (${targetUser.role}) has been reset successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SUPER_ADMIN, ADMIN, PRINCIPAL)
export const deleteUser = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Cannot delete own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const accessError = getManageUserError(req.user.role, user.role, "delete");
    if (accessError) {
      return res.status(403).json({
        success: false,
        message: accessError,
      });
    }

    // Remove the User document permanently so neither password login nor existing JWTs work again,
    // and clean up notifications and linked user references on student/teacher records.
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Notification.deleteMany({ recipient: user._id }),
      Student.updateMany({ user: user._id }, { $unset: { user: "" } }),
      Teacher.updateMany({ user: user._id }, { $unset: { user: "" } }),
    ]);

    res.json({
      success: true,
      message: `User ${user.name} (@${user.username}) deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
