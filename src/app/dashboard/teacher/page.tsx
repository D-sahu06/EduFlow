"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { useSidebar } from "@/lib/sidebar";
import { api } from "@/lib/api";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  CalendarDays,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  FileCheck2,
  Bell,
  UserCheck,
  Loader2,
} from "lucide-react";

export default function TeacherDashboard() {
  const { sidebarOpen } = useSidebar();
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<string>("0%");
  const [subjectsCount, setSubjectsCount] = useState<number>(0);
  const [upcomingExamsCount, setUpcomingExamsCount] = useState<number>(0);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);

        // Fetch students
        try {
          const res = await api.get("/students?limit=100");
          if (res && res.students) {
            setStudents(res.students);
          }
        } catch (err) {
          console.warn("Could not load student list for teacher:", err);
        }

        // Fetch attendance stats
        try {
          const attRes = await api.get("/attendance/stats");
          if (attRes && attRes.stats) {
            setAttendanceRate(attRes.stats.attendanceRate || "0%");
          }
        } catch (err) {
          console.warn("Could not load attendance stats for teacher:", err);
        }

        // Fetch teacher profile to count subjects and extract timetable
        try {
          const profileRes = await api.get("/users/profile");
          const teacher = profileRes?.user;
          const assignedSubjects = teacher?.assignedSubjects || [];
          setSubjectsCount(assignedSubjects.length);

          if (assignedSubjects.length > 0) {
            const mappedSchedule = assignedSubjects.map((sub: any, idx: number) => ({
              period: `Period ${idx + 1}`,
              time: `${9 + idx}:00 AM - ${10 + idx}:00 AM`,
              subject: sub.subjectName || sub.name || "Subject Lecture",
              class: sub.className ? `Class ${sub.className}` : "Assigned Class",
              room: sub.room || `Room ${201 + idx}`,
            }));
            setSchedule(mappedSchedule);
          } else {
            setSchedule([]);
          }
        } catch (err) {
          console.warn("Could not load teacher profile:", err);
        }

        // Fetch upcoming exams
        try {
          const examRes = await api.get("/exams");
          if (examRes && examRes.exams) {
            const activeOrUpcoming = examRes.exams.filter(
              (e: any) =>
                e.status !== "Completed" &&
                e.status !== "Results Published" &&
                e.status !== "Draft"
            );
            setUpcomingExamsCount(activeOrUpcoming.length);
          }
        } catch (err) {
          console.warn("Could not load exams for teacher:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const stats = [
    {
      title: "Assigned Students",
      value: loading ? "..." : String(students.length),
      detail: "In my active batches",
      icon: Users,
      href: "/students/all",
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Today's Attendance",
      value: loading ? "..." : attendanceRate,
      detail: "Marked presence rate",
      icon: CalendarCheck,
      href: "/attendance/mark",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Class Subjects",
      value: loading ? "..." : String(subjectsCount),
      detail: "Assigned curricula",
      icon: BookOpen,
      href: "/examinations",
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Upcoming Tests",
      value: loading ? "..." : String(upcomingExamsCount),
      detail: "Scheduled evaluations",
      icon: ClipboardList,
      href: "/examinations/management",
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const teacherActions = [
    {
      title: "Mark Daily Attendance",
      description: "Record period and daily attendance status for your assigned class batches",
      icon: UserCheck,
      href: "/attendance/mark",
      badge: "Priority",
    },
    {
      title: "View Attendance Records",
      description: "Review attendance sheets, monthly tallies, and student absentee notifications",
      icon: CalendarCheck,
      href: "/attendance/view",
      badge: "Records",
    },
    {
      title: "Student Roster & Profiles",
      description: "Browse student directories, parent contact info, and academic history",
      icon: GraduationCap,
      href: "/students/all",
      badge: "Students",
    },
    {
      title: "Examination & Marks Entry",
      description: "Input student exam marks, test scores, and term evaluations",
      icon: FileCheck2,
      href: "/examinations/result-processing",
      badge: "Grading",
    },
    {
      title: "Announcements & Notices",
      description: "Review institutional notices and send circulars to your classes",
      icon: Bell,
      href: "/communication/announcements",
      badge: "Notices",
    },
    {
      title: "My Teaching Profile",
      description: "Update personal contact details, bio, and review assigned timetable",
      icon: Users,
      href: "/profile",
      badge: "Profile",
    },
  ];

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
          {/* Header */}
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-900">
                  <GraduationCap size={14} className="text-emerald-700" />
                  TEACHER WORKSPACE
                </span>
                {/* <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"> */}
                  {/* <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> */}
                  {/* Academic Session Active */}
                {/* </span> */}
              </div>

              <h1 className="mt-2 text-xl font-extrabold sm:text-3xl text-gray-800">
                Faculty Classroom Dashboard
              </h1>

              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} />
                {today} 
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/attendance/mark"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-500"
              >
                <CheckCircle2 size={18} />
                Mark Attendance
              </Link>
            </div>
          </header>

          {/* Stats Cards */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-600">{item.title}</p>
                    <div className={`rounded-xl p-2.5 ${item.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-gray-800">{item.value}</p>
                  <p className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                    <span>{item.detail}</span>
                    <ArrowUpRight size={14} className="text-gray-400 group-hover:text-yellow-600 transition" />
                  </p>
                </Link>
              );
            })}
          </section>

          {/* Today's Schedule */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
                  <Clock3 size={18} className="text-yellow-600" />
                  Today's Teaching Schedule
                </h2>
                <p className="text-xs text-gray-500 mt-1">Periods scheduled for your active teaching day</p>
              </div>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-900">
                {schedule.length} {schedule.length === 1 ? "Period" : "Periods"}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {schedule.length > 0 ? (
                schedule.map((slot: any) => (
                  <div key={slot.period} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition gap-2">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                        {slot.period}
                      </span>
                      <div>
                        <p className="font-bold text-gray-950 text-sm">{slot.subject}</p>
                        <p className="text-xs text-gray-500">{slot.class} · {slot.room}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        {slot.time}
                      </span>
                      <Link
                        href="/attendance/mark"
                        className="text-xs font-bold text-yellow-800 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition"
                      >
                        Take Attendance
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-500">
                  No teaching schedule or periods assigned for today.
                </div>
              )}
            </div>
          </div>

          {/* Quick Classroom Actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-gray-950">
              Classroom Operations
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teacherActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-yellow-100 p-3 text-yellow-900 group-hover:bg-yellow-400 transition">
                          <Icon size={22} />
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                          {action.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-950 group-hover:text-yellow-600 transition">
                        {action.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        {action.description}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-1 text-xs font-bold text-yellow-700">
                      <span>Launch Tool</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
