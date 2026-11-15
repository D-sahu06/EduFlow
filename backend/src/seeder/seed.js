import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import { Attendance, LeaveRequest } from "../models/Attendance.js";
import { FeeStructure, FeeReceipt, FeeDue } from "../models/Fee.js";
import { Exam, ExamResult } from "../models/Exam.js";
import Admission from "../models/Admission.js";
import { Announcement, Message } from "../models/Communication.js";

const seedData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduflow_erp"
    );
    console.log("Connected to MongoDB for seeding...");

    // Clear existing collections
    await User.deleteMany();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Attendance.deleteMany();
    await LeaveRequest.deleteMany();
    await FeeStructure.deleteMany();
    await FeeReceipt.deleteMany();
    await FeeDue.deleteMany();
    await Exam.deleteMany();
    await ExamResult.deleteMany();
    await Admission.deleteMany();
    await Announcement.deleteMany();
    await Message.deleteMany();

    console.log("Cleared existing ERP collections.");

    // 1. Seed Users (MOCK_USERS matching frontend)
    const users = [
      {
        username: "admin",
        name: "Super Administrator",
        email: "admin@eduflow.com",
        password: "Admin@12345",
        role: "SUPER_ADMIN",
        status: "active",
      },
      {
        username: "school_admin",
        name: "Campus Administrator",
        email: "school.admin@eduflow.com",
        password: "Admin@123",
        role: "ADMIN",
        status: "active",
      },
      {
        username: "principal",
        name: "Principal User",
        email: "principal@eduflow.com",
        password: "Principal@123",
        role: "PRINCIPAL",
        status: "active",
      },
      {
        username: "hod",
        name: "Dr. Arvind Rao",
        email: "hod@eduflow.com",
        password: "Hod@123",
        role: "HOD",
        department: "Computer Science",
        departmentId: "DEPT001",
        status: "active",
      },
      {
        username: "teacher",
        name: "Prof. Sunita Sharma",
        email: "teacher@eduflow.com",
        password: "Teacher@123",
        role: "TEACHER",
        department: "Computer Science",
        teacherId: "TCH001",
        status: "active",
      },
      {
        username: "accountant",
        name: "Ramesh Gupta",
        email: "accountant@eduflow.com",
        password: "Accountant@123",
        role: "ACCOUNTANT",
        department: "Finance",
        status: "active",
      },
      {
        username: "student",
        name: "Aarav Sharma",
        email: "student@eduflow.com",
        password: "Student@123",
        role: "STUDENT",
        studentId: "STU001",
        status: "active",
      },
    ];

    const createdUsers = [];
    for (const u of users) {
      const user = await User.create(u);
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users.`);

    const studentUser = createdUsers.find((u) => u.username === "student");
    const teacherUser = createdUsers.find((u) => u.username === "teacher");
    const adminUser = createdUsers.find((u) => u.username === "admin");

    // 2. Seed Students
    const studentsData = [
      {
        user: studentUser._id,
        studentId: "STU001",
        name: "Aarav Sharma",
        email: "student@eduflow.com",
        rollNumber: "CS-101",
        className: "Class 10",
        section: "A",
        gender: "Male",
        guardianName: "Rajesh Sharma",
        guardianPhone: "+91 98765 43210",
        address: "24, Shanti Nagar, New Delhi",
        status: "active",
      },
      {
        studentId: "STU002",
        name: "Priya Verma",
        email: "priya@example.com",
        rollNumber: "CS-102",
        className: "Class 10",
        section: "A",
        gender: "Female",
        guardianName: "Mahesh Verma",
        guardianPhone: "+91 98765 43211",
        address: "56, Model Town, Delhi",
        status: "active",
      },
      {
        studentId: "STU003",
        name: "Rahul Patel",
        email: "rahul@example.com",
        rollNumber: "CS-103",
        className: "Class 10",
        section: "B",
        gender: "Male",
        guardianName: "Vikram Patel",
        guardianPhone: "+91 98765 43212",
        address: "12, Civil Lines, Jaipur",
        status: "active",
      },
      {
        studentId: "STU004",
        name: "Ananya Iyer",
        email: "ananya@example.com",
        rollNumber: "CS-104",
        className: "Class 11",
        section: "A",
        gender: "Female",
        guardianName: "Karthik Iyer",
        guardianPhone: "+91 98765 43213",
        address: "88, Indira Nagar, Bengaluru",
        status: "active",
      },
    ];

    const createdStudents = await Student.insertMany(studentsData);
    console.log(`Created ${createdStudents.length} students.`);

    // 3. Seed Teachers
    const teachersData = [
      {
        user: teacherUser._id,
        teacherId: "TCH001",
        name: "Prof. Sunita Sharma",
        email: "teacher@eduflow.com",
        phone: "+91 98111 22334",
        department: "Computer Science",
        designation: "Associate Professor",
        qualification: "Ph.D in Computer Science",
        assignedSubjects: [
          { subjectName: "Data Structures", className: "Class 10", section: "A" },
          { subjectName: "Database Systems", className: "Class 11", section: "A" },
        ],
        status: "active",
      },
      {
        teacherId: "TCH002",
        name: "Dr. Vikram Seth",
        email: "vikram.seth@eduflow.com",
        phone: "+91 98222 33445",
        department: "Mathematics",
        designation: "Professor",
        qualification: "Ph.D in Applied Mathematics",
        assignedSubjects: [
          { subjectName: "Calculus", className: "Class 10", section: "A" },
        ],
        status: "active",
      },
    ];

    await Teacher.insertMany(teachersData);
    console.log("Created teachers.");

    // 4. Seed Fee Structures & Dues
    await FeeStructure.create({
      className: "Class 10",
      academicYear: "2026-2027",
      tuitionFee: 35000,
      examinationFee: 5000,
      libraryFee: 2000,
      activityFee: 3000,
      totalAmount: 45000,
    });

    // 5. Seed Announcements
    await Announcement.create([
      {
        title: "Mid-Term Examination Schedule Announced",
        category: "Academic",
        audience: "Students",
        priority: "High",
        content:
          "The mid-term examination timetable for all departments has been published. Please check your examination dashboard.",
        authorName: "Admin User",
        author: adminUser._id,
      },
      {
        title: "Annual Sports Meet Registration Open",
        category: "Event",
        audience: "All",
        priority: "Medium",
        content:
          "Registrations are now open for all track and field events. Contact your sports instructors by Friday.",
        authorName: "Sports Department",
        author: adminUser._id,
      },
    ]);

    // 6. Seed Exam & Result
    const exam = await Exam.create({
      title: "Mid-Term Examinations 2026",
      examType: "Mid-Term",
      className: "Class 10",
      academicYear: "2026-2027",
      startDate: new Date("2026-11-15"),
      endDate: new Date("2026-11-25"),
      status: "Scheduled",
    });

    await ExamResult.create({
      exam: exam._id,
      student: createdStudents[0]._id,
      studentName: createdStudents[0].name,
      rollNumber: createdStudents[0].rollNumber,
      className: createdStudents[0].className,
      subjects: [
        { subjectName: "Mathematics", marksObtained: 88, maxMarks: 100, grade: "A" },
        { subjectName: "Computer Science", marksObtained: 94, maxMarks: 100, grade: "A+" },
        { subjectName: "Physics", marksObtained: 82, maxMarks: 100, grade: "A" },
      ],
      totalMarks: 264,
      percentage: 88,
      overallGrade: "A",
      status: "Pass",
      publishedBy: adminUser._id,
    });

    console.log("Database seeded successfully with complete ERP sample data!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();
