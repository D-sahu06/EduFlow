"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Trophy,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function ExaminationDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [studentClass, setStudentClass] = useState<string>("");
  const [studentSection, setStudentSection] = useState<string>("");
  const [examScope, setExamScope] = useState<{
    role?: string;
    scopedBy?: string;
    assignedClass?: string;
    assignedSection?: string;
    missingAssignment?: boolean;
    message?: string;
  } | null>(null);

  const isScopedViewer = userRole === "STUDENT" || userRole === "USER";

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsRes, resultsRes] = await Promise.allSettled([
        api.get("/exams"),
        api.get("/exams/results"),
      ]);

      if (examsRes.status === "fulfilled" && examsRes.value?.exams) {
        setExams(examsRes.value.exams);
        setExamScope(examsRes.value.scope || null);
      } else {
        setExams([]);
        setExamScope(null);
      }
      if (resultsRes.status === "fulfilled" && resultsRes.value?.results) {
        setResults(resultsRes.value.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Error loading examination dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const syncRole = () => {
      try {
        const userStr = localStorage.getItem("eduflow-user");
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed?.role) {
            setUserRole(String(parsed.role).toUpperCase());
          }
          setStudentClass(String(parsed?.className || parsed?.class || "").trim());
          setStudentSection(String(parsed?.section || "").trim());
          if (parsed?.role) return;
        }
      } catch {}
      const fallbackRole = (
        localStorage.getItem("eduflow-role") ||
        localStorage.getItem("eduflow-demo-role") ||
        localStorage.getItem("role") ||
        ""
      ).toUpperCase();
      if (fallbackRole) setUserRole(fallbackRole);
    };

    const syncAll = () => {
      syncRole();
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("eduflow-token");
      if (token) {
        api
          .get<{ user?: { role?: string; className?: string; section?: string } }>("/auth/me")
          .then((res) => {
            if (res?.user?.role) setUserRole(String(res.user.role).toUpperCase());
            if (res?.user?.className !== undefined) {
              setStudentClass(String(res.user.className || "").trim());
            }
            if (res?.user?.section !== undefined) {
              setStudentSection(String(res.user.section || "").trim());
            }
          })
          .catch(() => {});
      }
      loadData();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadData();
    };

    syncAll();

    window.addEventListener("eduflow-user-change", syncAll);
    window.addEventListener("eduflow-exams-change", loadData);
    window.addEventListener("storage", syncAll);
    window.addEventListener("focus", loadData);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("eduflow-user-change", syncAll);
      window.removeEventListener("eduflow-exams-change", loadData);
      window.removeEventListener("storage", syncAll);
      window.removeEventListener("focus", loadData);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const totalExams = exams.length;
  const uniqueStudents = new Set(
    results.map((r) => r.student?._id || r.student?.studentId || r.student)
  ).size;
  const publishedCount = results.filter(
    (r) => r.status === "Published" || r.status === "Passed"
  ).length;
  const completedCount = exams.filter(
    (e) => e.status === "Completed" || e.status === "Results Published"
  ).length;
  const upcomingCount = exams.filter((e) => {
    if (e.status === "Draft" || e.status === "Completed" || e.status === "Results Published") {
      return false;
    }
    if (e.status === "Upcoming" || e.status === "Scheduled" || e.status === "Ongoing") {
      return true;
    }
    if (e.startDate && new Date(e.startDate) >= new Date()) return true;
    return false;
  }).length;

  const stats = [
    {
      title: "Total Examinations",
      value: String(totalExams),
      description: `${upcomingCount} upcoming • ${completedCount} completed`,
      icon: ClipboardList,
    },
    {
      title: "Students Appeared",
      value: String(uniqueStudents || results.length),
      description: "Across all examinations",
      icon: GraduationCap,
    },
    {
      title: "Results Published",
      value: String(publishedCount),
      description: `${results.length - publishedCount > 0 ? results.length - publishedCount : 0} results pending`,
      icon: Trophy,
    },
    {
      title: "Upcoming Exams",
      value: String(upcomingCount),
      description: upcomingCount > 0 ? "Examinations on schedule" : `${completedCount} completed`,
      icon: CalendarDays,
    },
  ];

  const upcomingExams = exams
    .filter((e) => e.status !== "Draft")
    .sort((a, b) => {
      const aDone = a.status === "Completed" || a.status === "Results Published" ? 1 : 0;
      const bDone = b.status === "Completed" || b.status === "Results Published" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
    })
    .slice(0, 8)
    .map((e) => {
      const subjectName =
        e.subject ||
        (Array.isArray(e.subjects) && e.subjects.length > 0
          ? e.subjects.map((s: any) => s.subjectName).filter(Boolean).join(", ")
          : "General");
      const rawClass = String(e.className || "").trim();
      const formattedClass = rawClass
        ? /^\d+(?:st|nd|rd|th)?$/i.test(rawClass)
          ? `Class ${rawClass}`
          : rawClass
        : "All Classes";
      return {
        name: e.title || e.name || "Examination",
        examType: e.examType || "",
        classLabel: formattedClass,
        section: e.section ? `Sec ${e.section}` : "",
        date: e.startDate
          ? new Date(e.startDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "TBD",
        timeLabel: [e.startTime, e.endTime].filter(Boolean).join(" - "),
        duration: e.duration || "",
        subject: subjectName,
        totalMarks: e.totalMarks ?? e.subjects?.[0]?.maxMarks ?? 100,
        passingMarks: e.passingMarks ?? e.subjects?.[0]?.passingMarks ?? 33,
        status: e.status || "Scheduled",
      };
    });

  const recentResultsList = results.slice(0, 5).map((r) => ({
    exam: r.exam?.title || r.exam?.name || "Examination",
    class: r.className
      ? r.className.startsWith("Class")
        ? r.className
        : `Class ${r.className}`
      : "—",
    students: r.student?.name || "1 Student",
    pass: r.percentage ? `${r.percentage}%` : (r.grade || "N/A"),
    status: r.status || "Published",
  }));

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
            {isScopedViewer
              ? studentClass
                ? `Published examinations and results for ${studentClass}${studentSection ? ` (Section ${studentSection})` : ""}.`
                : examScope?.message || "Published institutional examinations and results."
              : "Manage examinations, student performance and results."}
          </p>
        </div>

        {/* <Link
          href="/examinations/management"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-400"
        >
          <Plus size={18} />
          Manage Examinations
        </Link> */}
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
                {loading ? <Loader2 className="animate-spin text-yellow-600" size={24} /> : stat.value}
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
            {loading ? (
              <div className="flex items-center justify-center p-8 text-sm text-gray-500">
                <Loader2 className="mr-2 animate-spin text-yellow-500" size={18} /> Loading examinations...
              </div>
            ) : upcomingExams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                {examScope?.missingAssignment && userRole === "STUDENT"
                  ? examScope.message
                  : isScopedViewer && studentClass
                    ? `No upcoming examinations scheduled for ${studentClass}${studentSection ? ` (Section ${studentSection})` : ""}.`
                    : "No upcoming examinations scheduled."}
              </div>
            ) : (
              upcomingExams.map((exam, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-yellow-100 p-3">
                      <CalendarDays size={21} className="text-gray-900" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">
                          {exam.name}
                        </h3>
                        {exam.examType && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {exam.examType}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {exam.classLabel}
                        {exam.section ? ` (${exam.section})` : ""} • {exam.subject} • Marks: {exam.totalMarks} (Pass: {exam.passingMarks})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <span className="block text-xs font-medium text-gray-700">
                        {exam.date}
                      </span>
                      {(exam.timeLabel || exam.duration) && (
                        <span className="block text-[11px] text-gray-500">
                          {exam.timeLabel}
                          {exam.duration ? ` (${exam.duration})` : ""}
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        exam.status === "Completed" || exam.status === "Results Published"
                          ? "bg-green-100 text-green-700"
                          : exam.status === "Ongoing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>
                </div>
              ))
            )}
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
                description: isScopedViewer
                  ? "View your published exam timetable"
                  : "Create and schedule exams",
                href: "/examinations/management",
                icon: ClipboardList,
              },
              ...(!isScopedViewer
                ? [
                    {
                      title: "Enter Student Marks",
                      description: "Process examination results",
                      href: "/examinations/result-processing",
                      icon: GraduationCap,
                    },
                  ]
                : []),
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
                <th className="px-4 py-3 font-semibold">Student / Candidate</th>
                <th className="px-4 py-3 font-semibold">Score / Grade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                    <Loader2 className="mr-2 inline animate-spin text-yellow-500" size={18} /> Loading examination results...
                  </td>
                </tr>
              ) : recentResultsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                    No examination results published yet.
                  </td>
                </tr>
              ) : (
                recentResultsList.map((result, idx) => (
                  <tr
                    key={idx}
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
                          result.status === "Published" || result.status === "Passed"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {result.status}
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