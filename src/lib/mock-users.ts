
import type { Role } from "@/types/permission";

export type MockUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: "active" | "inactive";
  departmentId?: string;
  studentId?: string;
  teacherId?: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "U001",
    username: "superadmin",
    name: "Super Admin",
    email: "superadmin@eduflow.com",
    password: "Super@123",
    role: "SUPER_ADMIN",
    status: "active",
  },
  {
    id: "U002",
    username: "admin",
    name: "Admin User",
    email: "admin@eduflow.com",
    password: "Admin@123",
    role: "ADMIN",
    status: "active",
  },
  {
    id: "U003",
    username: "principal",
    name: "Principal User",
    email: "principal@eduflow.com",
    password: "Principal@123",
    role: "PRINCIPAL",
    status: "active",
  },
  {
    id: "U004",
    username: "hod",
    name: "HOD User",
    email: "hod@eduflow.com",
    password: "Hod@123",
    role: "HOD",
    status: "active",
    departmentId: "DEPT001",
  },
  {
    id: "U005",
    username: "teacher",
    name: "Teacher User",
    email: "teacher@eduflow.com",
    password: "Teacher@123",
    role: "TEACHER",
    status: "active",
    teacherId: "TCH001",
  },
  {
    id: "U006",
    username: "accountant",
    name: "Accountant User",
    email: "accountant@eduflow.com",
    password: "Accountant@123",
    role: "ACCOUNTANT",
    status: "active",
  },
  {
    id: "U007",
    username: "student",
    name: "Student User",
    email: "student@eduflow.com",
    password: "Student@123",
    role: "STUDENT",
    status: "active",
    studentId: "STU001",
  },
];
