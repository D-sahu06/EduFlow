"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { api } from "@/lib/api";
import { useUnreadNotifications } from "@/lib/notifications";
import { useSidebar } from "@/lib/sidebar";

import {
  Users,
  GraduationCap,
  UserRoundCheck,
  Wallet,
  UserPlus,
  Bell,
  Search,
  ArrowUpRight,
  CalendarCheck,
  BookOpen,
  ClipboardCheck,
  FileText,
  Clock3,
  ChevronDown,
  UserRound,
  LogOut,
  Building2,
  CalendarDays,
  IndianRupee,
  ClipboardList,
} from "lucide-react";

type LoggedInUser = {
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: string;
  profileImage?: string;
  avatar?: string;
};


const modules = [
  {
    title: "Student Management",
    description: "Admissions, student profiles and records",
    icon: GraduationCap,
    href: "/students-management",
  },
  {
    title: "Teacher Management",
    description: "Teacher profiles and staff information",
    icon: Users,
    href: "/teacher-management",
  },
  {
    title: "Attendance",
    description: "Daily student and staff attendance",
    icon: ClipboardCheck,
    href: "/attendance",
  },
  {
    title: "Fees & Finance",
    description: "Fee collection, dues and payment records",
    icon: IndianRupee,
    href: "/fees",
  },
  {
    title: "Classes & Subjects",
    description: "Manage classes, sections and subjects",
    icon: BookOpen,
    href: "/students/classes",
  },
  {
    title: "Examinations & Results",
    description: "Exam schedules, marks and results",
    icon: FileText,
    href: "/examinations",
  },
  {
    title: "Timetable",
    description: "Class schedules and academic planning",
    icon: Clock3,
    href: "/examinations",
  },
  {
    title: "Reports",
    description: "Institution performance and summaries",
    icon: ClipboardList,
    href: "/reports",
  },
];

const activities = [
  {
    title: "Student records",
    detail: "Manage admissions and student information",
    icon: GraduationCap,
    href: "/students-management",
  },
  {
    title: "Attendance management",
    detail: "Review attendance records",
    icon: CalendarCheck,
    href: "/attendance",
  },
  {
    title: "Fee management",
    detail: "Review fee and payment records",
    icon: Wallet,
    href: "/fees",
  },
];

function getStoredUser(): LoggedInUser | null {
  const keys = ["edunexus-user", "eduflow-user", "currentUser", "user"];

  for (const key of keys) {
    const stored = localStorage.getItem(key);

    if (!stored) continue;

    try {
      const parsed = JSON.parse(stored);

      if (parsed && typeof parsed === "object") {
        return parsed as LoggedInUser;
      }
    } catch {
      // Ignore invalid JSON and check the next key.
    }
  }

  return null;
}

function getDisplayName(user: LoggedInUser | null) {
  if (!user) return "Admin User";

  const combinedName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    user.fullName ||
    user.name ||
    combinedName ||
    user.username ||
    user.email?.split("@")[0] ||
    "Admin User"
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();

  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const displayName = getDisplayName(user);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleLogout = () => {
    [
      "eduflow-user",
      "eduflow-user",
      "currentUser",
      "user",
      "token",
      "access_token",
    ].forEach((key) => localStorage.removeItem(key));

    setProfileOpen(false);
    router.push("/");
  };

  const filteredModules = modules.filter((module) =>
    `${module.title} ${module.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const [overview, setOverview] = useState<{
    totalStudents: number;
    totalTeachers: number;
    totalUsers: number;
    totalRevenue: string;
    pendingDues: string;
    averageAttendance: string;
  } | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await api.get("/reports/overview");
        if (res && res.overview) {
          setOverview(res.overview);
        }
      } catch (err) {
        console.warn("Could not fetch overview from MongoDB:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    } else {
      try {
        const stored = localStorage.getItem("eduflow-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.role) setRole(parsed.role);
        }
      } catch {}
    }
  }, [user]);

  const dashboardStats = [
    {
      title: "Total Students",
      value: loading ? "..." : String(overview?.totalStudents ?? 0),
      detail: "Registered in MongoDB",
      icon: GraduationCap,
      href: "/students-management/all",
    },
    {
      title: "Total Teachers",
      value: loading ? "..." : String(overview?.totalTeachers ?? 0),
      detail: "Teaching staff in DB",
      icon: Users,
      href: "/teacher-management/all-teachers",
    },
    {
      title: "Total Accounts",
      value: loading ? "..." : String(overview?.totalUsers ?? 0),
      detail: "Authenticated users",
      icon: UserRoundCheck,
      href: "/admin/users",
    },
    {
      title: "Fee Collections",
      value: loading ? "..." : (overview?.totalRevenue || "₹0"),
      detail: "Live revenue summary",
      icon: Wallet,
      href: "/fees",
    },
  ];

  const canCreateUser =
  role === "SUPER_ADMIN" || role === "ADMIN" || role === "PRINCIPAL";

  

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      <Sidebar />

      <main
        data-sidebar-content="true"
        className={`min-h-screen min-w-0 px-5 pb-12 pt-6 md:px-8 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "md:ml-64" : "ml-0 md:ml-0 w-full"
        }`}
      >
        {/* Dashboard header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 shadow-xs transition hover:border-yellow-400 hover:bg-yellow-50 hover:text-gray-950 active:scale-95 cursor-pointer dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-yellow-400 dark:hover:bg-gray-700"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="4" y1="12" x2="21" y2="12" />
                <line x1="7" y1="18" x2="18" y2="18" />
              </svg>
            </button>

            <div>
              <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                Dashboard 
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} />
                {today}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canCreateUser && (
               <button onClick={()=>{
              router.push("/admin/users/create")
             }}
             className="shrink-0 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-yellow-400 cursor-pointer">
             
              Create User
              </button> 
            )}
                      
            <label className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:flex">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ERP modules..."
                aria-label="Search ERP modules"
                className="w-40 bg-transparent text-sm outline-none md:w-48"
              />
            </label>
            

            <button
              type="button"
              aria-label={
                unreadCount > 0
                  ? `Notifications (${unreadCount} unread)`
                  : "Notifications"
              }
              className="relative rounded-xl border border-gray-200 bg-white p-3 transition hover:bg-yellow-50 cursor-pointer"
              onClick={() => router.push("/communication/notification")}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold leading-none text-slate-900 ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 transition hover:bg-gray-100"
              >
                {user?.profileImage || user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profileImage || user.avatar}
                    alt="Profile"
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950 font-bold text-yellow-400">
                    {initials || "A"}
                  </span>
                )}

                <span className="hidden max-w-36 text-left sm:block">
                  <span className="block truncate text-sm font-semibold">
                    {displayName}
                  </span>
                  <span className="block text-xs capitalize text-gray-500">
                    {user?.role || "Administrator"}
                  </span>
                </span>

                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                    <div className="border-b border-gray-100 px-3 py-3">
                      <p className="truncate text-sm font-bold">
                        {displayName}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {user?.email || "Signed-in account"}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-yellow-50"
                    >
                      <UserRound size={18} />
                      Manage Account
                    </Link>

                    {/* <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-yellow-50"
                    >
                      <Settings size={18} />
                      Profile Settings
                    </Link> */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Personalized welcome */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-gray-950 p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-yellow-400">
                EDUCATION MANAGEMENT SYSTEM
              </p>

              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                Welcome, {displayName}!
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
                Manage student records, staff, attendance, fees and academic
                operations from your central ERP dashboard.
              </p>

              <p className="mt-4 text-sm text-gray-400">{today}</p>
            </div>

            {/* <Link
              href="/admin/users/create"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-gray-950 transition hover:bg-yellow-300"
            >
              <UserPlus size={19} />
              Create Account
            </Link> */}
          </div>
        </section>

        {/* ERP statistics */}
        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Institution Overview</h2>
              <p className="mt-1 text-sm text-gray-500">
                A quick overview of institution records
              </p>
            </div>
            <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              Live MongoDB Data
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Link
                  key={stat.title}
                  href={stat.href}
                  className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
                      <Icon size={22} />
                    </div>
                    <ArrowUpRight size={18} className="text-gray-400" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold">{stat.value}</p>
                  <p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ERP module cards */}
        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-lg font-bold">ERP Modules</h2>
            <p className="mt-1 text-sm text-gray-500">
              Access and manage your institution&apos;s core operations
            </p>
          </div>

          {filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredModules.map((module) => {
                const Icon = module.icon;

                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:border-yellow-400 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800 transition group-hover:bg-yellow-400">
                        <Icon size={23} />
                      </div>
                      <ArrowUpRight
                        size={18}
                        className="text-gray-400 transition group-hover:text-gray-900"
                      />
                    </div>

                    <h3 className="mt-5 font-bold">{module.title}</h3>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500">
                      {module.description}
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-yellow-800">
                      Open module →
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No modules found for &quot;{search}&quot;.
            </div>
          )}
        </section>

        {/* Recent ERP activity and quick actions */}
        <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">ERP Management Shortcuts</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Jump directly to key records
                </p>
              </div>
              <Building2 size={22} className="text-yellow-700" />
            </div>

            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = activity.icon;

                return (
                  <Link
                    key={activity.title}
                    href={activity.href}
                    className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-yellow-50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800">
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {activity.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {activity.detail}
                      </p>
                    </div>

                    <ArrowUpRight size={18} className="text-gray-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-2 font-bold">Quick Actions</h2>
            <p className="mb-5 text-sm text-gray-500">
              Common administrator tasks
            </p>

            <div className="space-y-3">
              <Link
                href="/admin/users/create"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
              >
                <UserPlus size={20} className="shrink-0 text-yellow-700" />
                Create User Account
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
              >
                <Users size={20} className="shrink-0 text-yellow-700" />
                Manage Users
              </Link>

              <Link
                href="/attendance"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
              >
                <CalendarCheck
                  size={20}
                  className="shrink-0 text-yellow-700"
                />
                View Attendance
              </Link>

              <Link
                href="/fees"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
              >
                <Wallet size={20} className="shrink-0 text-yellow-700" />
                Fee Records
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-gray-400">
          EduFlow ERP · Institution Management Dashboard
        </footer>
      </main>
    </div>
  );
}

