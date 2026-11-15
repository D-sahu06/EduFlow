"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Role } from "@/types/permission";
import { hasFeatureAccess } from "@/lib/permissions";

type RoutePermission = {
  module: string;
  feature: string;
};

const PUBLIC_PATHS = ["/", "/login", "/forgot-password", "/unauthorized"];

const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  "/profile/add-user": { module: "roleManagement", feature: "userRoleAssignment" },
  "/profile/edit": { module: "profile", feature: "editProfile" },
  "/profile": { module: "profile", feature: "viewProfile" },

  "/admin/users/create": { module: "roleManagement", feature: "userRoleAssignment" },
  "/admin/users": { module: "roleManagement", feature: "roles" },

  "/admission/applications": { module: "admission", feature: "applications" },
  "/admission/new": { module: "admission", feature: "newAdmission" },
  "/admission/merit-list": { module: "admission", feature: "meritList" },
  "/admission": { module: "admission", feature: "admissionDashboard" },

  "/attendance/mark": { module: "attendance", feature: "markAttendance" },
  "/attendance/reports": { module: "attendance", feature: "attendanceReports" },
  "/attendance/leaves": { module: "attendance", feature: "leaveManagement" },
  "/attendance/view": { module: "attendance", feature: "viewAttendance" },
  "/attendance": { module: "attendance", feature: "attendanceDashboard" },

  "/fees/structure": { module: "finance", feature: "feesStructure" },
  "/fees/dues": { module: "finance", feature: "pendingDues" },
  "/fees/due": { module: "finance", feature: "pendingDues" },
  "/fees/receipts": { module: "finance", feature: "receipts" },
  "/fees/reports": { module: "finance", feature: "financeReports" },
  "/fees": { module: "finance", feature: "financeDashboard" },

  "/communication/announcements": { module: "communication", feature: "announcements" },
  "/communication/messages": { module: "communication", feature: "messages" },
  "/communication/notification": { module: "communication", feature: "notifications" },
  "/communication/notifications": { module: "communication", feature: "notifications" },
  "/notification": { module: "communication", feature: "notifications" },
  "/notifications": { module: "communication", feature: "notifications" },
  "/communication/events": { module: "communication", feature: "eventsCalendar" },
  "/communication/history": { module: "communication", feature: "announcements" },
  "/communication": { module: "communication", feature: "announcements" },

  "/students-management/promotion": { module: "students", feature: "studentPromotion" },
  "/students-management/documents": { module: "students", feature: "studentDocuments" },
  "/students-management/all": { module: "students", feature: "allStudents" },
  "/students-management": { module: "students", feature: "studentDashboard" },
  "/students/classes": { module: "students", feature: "classes" },
  "/students/all": { module: "students", feature: "allStudents" },

  "/teacher-management/assign-subjects": { module: "teachers", feature: "assignSubjects" },
  "/teacher-management/leave-management": { module: "teachers", feature: "leaveManagement" },
  "/teacher-management/reports": { module: "teachers", feature: "teacherReports" },
  "/teacher-management/all-teachers": { module: "teachers", feature: "allTeachers" },
  "/teacher-management": { module: "teachers", feature: "teacherDashboard" },

  "/examinations/management": { module: "examinations", feature: "examManagement" },
  "/examinations/result-processing": { module: "examinations", feature: "resultProcessing" },
  "/examinations/result-dashboard": { module: "examinations", feature: "resultDashboard" },
  "/examinations/report-card": { module: "examinations", feature: "reportCard" },
  "/examinations/reports": { module: "examinations", feature: "examReports" },
  "/examinations": { module: "examinations", feature: "examinationDashboard" },

  "/examination/management": { module: "examinations", feature: "examManagement" },
  "/examination/result-processing": { module: "examinations", feature: "resultProcessing" },
  "/examination/result-dashboard": { module: "examinations", feature: "resultDashboard" },
  "/examination/report-card": { module: "examinations", feature: "reportCard" },
  "/examination/reports": { module: "examinations", feature: "examReports" },
  "/examination": { module: "examinations", feature: "examinationDashboard" },

  "/reports/academic": { module: "reports", feature: "academic" },
  "/reports/admissions": { module: "reports", feature: "admissions" },
  "/reports/attendance": { module: "reports", feature: "attendance" },
  "/reports/fees": { module: "reports", feature: "fees" },
  "/reports": { module: "reports", feature: "overview" },

  "/role-management/roles": { module: "roleManagement", feature: "roles" },
  "/role-management/permissions": { module: "roleManagement", feature: "permissions" },
  "/role-management/assignments": { module: "roleManagement", feature: "userRoleAssignment" },
  "/role-management/logs": { module: "roleManagement", feature: "accessLogs" },
};

const VALID_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRINCIPAL",
  "HOD",
  "TEACHER",
  "ACCOUNTANT",
  "STUDENT",
  "USER",
];

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setChecking(true);
    setAuthorized(false);

    // Public routes allow unauthenticated visitors
    if (pathname === "/" || PUBLIC_PATHS.some((path) => pathname === path || (path !== "/" && pathname.startsWith(path + "/")))) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    // Check JWT authentication token
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("eduflow-token");

    if (!token) {
      router.replace("/login");
      return;
    }

    // Retrieve user and role
    let role: Role = "SUPER_ADMIN";
    try {
      const userStr = localStorage.getItem("eduflow-user");
      let rawRole = "";
      if (userStr) {
        const userObj = JSON.parse(userStr);
        rawRole = userObj.role || "";
      }
      if (!rawRole) {
        rawRole =
          localStorage.getItem("eduflow-role") ||
          localStorage.getItem("eduflow-demo-role") ||
          localStorage.getItem("role") ||
          "";
      }

      const normalized = String(rawRole).trim().toUpperCase() as Role;
      if (VALID_ROLES.includes(normalized)) {
        role = normalized;
      }
    } catch {
      // fallback
    }

    // Redirect root '/' to role-specific dashboard
    if (pathname === "/") {
      switch (role) {
        case "SUPER_ADMIN":
          router.replace("/dashboard/super-admin");
          return;
        case "ADMIN":
          router.replace("/admin");
          return;
        case "PRINCIPAL":
          router.replace("/dashboard/principal");
          return;
        case "TEACHER":
          router.replace("/dashboard/teacher");
          return;
        case "STUDENT":
          router.replace("/dashboard/student");
          return;
        case "ACCOUNTANT":
          router.replace("/dashboard/accountant");
          return;
        case "USER":
          router.replace("/examinations");
          return;
        default:
          router.replace("/admin");
          return;
      }
    }

    // Super Admin has unrestricted access to all modules and routes
    if (role === "SUPER_ADMIN") {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    // Strict dedicated Role Dashboards protection for non-Super Admin roles:
    if (pathname === "/dashboard/super-admin") {
      router.replace("/unauthorized");
      return;
    }
    if (pathname === "/admin") {
      if (role === "ADMIN") {
        setAuthorized(true);
        setChecking(false);
        return;
      }
      switch (role) {
        case "PRINCIPAL":
          router.replace("/dashboard/principal");
          return;
        case "TEACHER":
          router.replace("/dashboard/teacher");
          return;
        case "STUDENT":
          router.replace("/dashboard/student");
          return;
        case "ACCOUNTANT":
          router.replace("/dashboard/accountant");
          return;
        case "USER":
          router.replace("/examinations");
          return;
        default:
          router.replace("/unauthorized");
          return;
      }
    }
    if (pathname === "/dashboard/principal" && role !== "PRINCIPAL") {
      router.replace("/unauthorized");
      return;
    }
    if (pathname === "/dashboard/teacher" && role !== "TEACHER") {
      router.replace("/unauthorized");
      return;
    }
    if (pathname === "/dashboard/student" && role !== "STUDENT") {
      router.replace("/unauthorized");
      return;
    }
    if (pathname === "/dashboard/accountant" && role !== "ACCOUNTANT") {
      router.replace("/unauthorized");
      return;
    }

    // If accessing the role's own dashboard, permit
    if (
      (pathname === "/admin" && role === "ADMIN") ||
      (pathname === "/dashboard/principal" && role === "PRINCIPAL") ||
      (pathname === "/dashboard/teacher" && role === "TEACHER") ||
      (pathname === "/dashboard/student" && role === "STUDENT") ||
      (pathname === "/dashboard/accountant" && role === "ACCOUNTANT")
    ) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    // Check specific module feature permissions
    const matchingRoute = Object.keys(ROUTE_PERMISSIONS)
      .sort((a, b) => b.length - a.length)
      .find(
        (route) =>
          pathname === route || pathname.startsWith(route + "/")
      );

    if (!matchingRoute) {
      // Deny by default if route is not explicitly permitted
      router.replace("/unauthorized");
      return;
    }

    const { module, feature } = ROUTE_PERMISSIONS[matchingRoute];
    const allowed = hasFeatureAccess(role, module, feature, "view");

    if (!allowed) {
      router.replace("/unauthorized");
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [pathname, router]);

  if (checking || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-700">
            Verifying EduFlow permissions...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
