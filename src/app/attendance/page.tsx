
"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  FileBarChart,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const summaryCards = [
  {
    title: "Total Students",
    value: "250",
    detail: "Across all classes",
    icon: Users,
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Present Today",
    value: "218",
    detail: "87.2% attendance",
    icon: UserCheck,
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Absent Today",
    value: "24",
    detail: "Students absent",
    icon: UserX,
    color: "bg-red-100 text-red-700",
  },
  {
    title: "Late Arrivals",
    value: "8",
    detail: "Arrived after time",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700",
  },
];

const weeklyData = [
  { day: "Mon", value: 92 },
  { day: "Tue", value: 85 },
  { day: "Wed", value: 94 },
  { day: "Thu", value: 88 },
  { day: "Fri", value: 96 },
  { day: "Sat", value: 82 },
];

const recentRecords = [
  {
    name: "Aarav Sharma",
    roll: "STU001",
    className: "Class 10-A",
    date: "26 Oct 2026",
    status: "Present",
  },
  {
    name: "Priya Verma",
    roll: "STU002",
    className: "Class 10-A",
    date: "26 Oct 2026",
    status: "Absent",
  },
  {
    name: "Rahul Patel",
    roll: "STU003",
    className: "Class 9-B",
    date: "26 Oct 2026",
    status: "Late",
  },
  {
    name: "Ananya Singh",
    roll: "STU004",
    className: "Class 9-A",
    date: "26 Oct 2026",
    status: "Present",
  },
];

const lowAttendance = [
  { name: "Rohan Mehta", className: "Class 9-A", attendance: 62 },
  { name: "Simran Kaur", className: "Class 10-B", attendance: 68 },
  { name: "Karan Joshi", className: "Class 8-A", attendance: 72 },
];

const quickActions = [
  {
    title: "Mark Attendance",
    description: "Record today's student attendance",
    href: "/attendance/mark",
    icon: CalendarCheck,
  },
  {
    title: "View Attendance",
    description: "Search and filter attendance records",
    href: "/attendance/view",
    icon: Users,
  },
  {
    title: "Attendance Reports",
    description: "Review attendance analytics",
    href: "/attendance/reports",
    icon: FileBarChart,
  },
];

export default function AttendanceDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm text-gray-500">
            EduFlow / Attendance
          </p>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Attendance Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor student attendance and review daily statistics.
          </p>
        </div>

        <Link
          href="/attendance/mark"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-500"
        >
          <CalendarCheck size={18} />
          Mark Attendance
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.title}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-gray-900">
                    {card.value}
                  </h2>
                </div>

                <div className={`rounded-xl p-3 ${card.color}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                {card.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart + Attendance Overview */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Weekly Attendance
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Average attendance percentage
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-2 text-green-700">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="flex h-56 items-end justify-around gap-3 border-b border-gray-100 pb-2">
            {weeklyData.map((item) => (
              <div
                key={item.day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-semibold text-gray-600">
                  {item.value}%
                </span>

                <div className="flex h-40 w-full max-w-12 items-end overflow-hidden rounded-t-lg bg-gray-100">
                  <div
                    className="w-full rounded-t-lg bg-yellow-400 transition-all duration-500 hover:bg-yellow-500"
                    style={{ height: `${item.value}%` }}
                    title={`${item.value}% attendance`}
                  />
                </div>

                <span className="text-xs text-gray-500">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">Weekly average</span>
            <span className="font-bold text-gray-900">
              {Math.round(
                weeklyData.reduce((sum, item) => sum + item.value, 0) /
                  weeklyData.length
              )}
              %
            </span>
          </div>
        </section>

        {/* Attendance Breakdown */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Today&apos;s Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Attendance distribution
          </p>

          <div className="my-7 flex justify-center">
            <div
              className="flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#16a34a 0% 87.2%, #dc2626 87.2% 96.8%, #facc15 96.8% 100%)",
              }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-bold text-gray-900">
                  87.2%
                </span>
                <span className="text-xs text-gray-500">Present</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-3 w-3 rounded-full bg-green-600" />
                Present
              </div>
              <span className="text-sm font-semibold text-gray-900">
                218
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-3 w-3 rounded-full bg-red-600" />
                Absent
              </div>
              <span className="text-sm font-semibold text-gray-900">
                24
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                Late
              </div>
              <span className="text-sm font-semibold text-gray-900">
                8
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="mt-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-yellow-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={18}
                  className="shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-900"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Records */}
      <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Attendance
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest sample attendance entries
            </p>
          </div>

          <Link
            href="/attendance/view"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-800 hover:text-yellow-700"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-3 py-3 font-semibold">Student</th>
                <th className="px-3 py-3 font-semibold">Class</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentRecords.map((record) => (
                <tr
                  key={record.roll}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-3 py-4">
                    <p className="font-semibold text-gray-900">
                      {record.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {record.roll}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600">
                    {record.className}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600">
                    {record.date}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        record.status === "Present"
                          ? "bg-green-100 text-green-700"
                          : record.status === "Absent"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Low Attendance */}
      <section className="mt-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Low Attendance Alert
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Students with attendance below 75%
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {lowAttendance.map((student) => (
            <div
              key={student.name}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {student.name}
                </p>
                <p className="text-sm text-gray-500">
                  {student.className}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${student.attendance}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold text-red-600">
                  {student.attendance}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/attendance/reports"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-yellow-700"
        >
          Open Attendance Reports <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
