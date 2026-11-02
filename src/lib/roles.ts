
import type { Role } from "@/types/permission";

export const DEFAULT_ROLES: {
  id: Role;
  name: string;
  description: string;
}[] = [
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Complete ERP system control",
  },
  {
    id: "ADMIN",
    name: "Admin",
    description: "Manage daily ERP operations",
  },
  {
    id: "PRINCIPAL",
    name: "Principal",
    description: "Manage institutional activities",
  },
  {
    id: "HOD",
    name: "HOD",
    description: "Manage department activities",
  },
  {
    id: "TEACHER",
    name: "Teacher",
    description: "Manage assigned classes and subjects",
  },
  {
    id: "ACCOUNTANT",
    name: "Accountant",
    description: "Manage fees and financial records",
  },
  {
    id: "STUDENT",
    name: "Student",
    description: "Access personal academic information",
  },
];

export const ERP_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard",
    features: ["overview"],
  },
  {
    id: "profile",
    name: "My Profile",
    features: ["viewProfile", "editProfile"],
  },
  {
    id: "students",
    name: "Student Management",
    features: [
      "studentDashboard",
      "allStudents",
      "createStudent",
      "editStudent",
      "studentPromotion",
      "studentDocuments",
    ],
  },
  {
    id: "teachers",
    name: "Teacher Management",
    features: [
      "teacherDashboard",
      "allTeachers",
      "createTeacher",
      "editTeacher",
      "assignSubjects",
      "leaveManagement",
      "teacherReports",
    ],
  },
  {
    id: "admission",
    name: "Admission",
    features: [
      "admissionDashboard",
      "applications",
      "newAdmission",
      "meritList",
    ],
  },
  {
    id: "attendance",
    name: "Attendance",
    features: [
      "attendanceDashboard",
      "viewAttendance",
      "markAttendance",
      "attendanceReports",
      "leaveManagement",
    ],
  },
  {
    id: "finance",
    name: "Fees & Finance",
    features: [
      "financeDashboard",
      "feesStructure",
      "pendingDues",
      "receipts",
      "financeReports",
    ],
  },
  {
    id: "communication",
    name: "Communication Center",
    features: [
      "announcements",
      "messages",
      "notifications",
      "eventsCalendar",
    ],
  },
  {
    id: "examinations",
    name: "Examination & Results",
    features: [
      "examinationDashboard",
      "examManagement",
      "resultProcessing",
      "resultDashboard",
      "reportCard",
      "examReports",
    ],
  },
  {
    id: "roleManagement",
    name: "Role & Permission Management",
    features: [
      "roles",
      "permissions",
      "userRoleAssignment",
      "accessLogs",
    ],
  },
] as const;
