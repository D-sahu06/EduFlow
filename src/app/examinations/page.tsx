
"use client";

import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Trophy,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const stats = [
  {
    title: "Total Examinations",
    value: "12",
    description: "4 exams scheduled",
    icon: ClipboardList,
  },
  {
    title: "Students Appeared",
    value: "1,240",
    description: "Across all examinations",
    icon: GraduationCap,
  },
  {
    title: "Results Published",
    value: "8",
    description: "4 results pending",
    icon: Trophy,
  },
  {
    title: "Upcoming Exams",
    value: "4",
    description: "Next exam in 3 days",
    icon: CalendarDays,
  },
];

const upcomingExams = [
  {
    name: "Mid Term Examination",
    class: "Class 10",
    date: "05 Nov 2026",
    subject: "Mathematics",
    status: "Upcoming",
  },
  {
    name: "Final Examination",
    class: "Class 12",
    date: "10 Nov 2026",
    subject: "Physics",
    status: "Upcoming",
  },
  {
    name: "Unit Test",
    class: "Class 9",
    date: "12 Nov 2026",
    subject: "English",
    status: "Scheduled",
  },
];

const recentResults = [
  {
    exam: "Unit Test 2",
    class: "Class 10",
    students: 120,
    pass: "92%",
    status: "Published",
  },
  {
    exam: "Mid Term",
    class: "Class 12",
    students: 95,
    pass: "88%",
    status: "Published",
  },
  {
    exam: "Unit Test 1",
    class: "Class 9",
    students: 110,
    pass: "Pending",
    status: "Processing",
  },
];

export default function ExaminationDashboard() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-7">

      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
             <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center cursor-pointer gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Examination & Results
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage examinations, student performance and results.
          </p>
        </div>

        <Link
          href="/examinations/management"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-400"
        >
          <Plus size={18} />
          Manage Examinations
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-yellow-100 p-3">
                  <Icon size={22} className="text-gray-900" />
                </div>
                <ArrowUpRight size={19} className="text-gray-400" />
              </div>

              <p className="mt-5 text-sm font-medium text-gray-500">
                {stat.title}
              </p>

              <h2 className="mt-1 text-3xl font-extrabold text-gray-900">
                {stat.value}
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Upcoming Exams */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Upcoming Examinations
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Keep track of scheduled examinations
              </p>
            </div>

            <Link
              href="/examinations/management"
              className="text-sm font-semibold text-gray-900 hover:text-yellow-600"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.name}
                className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-yellow-100 p-3">
                    <CalendarDays size={21} className="text-gray-900" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {exam.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {exam.class} • {exam.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="text-xs font-medium text-gray-600">
                    {exam.date}
                  </span>
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                    {exam.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Quick Actions
          </h2>
          <p className="mb-5 mt-1 text-xs text-gray-500">
            Frequently used examination tools
          </p>

          <div className="space-y-3">
            {[
              {
                title: "Exam Management",
                description: "Create and schedule exams",
                href: "/examinations/management",
                icon: ClipboardList,
              },
              {
                title: "Enter Student Marks",
                description: "Process examination results",
                href: "/examinations/result-processing",
                icon: GraduationCap,
              },
              {
                title: "View Result Dashboard",
                description: "Analyze student performance",
                href: "/examinations/result-dashboard",
                icon: Trophy,
              },
              {
                title: "Generate Report Cards",
                description: "View student report cards",
                href: "/examinations/report-card",
                icon: Clock,
              },
            ].map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-yellow-300 hover:bg-yellow-50"
                >
                  <div className="rounded-lg bg-yellow-100 p-2">
                    <Icon size={19} className="text-gray-900" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {action.description}
                    </p>
                  </div>

                  <ArrowUpRight size={17} className="text-gray-400" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Examination Results
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Latest examination result updates
            </p>
          </div>

          <Link
            href="/examinations/reports"
            className="text-sm font-semibold text-gray-900 hover:text-yellow-600"
          >
            View Reports
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-162.5 text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-3 font-semibold">Examination</th>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">Students</th>
                <th className="px-4 py-3 font-semibold">Pass Percentage</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentResults.map((result) => (
                <tr
                  key={result.exam}
                  className="border-b border-gray-50 text-sm last:border-0"
                >
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {result.exam}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {result.class}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {result.students}
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-800">
                    {result.pass}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        result.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {result.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
