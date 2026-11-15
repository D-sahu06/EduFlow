"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Clock,
  ArrowLeft,
  Plus,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

const quickActions = [
  {
    title: "All Teachers",
    description: "View and manage teacher records",
    href: "/teacher-management/all-teachers",
    icon: Users,
  },
  {
    title: "Assign Subjects",
    description: "Assign subjects to teachers",
    href: "/teacher-management/assign-subjects",
    icon: BookOpen,
  },
  {
    title: "Leave Management",
    description: "Manage teacher leave requests",
    href: "/teacher-management/leave-management",
    icon: CalendarDays,
  },
  {
    title: "Teacher Reports",
    description: "View teacher performance reports",
    href: "/teacher-management/reports",
    icon: GraduationCap,
  },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [teachersRes, leavesRes] = await Promise.allSettled([
          api.get("/teachers"),
          api.get("/attendance/leaves?role=TEACHER"),
        ]);

        if (teachersRes.status === "fulfilled" && teachersRes.value?.teachers) {
          setTeachers(teachersRes.value.teachers);
        } else {
          setTeachers([]);
        }

        if (leavesRes.status === "fulfilled" && leavesRes.value?.leaves) {
          setLeaves(leavesRes.value.leaves);
        } else {
          setLeaves([]);
        }
      } catch (err) {
        console.error("Failed to load teacher dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(
    (t) => (t.status || "Active").toLowerCase() === "active"
  ).length;
  const onLeaveTeachers = leaves.filter(
    (l) => l.status === "APPROVED" || l.status === "Approved"
  ).length;
  const inactiveTeachers = teachers.filter(
    (t) => (t.status || "").toLowerCase() === "inactive"
  ).length;

  const stats = [
    {
      title: "Total Teachers",
      value: String(totalTeachers),
      description: "Registered teachers in MongoDB",
      icon: Users,
    },
    {
      title: "Active Teachers",
      value: String(activeTeachers),
      description: "Currently working",
      icon: UserCheck,
    },
    {
      title: "On Leave",
      value: String(onLeaveTeachers),
      description: "Approved leaves",
      icon: CalendarDays,
    },
    {
      title: "Inactive Teachers",
      value: String(inactiveTeachers),
      description: "Not currently active",
      icon: UserX,
    },
  ];

  // Group by department
  const deptCounts: Record<string, number> = {};
  teachers.forEach((t) => {
    const dept = t.department || "General Academics";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const departmentList = Object.entries(deptCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const recentTeachers = teachers.slice(0, 5).map((t) => ({
    name: t.name,
    email: t.email,
    department: t.department || "General Academics",
    subjects:
      t.assignedSubjects && t.assignedSubjects.length > 0
        ? t.assignedSubjects.map((s: any) => s.subjectName || s).join(", ")
        : (t.subjects && t.subjects.length > 0 ? t.subjects.join(", ") : "Not assigned"),
    status: (t.status || "Active").toLowerCase() === "active" ? "Active" : "Inactive",
  }));

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={17} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Teacher Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage teachers, subjects and leave records.
          </p>
        </div>

        {/* <Link
          href="/teacher-management/all-teachers"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
        >
          <Plus size={18} />
          Add Teacher
        </Link> */}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {item.title}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {loading ? <Loader2 className="animate-spin text-yellow-600" size={24} /> : item.value}
                  </h2>
                </div>

                <div className="rounded-xl bg-yellow-100 p-3 text-yellow-700">
                  <Icon size={23} />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Department Distribution */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-1">
          <h2 className="text-lg font-bold text-slate-900">
            Department Distribution
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Teachers by department
          </p>

          <div className="mt-6 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                <Loader2 className="mr-2 animate-spin text-yellow-500" size={18} /> Loading departments...
              </div>
            ) : departmentList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No department records available.
              </div>
            ) : (
              departmentList.map((department) => (
                <div key={department.name}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {department.name}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {department.count}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{
                        width: `${totalTeachers > 0 ? (department.count / totalTeachers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Teachers */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Teachers
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Recently added teacher records
              </p>
            </div>

            <Link
              href="/teacher-management/all-teachers"
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-yellow-700 hover:text-yellow-800"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-150 text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                  <th className="pb-3 font-semibold">Teacher</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                      <Loader2 className="mr-2 inline animate-spin text-yellow-500" size={18} /> Loading teacher records...
                    </td>
                  </tr>
                ) : recentTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                      No teacher records found in MongoDB.
                    </td>
                  </tr>
                ) : (
                  recentTeachers.map((teacher, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {teacher.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {teacher.email}
                        </p>
                      </td>

                      <td className="py-4 text-sm text-gray-600">
                        {teacher.department}
                      </td>

                      <td className="py-4 text-sm text-gray-600">
                        {teacher.subjects}
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            teacher.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {teacher.status}
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Quickly access teacher management features.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-yellow-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-yellow-100 p-3 text-yellow-700">
                    <Icon size={22} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-yellow-700"
                  />
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  {action.title}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Information */}
      {/* <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <Clock className="mt-0.5 shrink-0 text-yellow-700" size={20} />
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Database Synchronization
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Teacher management is actively connected to MongoDB. All department counts, assigned subjects, and leave records reflect real-time institutional records.
          </p>
        </div>
      </div> */}

    </div>
  );
}