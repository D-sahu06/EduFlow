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
  School,
  FileCheck2,
  CalendarDays,
  ArrowUpRight,
  CheckCircle2,
  
  Loader2,
} from "lucide-react";

type OverviewData = {
  totalStudents: number;
  totalTeachers: number;
  averageAttendance: string;
};

export default function PrincipalDashboard() {
  const { sidebarOpen } = useSidebar();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [examsCount, setExamsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, studentsRes, teachersRes, examsRes] = await Promise.allSettled([
          api.get<{ overview: OverviewData }>("/reports/overview"),
          api.get<{ students: any[] }>("/students?limit=5"),
          api.get<{ teachers: any[] }>("/teachers?limit=5"),
          api.get<{ exams: any[] }>("/exams"),
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value?.overview) {
          setOverview(overviewRes.value.overview);
        }
        if (studentsRes.status === "fulfilled" && studentsRes.value?.students) {
          setStudents(studentsRes.value.students);
        }
        if (teachersRes.status === "fulfilled" && teachersRes.value?.teachers) {
          setTeachers(teachersRes.value.teachers);
        }
        if (examsRes.status === "fulfilled" && examsRes.value?.exams) {
          setExamsCount(examsRes.value.exams.length);
        }
      } catch (err) {
        console.warn("Error fetching Principal Dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: "Enrolled Students",
      value: overview?.totalStudents != null ? String(overview.totalStudents) : String(students.length),
      detail: "Academic body strength",
      icon: GraduationCap,
      href: "/students/all",
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Faculty Members",
      value: overview?.totalTeachers != null ? String(overview.totalTeachers) : String(teachers.length),
      detail: "Active teaching staff",
      icon: Users,
      href: "/teacher-management/all-teachers",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Institutional Attendance",
      value: overview?.averageAttendance || "0%",
      detail: "Average daily presence",
      icon: CalendarCheck,
      href: "/attendance/reports",
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Active Examinations",
      value: String(examsCount),
      detail: "Scheduled exams in MongoDB",
      icon: BookOpen,
      href: "/examinations",
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const principalModules = [
    {
      title: "Student Admissions & Merit Lists",
      description: "Review admissions pipeline, approve prospective applications and publish merit selections",
      icon: GraduationCap,
      href: "/admission",
    },
    {
      title: "Institutional Attendance Monitoring",
      description: "Comprehensive daily records across all classes, departments, and faculty staff leaves",
      icon: CalendarCheck,
      href: "/attendance/view",
    },
    {
      title: "Faculty & Account Oversight",
      description: "Inspect teacher course loads, subject allocations, and faculty leave approvals",
      icon: Users,
      href: "/teacher-management",
    },
    {
      title: "Examinations & Academic Results",
      description: "Oversee test schedules, evaluate student grade distributions and authorize report cards",
      icon: ClipboardList,
      href: "/examinations",
    },
    {
      title: "Communication & Announcements",
      description: "Broadcast institutional notices, emergency circulars, and departmental updates",
      icon: School,
      href: "/communication/announcements",
    },
    {
      title: "Institutional Reports & Analytics",
      description: "View institution-wide performance summaries, enrollment metrics, and academic statistics",
      icon: FileCheck2,
      href: "/reports",
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-900">
                  <School size={14} className="text-blue-700" />
                  PRINCIPAL DASHBOARD
                </span>
                {/* <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Academic Feed
                </span> */}
              </div>

              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-gray-950">
                Institutional Academic Leadership
              </h1>

              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} />
                {today} 
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admission/applications"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-500"
              >
                <CheckCircle2 size={18} />
                Review Admissions
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
                  <p className="mt-4 text-3xl font-extrabold text-gray-950">{item.value}</p>
                  <p className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                    <span>{item.detail}</span>
                    <ArrowUpRight size={14} className="text-gray-400 group-hover:text-yellow-600 transition" />
                  </p>
                </Link>
              );
            })}
          </section>

          {/* Academic Governance Modules */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-gray-950">
              Academic Supervision & Controls
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {principalModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                  >
                    <div>
                      <div className="mb-4 inline-flex rounded-xl bg-yellow-100 p-3 text-yellow-900 group-hover:bg-yellow-400 transition">
                        <Icon size={24} />
                      </div>
                      <h3 className="text-base font-bold text-gray-950 group-hover:text-yellow-600 transition">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-1 text-xs font-bold text-yellow-700">
                      <span>Open Workspace</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Faculty Quick Overview */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-950">Teaching Faculty Roster</h3>
                <p className="text-xs text-gray-500 mt-1">Live active professors and teachers in MongoDB</p>
              </div>
              <Link href="/teacher-management/all-teachers" className="text-xs font-bold text-yellow-800 hover:underline">
                View All Faculty →
              </Link>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-12 text-gray-500 text-sm">
                  <Loader2 className="animate-spin text-yellow-500" size={20} />
                  <span>Loading faculty records...</span>
                </div>
              ) : (
                <table className="w-full min-w-160 text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Teacher</th>
                      <th className="px-5 py-3.5 font-semibold">Department</th>
                      <th className="px-5 py-3.5 font-semibold">Designation</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teachers.map((t) => (
                      <tr key={t._id || t.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-900 text-xs">
                              {t.name ? t.name.charAt(0) : "T"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-950">{t.name}</p>
                              <p className="text-xs text-gray-500">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{t.department || "General"}</td>
                        <td className="px-5 py-3.5 text-xs font-medium text-gray-700">{t.designation || "Faculty"}</td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
