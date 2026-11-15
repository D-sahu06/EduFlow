
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

export const MOCK_USERS: MockUser[] = [];
