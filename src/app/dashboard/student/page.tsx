"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { useSidebar } from "@/lib/sidebar";
import { api } from "@/lib/api";
import {
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  Wallet,
  BookOpen,
  CalendarDays,
  ArrowUpRight,
  Clock3,
  Award,
  Bell,
  User,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";

type Announcement = {
  _id?: string;
  id?: string;
  title: string;
  category?: string;
  content?: string;
  createdAt?: string;
  priority?: string;
};

export default function StudentDashboard() {
  const { sidebarOpen } = useSidebar();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{
    totalRecords?: number;
    totalWorkingDays?: number;
    presentCount?: number;
    presentDays?: number;
    absentCount?: number;
    absentDays?: number;
    lateCount?: number;
    lateDays?: number;
    leaveCount?: number;
    leaveDays?: number;
    attendanceRate?: string;
    attendancePercentage?: number;
  } | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [pendingDues, setPendingDues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch {}

    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get("/users/profile");
        if (profileRes && profileRes.user) {
          setCurrentUser(profileRes.user);
        }
      } catch (err) {
        // Fallback to cached user
      }

      try {
        const attRes = await api.get("/attendance/stats");
        if (attRes && attRes.stats) {
          setAttendanceStats(attRes.stats);
        }
      } catch (err) {
        console.warn("Could not fetch attendance stats:", err);
      }

      try {
        const attHistoryRes = await api.get("/attendance");
        if (attHistoryRes && Array.isArray(attHistoryRes.records)) {
          setRecentAttendance(attHistoryRes.records.slice(0, 5));
        }
      } catch (err) {
        console.warn("Could not fetch attendance records:", err);
      }

      try {
        const resultsRes = await api.get("/exams/results");
        if (resultsRes && resultsRes.results) {
          setExamResults(resultsRes.results);
        }
      } catch (err) {
        console.warn("Could not fetch exam results:", err);
      }

      try {
        const duesRes = await api.get("/fees/dues");
        if (duesRes && duesRes.dues) {
          setPendingDues(duesRes.dues.filter((d: any) => d.status !== "Paid"));
        }
      } catch (err) {
        console.warn("Could not fetch fee dues:", err);
      }

      try {
        const res = await api.get("/communication/announcements");
        if (res && res.announcements) {
          setAnnouncements(res.announcements.slice(0, 3));
        }
      } catch (err) {
        console.warn("Could not fetch announcements:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const totalDuesAmount = pendingDues.reduce(
    (acc, d) => acc + (d.remainingAmount !== undefined ? d.remainingAmount : d.amount || 0),
    0
  );

  const latestResult = examResults.length > 0 ? examResults[0] : null;
  const subjects = latestResult && Array.isArray(latestResult.subjects)
    ? latestResult.subjects.map((sub: any) => ({
        name: sub.subjectName || sub.name || "Subject",
        faculty: sub.faculty || "Course Faculty",
        grade: `${sub.marksObtained ?? 0} / ${sub.maxMarks ?? 100}`,
        status: sub.grade || (sub.marksObtained >= 40 ? "Pass" : "Fail"),
      }))
    : [];

  const averagePercentage =
    examResults.length > 0
      ? (
          examResults.reduce((acc, r) => acc + (r.percentage || 0), 0) /
          examResults.length
        ).toFixed(1)
      : null;

  const stats = [
    {
      title: "My Attendance",
      value: attendanceStats ? attendanceStats.attendanceRate : "0%",
      detail: attendanceStats
        ? `${attendanceStats.presentCount} of ${attendanceStats.totalRecords} days present`
        : "No attendance recorded",
      icon: CalendarCheck,
      href: "/attendance/view",
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Current Term GPA",
      value: averagePercentage ? `${averagePercentage}%` : "N/A",
      detail:
        examResults.length > 0
          ? `${examResults.length} exam result(s) evaluated`
          : "No exam results recorded",
      icon: Award,
      href: "/examinations/report-card",
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Enrolled Courses",
      value: currentUser?.className ? `Class ${currentUser.className}` : "Enrolled",
      detail: currentUser?.section ? `Section ${currentUser.section}` : "Active curricula",
      icon: BookOpen,
      href: "/profile",
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Fee Status",
      value: totalDuesAmount > 0 ? `₹${totalDuesAmount.toLocaleString("en-IN")}` : "Paid",
      detail:
        pendingDues.length > 0
          ? `${pendingDues.length} pending installment(s)`
          : "No pending dues",
      icon: Wallet,
      href: "/fees/receipts",
      color: totalDuesAmount > 0 ? "text-amber-700 bg-amber-50" : "text-green-700 bg-green-50",
    },
  ];

  const studentModules = [
    {
      title: "My Academic Profile",
      description: "View enrollment credentials, student ID, department, and contact information.",
      icon: User,
      href: "/profile",
    },
    {
      title: "My Attendance History",
      description: "Track monthly attendance percentage, holiday leaves, and daily presence records.",
      icon: CalendarCheck,
      href: "/attendance/view",
    },
    {
      title: "Examination Results & Cards",
      description: "Inspect published semester grades, subject-wise marks, and term report cards.",
      icon: ClipboardList,
      href: "/examinations/report-card",
    },
    {
      title: "Fee Statements & Receipts",
      description: "Download verified payment receipts, check fee structures, and view transaction history.",
      icon: Wallet,
      href: "/fees/receipts",
    },
    {
      title: "Notice Board & Circulars",
      description: "Stay informed on academic notifications, upcoming exams, and institutional circulars.",
      icon: Bell,
      href: "/communication/announcements",
    },
    {
      title: "Exam Timetable & Schedule",
      description: "Check official exam session dates, classroom venues, and timetable schedules.",
      icon: Clock3,
      href: "/examinations",
    },
  ];

  const studentDisplayName =
    currentUser?.fullName ||
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    currentUser?.username ||
    "Student";

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      <Sidebar />

      <div
        data-sidebar-content="true"
        className={`min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "md:ml-64" : "ml-0 md:ml-0 w-full"
        }`}
      >
        <Topbar />

        <main className="min-h-screen px-5 pb-12 pt-6 md:px-8">
          <div className="w-full space-y-7">
            {/* Header Section */}
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-900">
                    <GraduationCap size={14} className="text-yellow-800" />
                    STUDENT PORTAL
                  </span>
                  {/* <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Good Academic Standing
                  </span> */}
                </div>

                <h1 className="mt-2 text-2xl font-semibold text-gray-800 sm:text-3xl">
                  Welcome back, {studentDisplayName}!
                </h1>

                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays size={16} />
                  {today} 
                </p>
              </div>

              {/* <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-500 cursor-pointer"
                >
                  <User size={18} />
                  View My Profile
                </Link>
              </div> */}
            </header>

            {/* Stats Cards Section */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">{item.title}</p>
                      <div className={`rounded-xl p-2.5 ${item.color}`}>
                        <Icon size={20} />
                      </div>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-gray-700">{item.value}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{item.detail}</span>
                      <ArrowUpRight
                        size={14}
                        className="text-gray-400 transition group-hover:text-yellow-600"
                      />
                    </div>
                  </Link>
                );
              })}
            </section>

            {/* Role-Based Student Attendance Live Breakdown */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-gray-950">
                    <CalendarCheck size={19} className="text-yellow-600" />
                    My Attendance Record &amp; Metrics
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Verified institutional attendance marked by teachers in MongoDB
                  </p>
                </div>
                <Link
                  href="/attendance/view"
                  className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-900 border border-yellow-200 transition hover:bg-yellow-100 cursor-pointer"
                >
                  <span>Detailed Attendance History</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 text-center">
                  <p className="text-xs font-medium text-gray-500">Total Working</p>
                  <p className="mt-1.5 text-xl font-extrabold text-gray-900">
                    {attendanceStats?.totalWorkingDays ?? attendanceStats?.totalRecords ?? 0}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Days Scheduled</p>
                </div>

                <div className="rounded-xl border border-green-100 bg-green-50/70 p-3.5 text-center">
                  <p className="text-xs font-medium text-green-700">Present</p>
                  <p className="mt-1.5 text-xl font-extrabold text-green-800">
                    {attendanceStats?.presentDays ?? attendanceStats?.presentCount ?? 0}
                  </p>
                  <p className="mt-0.5 text-[10px] text-green-600">Days Present</p>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50/70 p-3.5 text-center">
                  <p className="text-xs font-medium text-red-700">Absent</p>
                  <p className="mt-1.5 text-xl font-extrabold text-red-800">
                    {attendanceStats?.absentDays ?? attendanceStats?.absentCount ?? 0}
                  </p>
                  <p className="mt-0.5 text-[10px] text-red-600">Unexcused</p>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 text-center">
                  <p className="text-xs font-medium text-amber-700">Late</p>
                  <p className="mt-1.5 text-xl font-extrabold text-amber-800">
                    {attendanceStats?.lateDays ?? attendanceStats?.lateCount ?? 0}
                  </p>
                  <p className="mt-0.5 text-[10px] text-amber-600">Arrived Late</p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-center">
                  <p className="text-xs font-medium text-blue-700">On Leave</p>
                  <p className="mt-1.5 text-xl font-extrabold text-blue-800">
                    {attendanceStats?.leaveDays ?? attendanceStats?.leaveCount ?? 0}
                  </p>
                  <p className="mt-0.5 text-[10px] text-blue-600">Approved Leave</p>
                </div>

                <div className="rounded-xl border border-yellow-200 bg-yellow-50/80 p-3.5 text-center">
                  <p className="text-xs font-medium text-yellow-800">Attendance %</p>
                  <p className="mt-1.5 text-xl font-extrabold text-gray-950">
                    {attendanceStats?.attendancePercentage !== undefined
                      ? `${attendanceStats.attendancePercentage}%`
                      : attendanceStats?.attendanceRate || "0%"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-yellow-700">Overall Rate</p>
                </div>
              </div>
            </section>

            {/* Two Column Layout: Performance & Notice Board */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Registered Subject Performance (2 cols on large screens) */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:px-6">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-gray-950">
                      <BookOpen size={18} className="text-yellow-600" />
                      Registered Subject Performance
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Live grades and term evaluations for active coursework
                    </p>
                  </div>
                  <Link
                    href="/examinations/report-card"
                    className="text-xs font-bold text-yellow-800 transition hover:text-yellow-900 hover:underline"
                  >
                    View Report Card →
                  </Link>
                </div>

                <div className="divide-y divide-gray-100">
                  {subjects.length > 0 ? (
                    subjects.map((sub: any) => (
                      <div
                        key={sub.name}
                        className="flex flex-col justify-between gap-3 p-4 sm:px-6 sm:flex-row sm:items-center hover:bg-gray-50/60 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{sub.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Instructor: {sub.faculty}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-gray-900">{sub.grade}</span>
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-500">
                      No examination results or grades recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Notice Board & Circulars (1 col on large screens) */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:px-6">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-gray-950">
                      <Megaphone size={18} className="text-yellow-600" />
                      Notice Board
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Recent institutional circulars
                    </p>
                  </div>
                  <Link
                    href="/communication/announcements"
                    className="text-xs font-bold text-yellow-800 transition hover:text-yellow-900 hover:underline"
                  >
                    View All →
                  </Link>
                </div>

                <div className="divide-y divide-gray-100">
                  {announcements.length > 0 ? (
                    announcements.map((notice) => (
                      <div key={notice._id || notice.id || notice.title} className="p-4 sm:px-6 hover:bg-gray-50/60 transition">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-[10px] font-bold text-yellow-900">
                            {notice.category || "Academic"}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {notice.createdAt ? notice.createdAt.slice(0, 10) : "Notice"}
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-gray-900 line-clamp-1">
                          {notice.title}
                        </h3>
                        {notice.content && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {notice.content}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500">
                      No new notices at this time.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Attendance History Section */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:px-6">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-gray-950">
                    <CalendarCheck size={18} className="text-yellow-600" />
                    Recent Attendance History
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Your daily presence and classroom session logs
                  </p>
                </div>
                <Link
                  href="/attendance/view"
                  className="text-xs font-bold text-yellow-800 transition hover:text-yellow-900 hover:underline"
                >
                  View Full History →
                </Link>
              </div>

              {recentAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold">Date</th>
                        <th className="px-5 py-3.5 font-semibold">Class &amp; Section</th>
                        <th className="px-5 py-3.5 font-semibold">Status</th>
                        <th className="px-5 py-3.5 font-semibold">Marked By / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentAttendance.map((rec: any, idx: number) => {
                        const stat = rec.status || "Present";
                        const statStyle =
                          stat === "Present"
                            ? "bg-green-100 text-green-700"
                            : stat === "Absent"
                            ? "bg-red-100 text-red-700"
                            : stat === "Late"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-700";

                        const dateLabel = rec.date ? rec.date.slice(0, 10) : "—";

                        return (
                          <tr key={rec._id || rec.id || idx} className="hover:bg-gray-50/60 transition">
                            <td className="px-5 py-3.5 font-medium text-gray-900 flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              {dateLabel}
                            </td>
                            <td className="px-5 py-3.5 text-gray-600">
                              {rec.className || "CS"} {rec.section ? `- ${rec.section}` : ""}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statStyle}`}>
                                {stat === "Present" && <CheckCircle2 size={12} />}
                                {stat === "Absent" && <XCircle size={12} />}
                                {stat === "Late" && <Clock size={12} />}
                                {stat}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-500">
                              {rec.remarks || rec.markedBy?.name ? `Marked by ${rec.markedBy?.name}` : "Institutional record"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-500">
                  No attendance entries marked yet. Once your teacher records your attendance, it will be listed here automatically.
                </div>
              )}
            </div>

            {/* Student Portals & Tools Section */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-950">
                  Student Portals & Tools
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Quick access to all your academic services and student records.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {studentModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Link
                      key={module.title}
                      href={module.href}
                      className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-400 hover:shadow-md cursor-pointer"
                    >
                      <div>
                        <div className="mb-4 inline-flex rounded-xl bg-yellow-100 p-3 text-yellow-900 transition group-hover:bg-yellow-400">
                          <Icon size={22} />
                        </div>
                        <h3 className="text-base font-bold text-gray-950 transition group-hover:text-yellow-600">
                          {module.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-gray-500">
                          {module.description}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center gap-1 text-xs font-bold text-yellow-800">
                        <span>View Details</span>
                        <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
