
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Role } from "@/types/permission";
import { hasFeatureAccess } from "@/lib/permissions";

type RoutePermission = {
  module: string;
  feature: string;
};

const PUBLIC_PATHS = ["/login"];

const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  "/admin": { module: "dashboard", feature: "overview" },
  "/profile": { module: "profile", feature: "viewProfile" },

  "/admission": { module: "admission", feature: "admissionDashboard" },
  "/admission/applications": { module: "admission", feature: "applications" },
  "/admission/new": { module: "admission", feature: "newAdmission" },
  "/admission/merit-list": { module: "admission", feature: "meritList" },

  "/attendance": { module: "attendance", feature: "attendanceDashboard" },
  "/attendance/view": { module: "attendance", feature: "viewAttendance" },
  "/attendance/mark": { module: "attendance", feature: "markAttendance" },
  "/attendance/reports": { module: "attendance", feature: "attendanceReports" },
  "/attendance/leaves": { module: "attendance", feature: "leaveManagement" },

  "/fees": { module: "finance", feature: "financeDashboard" },
  "/fees/structure": { module: "finance", feature: "feesStructure" },
  "/fees/dues": { module: "finance", feature: "pendingDues" },
  "/fees/receipts": { module: "finance", feature: "receipts" },
  "/fees/reports": { module: "finance", feature: "financeReports" },

  "/communication": { module: "communication", feature: "announcements" },
  "/communication/messages": { module: "communication", feature: "messages" },
  "/communication/notifications": { module: "communication", feature: "notifications" },
  "/communication/events": { module: "communication", feature: "eventsCalendar" },
  "/communication/history": { module: "communication", feature: "announcements" },

  "/students-management": { module: "students", feature: "studentDashboard" },
  "/students-management/all": { module: "students", feature: "allStudents" },
  "/students-management/promotion": { module: "students", feature: "studentPromotion" },
  "/students-management/documents": { module: "students", feature: "studentDocuments" },
  "/students/all": { module: "students", feature: "allStudents" },

  "/teacher-management": { module: "teachers", feature: "teacherDashboard" },
  "/teacher-management/all-teachers": { module: "teachers", feature: "allTeachers" },
  "/teacher-management/assign-subjects": { module: "teachers", feature: "assignSubjects" },
  "/teacher-management/leave-management": { module: "teachers", feature: "leaveManagement" },
  "/teacher-management/reports": { module: "teachers", feature: "teacherReports" },

  "/examinations": { module: "examinations", feature: "examinationDashboard" },
  "/examinations/management": { module: "examinations", feature: "examManagement" },
  "/examinations/result-processing": { module: "examinations", feature: "resultProcessing" },
  "/examinations/result-dashboard": { module: "examinations", feature: "resultDashboard" },
  "/examinations/report-card": { module: "examinations", feature: "reportCard" },
  "/examinations/reports": { module: "examinations", feature: "examReports" },

  "/role-management/roles": { module: "roleManagement", feature: "roles" },
  "/role-management/permissions": { module: "roleManagement", feature: "permissions" },
  "/role-management/assignments": { module: "roleManagement", feature: "userRoleAssignment" },
  "/role-management/logs": { module: "roleManagement", feature: "accessLogs" },

  "/student": {
  module: "students",
  feature: "studentDashboard",
},

"/teacher": {
  module: "teachers",
  feature: "teacherDashboard",
},
};

const VALID_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRINCIPAL",
  "HOD",
  "TEACHER",
  "ACCOUNTANT",
  "STUDENT",
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

    if (PUBLIC_PATHS.includes(pathname)) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    const isLoggedIn =
      localStorage.getItem("eduflow-demo-auth") === "true";

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    const savedRole = localStorage.getItem("eduflow-demo-role");
    // const role: Role =
    //   savedRole && VALID_ROLES.includes(savedRole as Role)
    //     ? (savedRole as Role)
    //     : "ADMIN";

    if (!savedRole || !VALID_ROLES.includes(savedRole as Role)) {
  localStorage.removeItem("eduflow-demo-auth");
  localStorage.removeItem("eduflow-demo-role");
  router.replace("/login");
  return;
}

const role = savedRole as Role;
    // Find the most specific matching route.
    const matchingRoute = Object.keys(ROUTE_PERMISSIONS)
      .sort((a, b) => b.length - a.length)
      .find(
        (route) =>
          pathname === route || pathname.startsWith(route + "/")
      );

    // Pages without a configured module permission remain accessible
    // to authenticated users for now.
    if (!matchingRoute) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    const { module, feature } = ROUTE_PERMISSIONS[matchingRoute];

    const allowed = hasFeatureAccess(
      role,
      module,
      feature,
      "view"
    );

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
        <p className="text-sm font-medium text-gray-600">
          Checking permissions...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
