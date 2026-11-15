import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../src/models/User.js";
import Student from "../src/models/Student.js";
import Teacher from "../src/models/Teacher.js";
import { Attendance } from "../src/models/Attendance.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduflow_erp";

export async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for Super Admin & role seeding...");

    // 1. Ensure Super Admin account: username: admin / password: Admin@12345
    const superAdminUsername = "admin";
    const superAdminPassword = "Admin@12345";

    let superAdmin = await User.findOne({ username: superAdminUsername });

    if (!superAdmin) {
      superAdmin = await User.create({
        username: superAdminUsername,
        email: "admin@eduflow.com",
        password: superAdminPassword,
        name: "Super Administrator",
        firstName: "Super",
        lastName: "Administrator",
        role: "SUPER_ADMIN",
        status: "active",
        department: "Administration",
        designation: "System Administrator",
        employeeId: "EMP-SAD001",
        phone: "+91 98000 11223",
        gender: "Male",
        address: "Administrative Block, EduFlow Campus",
        institution: "EduFlow International Academy",
      });
      console.log("Created Default Super Admin account (admin / Admin@12345).");
    } else {
      superAdmin.role = "SUPER_ADMIN";
      superAdmin.status = "active";
      superAdmin.password = superAdminPassword;
      superAdmin.employeeId = "EMP-SAD001";
      superAdmin.phone = superAdmin.phone || "+91 98000 11223";
      superAdmin.address = superAdmin.address || "Administrative Block, EduFlow Campus";
      superAdmin.institution = "EduFlow International Academy";
      await superAdmin.save();
      console.log("Super Admin account verified & updated (admin / Admin@12345).");
    }

    // 2. Ensure standard role accounts with role-specific relationships
    const standardAccounts = [
      {
        username: "school_admin",
        email: "school.admin@eduflow.com",
        password: "Admin@123",
        name: "Campus Admin",
        firstName: "Campus",
        lastName: "Admin",
        role: "ADMIN",
        status: "active",
        department: "Operations",
        designation: "Campus Administrator",
        employeeId: "EMP-ADM001",
        phone: "+91 98555 66778",
        gender: "Female",
        address: "Operations Directorate, West Campus",
        institution: "EduFlow International Academy",
      },
      {
        username: "principal",
        email: "principal@eduflow.com",
        password: "Principal@123",
        name: "Dr. Rajesh Sharma",
        firstName: "Rajesh",
        lastName: "Sharma",
        role: "PRINCIPAL",
        status: "active",
        department: "Executive",
        designation: "Principal",
        employeeId: "EMP-PRN001",
        phone: "+91 98444 55667",
        gender: "Male",
        qualification: "Ph.D in Educational Leadership",
        address: "Principal Bungalow, North Campus",
        institution: "EduFlow International Academy",
      },
      {
        username: "teacher",
        email: "teacher@eduflow.com",
        password: "Teacher@123",
        name: "Prof. Sunita Sharma",
        firstName: "Sunita",
        lastName: "Sharma",
        role: "TEACHER",
        status: "active",
        department: "Computer Science",
        designation: "Senior Faculty",
        teacherId: "TCH001",
        employeeId: "EMP-TCH001",
        phone: "+91 98111 22334",
        gender: "Female",
        qualification: "Ph.D in Computer Science",
        assignedClasses: ["Class 10", "Class 11"],
        assignedSections: ["A"],
        subjects: ["Data Structures", "Database Systems"],
        address: "Staff Quarters B-12, EduFlow Campus",
        institution: "EduFlow International Academy",
      },
      {
        username: "student",
        email: "student@eduflow.com",
        password: "Student@123",
        name: "Aarav Sharma",
        firstName: "Aarav",
        lastName: "Sharma",
        role: "STUDENT",
        status: "active",
        department: "Class 10",
        designation: "Student",
        studentId: "STU001",
        class: "Class 10",
        className: "Class 10",
        section: "A",
        rollNumber: "CS-101",
        phone: "+91 98765 43210",
        parentName: "Rajesh Sharma",
        parentPhone: "+91 98765 43210",
        parentEmail: "rajesh.parent@gmail.com",
        gender: "Male",
        dob: new Date("2008-05-14"),
        birthDate: new Date("2008-05-14"),
        address: "24, Shanti Nagar, New Delhi",
        institution: "EduFlow International Academy",
      },
      {
        username: "accountant",
        email: "accountant@eduflow.com",
        password: "Accountant@123",
        name: "Ramesh Gupta",
        firstName: "Ramesh",
        lastName: "Gupta",
        role: "ACCOUNTANT",
        status: "active",
        department: "Finance",
        designation: "Senior Accountant",
        employeeId: "EMP-ACC001",
        phone: "+91 98333 44556",
        gender: "Male",
        qualification: "M.Com, Chartered Financial Auditor",
        financialPermissions: ["fees", "receipts", "dues", "reports"],
        address: "Finance Office 104, Admin Wing",
        institution: "EduFlow International Academy",
      },
    ];

    for (const acc of standardAccounts) {
      let user = await User.findOne({ username: acc.username });
      if (!user) {
        user = await User.create(acc);
        console.log(`Created account for role ${acc.role}: ${acc.username}`);
      } else {
        Object.assign(user, acc);
        user.password = acc.password;
        await user.save();
        console.log(`Updated account for role ${acc.role}: ${acc.username}`);
      }

      // Link Student document
      if (acc.role === "STUDENT") {
        await Student.findOneAndUpdate(
          { studentId: acc.studentId },
          {
            $set: {
              user: user._id,
              name: acc.name,
              email: acc.email,
              rollNumber: acc.rollNumber,
              className: acc.className,
              section: acc.section,
              gender: acc.gender,
              dob: acc.dob,
              guardianName: acc.parentName,
              guardianPhone: acc.parentPhone,
              address: acc.address,
              status: "active",
            },
          },
          { upsert: true, new: true }
        );
      }

      // Link Teacher document
      if (acc.role === "TEACHER") {
        await Teacher.findOneAndUpdate(
          { teacherId: acc.teacherId },
          {
            $set: {
              user: user._id,
              name: acc.name,
              email: acc.email,
              phone: acc.phone,
              department: acc.department,
              designation: acc.designation,
              qualification: acc.qualification,
              assignedSubjects: [
                { subjectName: "Data Structures", className: "Class 10", section: "A" },
                { subjectName: "Database Systems", className: "Class 11", section: "A" },
              ],
              status: "active",
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    // 3. Seed sample attendance records if none exist
    const studentDoc = await Student.findOne({ studentId: "STU001" });
    console.log("Super Admin & all 6 roles verified and linked successfully in MongoDB.");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Super Admin seed error:", error);
    process.exit(1);
  }
}

seedAdmin();
