"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { useSidebar } from "@/lib/sidebar";
import { api } from "@/lib/api";
import {
  Users,
  GraduationCap,
  UserRoundCheck,
  Wallet,
  // UserPlus,
  ShieldCheck,
  CalendarCheck,
  // BookOpen,
  // ClipboardCheck,
  FileText,
  // Clock3,
  CalendarDays,
  IndianRupee,
  // ClipboardList,
  ArrowUpRight,
  // School,
  // Activity,
  Layers,
  Database,
  Loader2,
} from "lucide-react";

type OverviewData = {
  totalStudents: number;
  totalTeachers: number;
  totalUsers: number;
  totalRevenue: string;
  pendingDues: string;
  averageAttendance: string;
};

type UserAccount = {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  createdAt?: string;
};

export default function SuperAdminDashboard() {
  const router = useRouter();

  const { sidebarOpen } = useSidebar();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
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
        const [overviewRes, usersRes] = await Promise.allSettled([
          api.get("/reports/overview"),
          api.get("/users?limit=6"),
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value?.overview) {
          setOverview(overviewRes.value.overview);
        }

        if (usersRes.status === "fulfilled" && usersRes.value?.users) {
          setUsers(usersRes.value.users);
        }
      } catch (err) {
        console.warn("Error fetching Super Admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Accounts",
      value: loading ? "..." : String(overview?.totalUsers ?? users.length),
      detail: "Authenticated users in DB",
      icon: UserRoundCheck,
      href: "/admin/users",
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Total Students",
      value: loading ? "..." : String(overview?.totalStudents ?? 0),
      detail: "Active student records",
      icon: GraduationCap,
      href: "/students-management/all",
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Faculty & Staff",
      value: loading ? "..." : String(overview?.totalTeachers ?? 0),
      detail: "Teaching professors & staff",
      icon: Users,
      href: "/teacher-management/all-teachers",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Total Revenue",
      value: loading ? "..." : (overview?.totalRevenue || "₹0"),
      detail: "Collected fee transactions",
      icon: IndianRupee,
      href: "/fees",
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const adminModules = [
    {
      title: "User Management & RBAC",
      description: "Manage accounts, roles, credentials, and access control across all 6 roles",
      icon: ShieldCheck,
      href: "/admin/users",
      badge: "Full Control",
    },
    {
      title: "Student Management",
      description: "Admissions, promotions, student documents, and cumulative profiles",
      icon: GraduationCap,
      href: "/students-management",
      badge: "Academic",
    },
    {
      title: "Teacher Management",
      description: "Faculty directory, subject allocations, leave tracking and reports",
      icon: Users,
      href: "/teacher-management",
      badge: "Faculty",
    },
    {
      title: "Attendance System",
      description: "Real-time daily attendance tracking for students, teachers, and leaves",
      icon: CalendarCheck,
      href: "/attendance",
      badge: "Realtime",
    },
    {
      title: "Fee & Finance Hub",
      description: "Fee structure configuration, receipts generation, pending dues and audit",
      icon: Wallet,
      href: "/fees",
      badge: "Finance",
    },
    {
      title: "Examinations & Grading",
      description: "Examination timetables, marks processing, and report card generation",
      icon: FileText,
      href: "/examinations",
      badge: "Evaluations",
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/20 border border-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900">
                  <ShieldCheck size={14} className="text-yellow-600" />
                  SUPER ADMIN PORTAL
                </span>
                {/* <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"> */}
                  {/* <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live MongoDB Connected
                </span> */}
              </div>

              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-gray-950">
                Super Admin Dashboard
              </h1> 

              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} />
                {today} · Complete authority over all institutional modules
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* <Link
                href="/admin/users/create"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-500 cursor-pointer"
              >
                <UserPlus size={18} />
                Create New User
              </Link> */}

              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Users size={17} />
                Manage Users
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

          {/* Core Modules Grid */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <Layers size={20} className="text-yellow-600" />
                Institutional Governance Modules
              </h2>
              <span className="text-xs text-gray-500">6 Authorized Core Systems</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adminModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-yellow-100 p-3 text-yellow-900 group-hover:bg-yellow-400 transition">
                          <Icon size={24} />
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                          {module.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-950 group-hover:text-yellow-600 transition">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-1 text-xs font-bold text-yellow-700">
                      <span>Open Module</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Live Recent Users Table */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-gray-950 flex items-center gap-2">
                  <Database size={18} className="text-yellow-600" />
                  Live MongoDB Accounts
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Recently created and active users in EduFlow database
                </p>
              </div>

              <Link
                href="/admin/users"
                className="text-xs font-bold text-yellow-800 hover:text-yellow-900 underline underline-offset-4"
              >
                View All Accounts →
              </Link>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-12 text-gray-500 text-sm">
                  <Loader2 className="animate-spin text-yellow-500" size={20} />
                  <span>Loading live accounts from MongoDB...</span>
                </div>
              ) : (
                <table className="w-full min-w-160 text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">User</th>
                      <th className="px-5 py-3.5 font-semibold">Username</th>
                      <th className="px-5 py-3.5 font-semibold">Role</th>
                      <th className="px-5 py-3.5 font-semibold">Department</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-900 text-xs">
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-950">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-700">
                            @{u.username}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">
                            {u.department || "General"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                u.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-gray-500">
                          No user accounts found in the database.
                        </td>
                      </tr>
                    )}
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
