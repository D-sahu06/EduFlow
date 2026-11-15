"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  GraduationCap,
  ArrowUpRight,
  FileText,
  TrendingUp,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        const res = await api.get("/students");
        if (res && res.students) {
          setStudents(res.students);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error("Failed to load students for dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const totalStudents = students.length;
  const activeStudents = students.filter(
    (s) => s.status === "ACTIVE" || s.status === "Active"
  ).length;
  const inactiveStudents = totalStudents - activeStudents;
  const currentYear = new Date().getFullYear();
  const newAdmissions = students.filter((s) => {
    if (!s.admissionDate && !s.createdAt) return false;
    const d = new Date(s.admissionDate || s.createdAt);
    return d.getFullYear() === currentYear;
  }).length;

  const stats = [
    {
      title: "Total Students",
      value: String(totalStudents),
      change: `${totalStudents} enrolled`,
      icon: Users,
    },
    {
      title: "Active Students",
      value: String(activeStudents),
      change: `${totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% active`,
      icon: UserCheck,
    },
    {
      title: "Inactive Students",
      value: String(inactiveStudents),
      change: `${inactiveStudents} records`,
      icon: UserX,
    },
    {
      title: "New Admissions",
      value: String(newAdmissions),
      change: `Current session`,
      icon: UserPlus,
    },
  ];

  // Group by class
  const classCounts: Record<string, number> = {};
  students.forEach((s) => {
    const c = s.className ? (s.className.startsWith("Class") ? s.className : `Class ${s.className}`) : "Class 10";
    classCounts[c] = (classCounts[c] || 0) + 1;
  });

  const classData = Object.entries(classCounts).map(([className, count]) => ({
    className,
    students: count,
    percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
  }));

  const recentStudents = students.slice(0, 5).map((s) => ({
    id: s.rollNumber || s.studentId || "N/A",
    name: s.name,
    className: s.className ? (s.className.startsWith("Class") ? s.className : `Class ${s.className}`) : "Class 10",
    date: s.admissionDate
      ? new Date(s.admissionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : s.createdAt
      ? new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "—",
    status: s.status === "ACTIVE" || s.status === "Active" ? "Active" : "Inactive",
  }));

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Student Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of student information and activities.
          </p>
        </div>

        {/* <Link
          href="/students-management/all"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
        >
          <UserPlus size={18} />
          View All Students
        </Link> */}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-yellow-100 p-3">
                  <Icon size={22} className="text-slate-800" />
                </div>
                <span className="text-xs font-semibold text-green-600">
                  {item.change}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                {item.title}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? <Loader2 className="animate-spin text-yellow-600" size={22} /> : item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Class Distribution and Quick Actions */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Class Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Class-wise Student Distribution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Student count across different classes
              </p>
            </div>
            <GraduationCap className="text-yellow-500" size={24} />
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                <Loader2 className="mr-2 animate-spin text-yellow-500" size={18} /> Loading class distribution...
              </div>
            ) : classData.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No class records found.
              </div>
            ) : (
              classData.map((item) => (
                <div key={item.className}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.className}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.students} Students
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Frequently used student operations
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/students-management/all"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:border-yellow-400 hover:bg-yellow-50"
            >
              <div className="flex items-center gap-3">
                <Users size={19} />
                <span className="text-sm font-semibold text-slate-700">
                  All Students
                </span>
              </div>
              <ArrowUpRight size={17} />
            </Link>

            <Link
              href="/students-management/promotion"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:border-yellow-400 hover:bg-yellow-50"
            >
              <div className="flex items-center gap-3">
                <TrendingUp size={19} />
                <span className="text-sm font-semibold text-slate-700">
                  Student Promotion
                </span>
              </div>
              <ArrowUpRight size={17} />
            </Link>

            <Link
              href="/students-management/documents"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:border-yellow-400 hover:bg-yellow-50"
            >
              <div className="flex items-center gap-3">
                <FileText size={19} />
                <span className="text-sm font-semibold text-slate-700">
                  Student Documents
                </span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recently Added Students */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Recently Added Students
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest student registrations
            </p>
          </div>

          <Link
            href="/students-management/all"
            className="text-sm font-semibold text-slate-800 hover:text-yellow-600"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-162.5 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Student ID</th>
                <th className="px-5 py-3 font-semibold">Student Name</th>
                <th className="px-5 py-3 font-semibold">Class</th>
                <th className="px-5 py-3 font-semibold">Admission Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                    <Loader2 className="mr-2 inline animate-spin text-yellow-500" size={18} />
                    Loading recent students...
                  </td>
                </tr>
              ) : recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                    No student registrations found.
                  </td>
                </tr>
              ) : (
                recentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {student.id}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {student.className}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {student.date}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          student.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}