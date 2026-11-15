"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type RecentRecord = {
  name: string;
  roll: string;
  className: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "On Leave";
};

type LowAttendanceStudent = {
  name: string;
  className: string;
  attendance: number;
};

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
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [presentToday, setPresentToday] = useState<number>(0);
  const [absentToday, setAbsentToday] = useState<number>(0);
  const [lateToday, setLateToday] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<number>(0);

  const [weeklyData, setWeeklyData] = useState<{ day: string; value: number }[]>([
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
  ]);

  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [lowAttendance, setLowAttendance] = useState<LowAttendanceStudent[]>([]);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (String(u.role).toUpperCase() === "STUDENT") {
          router.replace("/attendance/view");
          return;
        }
      }
    } catch {}

    async function loadDashboardData() {
      try {
        setLoading(true);

        const [statsRes, attendanceRes, studentsRes] = await Promise.allSettled([
          api.get<{ success?: boolean; stats?: any }>("/attendance/stats"),
          api.get<{ success?: boolean; records?: any[] }>("/attendance"),
          api.get<{ success?: boolean; students?: any[] }>("/students"),
        ]);

        // 1. Total Students
        let studentCount = 0;
        if (studentsRes.status === "fulfilled" && studentsRes.value?.students) {
          studentCount = studentsRes.value.students.length;
          setTotalStudents(studentCount);
        }

        // 2. Attendance Stats
        if (statsRes.status === "fulfilled" && statsRes.value?.stats) {
          const s = statsRes.value.stats;
          const pres = s.presentCount || 0;
          const abs = s.absentCount || 0;
          const late = s.lateCount || 0;
          setPresentToday(pres);
          setAbsentToday(abs);
          setLateToday(late);

          const rateNum = parseInt(String(s.attendanceRate || "0"), 10);
          setAttendanceRate(isNaN(rateNum) ? 0 : rateNum);
        }

        // 3. Attendance Records
        if (attendanceRes.status === "fulfilled" && attendanceRes.value?.records) {
          const records = attendanceRes.value.records;

          // Recent Records - support linked students and manual attendance entries
          const validRecords = records.filter(
            (r: any) => Boolean(r.studentName || r.student?.name)
          );
          const recent: RecentRecord[] = validRecords.slice(0, 5).map((r: any) => ({
            name: r.studentName || r.student?.name || "",
            roll: r.rollNumber || r.student?.rollNumber || r.student?.studentId || "—",
            className: r.className || r.student?.className || "—",
            date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
            status:
              r.status === "Present"
                ? "Present"
                : r.status === "Absent"
                ? "Absent"
                : r.status === "Late"
                ? "Late"
                : "On Leave",
          }));
          setRecentRecords(recent);

          // Calculate student attendance percentages for Low Attendance alert
          const studentStats: Record<string, { name: string; className: string; total: number; present: number }> = {};
          records.forEach((r: any) => {
            const sName = r.studentName || r.student?.name || "";
            const sRoll = r.rollNumber || r.student?.rollNumber || r.student?.studentId || "";
            const sClass = r.className || r.student?.className || "";
            const sSection = r.section || r.student?.section || "";
            const sId =
              r.student?._id ||
              (typeof r.student === "string" ? r.student : "") ||
              `${sClass.toLowerCase()}|${sSection.toLowerCase()}|${sRoll.toLowerCase()}|${sName.toLowerCase()}`;
            if (!sId || !sName) return;
            if (!studentStats[sId]) {
              studentStats[sId] = { name: sName, className: sClass || "—", total: 0, present: 0 };
            }
            studentStats[sId].total += 1;
            if (r.status === "Present" || r.status === "Late") {
              studentStats[sId].present += 1;
            }
          });

          const lowList: LowAttendanceStudent[] = [];
          Object.values(studentStats).forEach((item) => {
            const pct = item.total > 0 ? Math.round((item.present / item.total) * 100) : 100;
            if (pct < 75) {
              lowList.push({ name: item.name, className: item.className, attendance: pct });
            }
          });
          setLowAttendance(lowList.slice(0, 3));

          // Calculate weekly distribution from records
          const daysMap: Record<string, { present: number; total: number }> = {
            Mon: { present: 0, total: 0 },
            Tue: { present: 0, total: 0 },
            Wed: { present: 0, total: 0 },
            Thu: { present: 0, total: 0 },
            Fri: { present: 0, total: 0 },
            Sat: { present: 0, total: 0 },
          };
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          records.forEach((r: any) => {
            if (!r.date) return;
            const d = new Date(r.date);
            const dayName = dayNames[d.getDay()];
            if (daysMap[dayName]) {
              daysMap[dayName].total += 1;
              if (r.status === "Present") {
                daysMap[dayName].present += 1;
              }
            }
          });

          const dynamicWeekly = Object.entries(daysMap).map(([day, val]) => ({
            day,
            value: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0,
          }));
          setWeeklyData(dynamicWeekly);
        }
      } catch (err) {
        console.error("Failed to load attendance dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalTracked = presentToday + absentToday + lateToday;
  const presentPct = totalTracked > 0 ? (presentToday / totalTracked) * 100 : 0;
  const absentPct = totalTracked > 0 ? (absentToday / totalTracked) * 100 : 0;
  const latePct = totalTracked > 0 ? (lateToday / totalTracked) * 100 : 0;

  const donutGradient = totalTracked > 0
    ? `conic-gradient(#16a34a 0% ${presentPct}%, #dc2626 ${presentPct}% ${presentPct + absentPct}%, #facc15 ${presentPct + absentPct}% 100%)`
    : `conic-gradient(#e5e7eb 0% 100%)`;

  const summaryCards = [
    {
      title: "Total Students",
      value: totalStudents > 0 ? String(totalStudents) : "—",
      detail: "Across enrolled classes",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Present Today",
      value: String(presentToday),
      detail: `${attendanceRate}% attendance rate`,
      icon: UserCheck,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Absent Today",
      value: String(absentToday),
      detail: "Students absent",
      icon: UserX,
      color: "bg-red-100 text-red-700",
    },
    {
      title: "Late Arrivals",
      value: String(lateToday),
      detail: "Arrived after time",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={17} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Attendance Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor student attendance and review daily statistics 
          </p>
        </div>

        {/* <Link
          href="/attendance/mark"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-500 cursor-pointer"
        >
          <CalendarCheck size={18} />
          Mark Attendance
        </Link> */}
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
                    {loading ? "..." : card.value}
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
                Average attendance percentage from database
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
                    style={{ height: `${Math.max(4, item.value)}%` }}
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
                  (weeklyData.filter((i) => i.value > 0).length || 1)
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
                background: donutGradient,
              }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-bold text-gray-900">
                  {totalTracked > 0 ? `${Math.round(presentPct)}%` : "0%"}
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
                {presentToday}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-3 w-3 rounded-full bg-red-600" />
                Absent
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {absentToday}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                Late
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {lateToday}
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
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-yellow-300 hover:shadow-md cursor-pointer"
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
              Latest recorded attendance entries in erp
            </p>
          </div>

          <Link
            href="/attendance/view"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-800 hover:text-yellow-700 cursor-pointer"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="animate-spin text-yellow-500" size={18} />
              Loading attendance records...
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No recent attendance records found in erp.
            </div>
          ) : (
            <table className="w-full min-w-162.5 text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-3 font-semibold">Student</th>
                  <th className="px-3 py-3 font-semibold">Class</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentRecords.map((record, idx) => (
                  <tr
                    key={`${record.roll}-${idx}`}
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
                      {record.date || "—"}
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
          )}
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
          {lowAttendance.length === 0 ? (
            <p className="text-sm text-gray-500">
              No students currently below the 75% attendance threshold.
            </p>
          ) : (
            lowAttendance.map((student) => (
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
            ))
          )}
        </div>

        <Link
          href="/attendance/reports"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-yellow-700 cursor-pointer"
        >
          Open Attendance Reports <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
