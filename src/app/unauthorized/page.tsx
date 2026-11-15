
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  const [dashboardHref, setDashboardHref] = useState("/");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("eduflow-user");
      let role = "";
      if (userStr) {
        const u = JSON.parse(userStr);
        role = u.role || "";
      }
      if (!role) {
        role =
          localStorage.getItem("eduflow-role") ||
          localStorage.getItem("eduflow-demo-role") ||
          localStorage.getItem("role") ||
          "";
      }

      switch (role.toUpperCase()) {
        case "SUPER_ADMIN":
          setDashboardHref("/dashboard/super-admin");
          break;
        case "ADMIN":
          setDashboardHref("/admin");
          break;
        case "PRINCIPAL":
          setDashboardHref("/dashboard/principal");
          break;
        case "TEACHER":
          setDashboardHref("/dashboard/teacher");
          break;
        case "STUDENT":
          setDashboardHref("/dashboard/student");
          break;
        case "ACCOUNTANT":
          setDashboardHref("/dashboard/accountant");
          break;
        case "USER":
          setDashboardHref("/examinations");
          break;
        default:
          setDashboardHref("/");
          break;
      }
    } catch {
      setDashboardHref("/");
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX size={34} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Access Denied
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          You don&apos;t have permission to access this page.
          Please contact your administrator if you need access.
        </p>

        <Link
          href={dashboardHref}
          className="mt-6 inline-flex rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-500 shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
