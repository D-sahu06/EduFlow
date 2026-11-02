
"use client";

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
} from "lucide-react";

const stats = [
  {
    title: "Total Teachers",
    value: "86",
    description: "Registered teachers",
    icon: Users,
  },
  {
    title: "Active Teachers",
    value: "78",
    description: "Currently working",
    icon: UserCheck,
  },
  {
    title: "On Leave",
    value: "05",
    description: "Currently on leave",
    icon: CalendarDays,
  },
  {
    title: "Inactive Teachers",
    value: "03",
    description: "Not currently active",
    icon: UserX,
  },
];

const departments = [
  { name: "Computer Science", count: 18 },
  { name: "Mathematics", count: 14 },
  { name: "English", count: 12 },
  { name: "Physics", count: 10 },
  { name: "Chemistry", count: 9 },
  { name: "Other Departments", count: 23 },
];

const teachers = [
  {
    name: "Rahul Sharma",
    email: "rahul@eduflow.com",
    department: "Computer Science",
    subjects: "Computer Science",
    status: "Active",
  },
  {
    name: "Priya Verma",
    email: "priya@eduflow.com",
    department: "Mathematics",
    subjects: "Mathematics",
    status: "Active",
  },
  {
    name: "Amit Patel",
    email: "amit@eduflow.com",
    department: "Physics",
    subjects: "Physics",
    status: "On Leave",
  },
  {
    name: "Sneha Gupta",
    email: "sneha@eduflow.com",
    department: "English",
    subjects: "English",
    status: "Active",
  },
];

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
  const router = useRouter()
  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
           <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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

        <Link
          href="/teacher-management/all-teachers"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
        >
          <Plus size={18} />
          Add Teacher
        </Link>
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
                    {item.value}
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
            {departments.map((department) => (
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
                      width: `${(department.count / 86) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
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
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.email}
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
                ))}
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
      <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <Clock className="mt-0.5 shrink-0 text-yellow-700" size={20} />
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Dashboard Information
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            This dashboard currently displays sample data for frontend
            development. Live teacher records and statistics will be
            available after backend integration.
          </p>
        </div>
      </div>

    </div>
  );
}
