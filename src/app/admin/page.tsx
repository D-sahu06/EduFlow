
// "use client";

// import Link from "next/link";
// import Sidebar from "@/components/sidebar";
// import {
//   Users,
//   GraduationCap,
//   UserRoundCheck,
//   Wallet,
//   UserPlus,
//   Bell,
//   Search,
//   ArrowUpRight,
//   CalendarCheck,
// } from "lucide-react";

// const stats = [
//   {
//     title: "Total Students",
//     value: "1,248",
//     detail: "Student records",
//     icon: GraduationCap,
//   },
//   {
//     title: "Total Teachers",
//     value: "86",
//     detail: "Teaching staff",
//     icon: Users,
//   },
//   {
//     title: "Total Staff",
//     value: "42",
//     detail: "Non-teaching staff",
//     icon: UserRoundCheck,
//   },
//   {
//     title: "Fee Collection",
//     value: "₹8.4L",
//     detail: "Demo amount",
//     icon: Wallet,
//   },
// ];

// const activities = [
//   {
//     title: "New student admission",
//     detail: "Admission module",
//     time: "Recent",
//   },
//   {
//     title: "Attendance overview",
//     detail: "Attendance module",
//     time: "Today",
//   },
//   {
//     title: "Fee records overview",
//     detail: "Finance module",
//     time: "Today",
//   },
// ];

// export default function AdminDashboard() {
//    console.log("Admin dashboard page rendered");
//   return (
//     <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
//       <Sidebar />

//       <main className="min-h-screen min-w-0 px-4 pb-8 pt-20 sm:px-6 md:ml-64 md:pt-6 lg:px-9">
//         {/* Header */}
//         <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <p className="text-sm font-medium text-gray-500">
//               Admin / Dashboard
//             </p>

//             <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
//               Admin Dashboard
              
//             </h2>
           
            

//             <p className="mt-2 text-sm text-gray-500">
//               Overview of your institution management system.
//             </p>
//           </div>

//           <div className="flex items-center gap-3">
//             <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:flex">
//               <Search size={18} className="text-gray-400" />
//               <input
//                 placeholder="Search..."
//                 aria-label="Search dashboard"
//                 className="w-28 bg-transparent text-sm outline-none"
//               />
//             </div>

//             <button
//               type="button"
//               aria-label="Notifications"
//               className="rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-100"
//             >
//               <Bell size={19} />
//             </button>

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950 font-bold text-yellow-400">
//               A
//             </div>
//           </div>
//         </header>

//         {/* Welcome Banner */}
//         <section className="mb-8 rounded-2xl bg-gray-950 p-6 text-white sm:p-8">
//           <div className="flex flex-wrap items-center justify-between gap-5">
//             <div>
//               <p className="text-sm font-medium text-yellow-400">
//                 ADMINISTRATOR WORKSPACE
//               </p>

//               <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
//                 Welcome to EduFlow!
//               </h3>

//               <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300">
//                 Manage accounts, student information, attendance and
//                 institutional operations from one place.
//               </p>
//             </div>

//             <Link
//               href="/admin/users/create"
//               className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-gray-950 transition hover:bg-yellow-300"
//             >
//               <UserPlus size={19} />
//               Create Account
//             </Link>
//           </div>
//         </section>

//         {/* Statistics */}
//         <section className="mb-8">
//           <div className="mb-4 flex items-center justify-between">
//             <h3 className="text-lg font-bold">Institution Overview</h3>
//             <span className="text-xs text-gray-500">Sample data</span>
//           </div>

//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//             {stats.map((stat) => {
//               const Icon = stat.icon;

//               return (
//                 <div
//                   key={stat.title}
//                   className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
//                       <Icon size={22} />
//                     </div>

//                     <ArrowUpRight size={18} className="text-gray-400" />
//                   </div>

//                   <p className="mt-5 text-sm font-medium text-gray-500">
//                     {stat.title}
//                   </p>

//                   <p className="mt-2 text-3xl font-extrabold">
//                     {stat.value}
//                   </p>

//                   <p className="mt-2 text-xs text-gray-500">
//                     {stat.detail}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </section>

//         {/* Recent Activity and Quick Actions */}
//         <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
//           <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-2">
//             <div className="mb-5 flex items-center justify-between">
//               <h3 className="font-bold">Recent Activity</h3>
//               <span className="text-xs text-gray-500">Preview</span>
//             </div>

//             <div className="space-y-5">
//               {activities.map((activity, index) => (
//                 <div
//                   key={activity.title}
//                   className="flex items-start gap-4"
//                 >
//                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800">
//                     {index === 0 ? (
//                       <GraduationCap size={20} />
//                     ) : index === 1 ? (
//                       <CalendarCheck size={20} />
//                     ) : (
//                       <Wallet size={20} />
//                     )}
//                   </div>

//                   <div className="min-w-0 flex-1">
//                     <p className="text-sm font-semibold">
//                       {activity.title}
//                     </p>

//                     <p className="mt-1 text-xs text-gray-500">
//                       {activity.detail}
//                     </p>
//                   </div>

//                   <span className="shrink-0 text-xs text-gray-400">
//                     {activity.time}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6">
//             <h3 className="mb-5 font-bold">Quick Actions</h3>

//             <div className="space-y-3">
//               <Link
//                 href="/admin/users/create"
//                 className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
//               >
//                 <UserPlus size={20} className="shrink-0 text-yellow-700" />
//                 Create User Account
//               </Link>

//               <Link
//                 href="/admin/users"
//                 className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
//               >
//                 <Users size={20} className="shrink-0 text-yellow-700" />
//                 Manage Users
//               </Link>

//               <Link
//                 href="/students"
//                 className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
//               >
//                 <GraduationCap
//                   size={20}
//                   className="shrink-0 text-yellow-700"
//                 />
//                 Student Information
//               </Link>
//             </div>
//           </div>
//         </section>

//         <footer className="mt-8 text-center text-xs text-gray-400">
//           EduFlow ERP · Admin Dashboard · Frontend preview
//         </footer>
//       </main>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
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

const stats = [
  {
    title: "Total Students",
    value: "1,248",
    detail: "Registered students",
    icon: GraduationCap,
    href: "/students",
  },
  {
    title: "Total Teachers",
    value: "86",
    detail: "Teaching staff",
    icon: Users,
    href: "/teachers",
  },
  {
    title: "Total Staff",
    value: "42",
    detail: "Institution staff",
    icon: UserRoundCheck,
    href: "/admin/users",
  },
  {
    title: "Fee Collection",
    value: "₹8.4L",
    detail: "Sample collection",
    icon: Wallet,
    href: "/fees",
  },
];

const modules = [
  {
    title: "Student Management",
    description: "Admissions, student profiles and records",
    icon: GraduationCap,
    href: "/students",
  },
  {
    title: "Teacher Management",
    description: "Teacher profiles and staff information",
    icon: Users,
    href: "/teachers",
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
    href: "/classes",
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
    href: "/timetable",
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
    href: "/students",
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
      "edunexus-user",
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      <Sidebar />

      <main className="min-h-screen min-w-0 px-4 pb-8 pt-20 sm:px-6 md:ml-64 md:pt-6 lg:px-9">
        {/* Dashboard header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            {/* <p className="text-sm font-medium text-gray-500">
              Admin / Dashboard
            </p> */}

            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Dashboard 
            </h1>

            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays size={16} />
              {today}
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              aria-label="Notifications"
              className="relative rounded-xl border border-gray-200 bg-white p-3 transition hover:bg-yellow-50"
              onClick={() => router.push("/notifications")}
            >
              <Bell size={19} />
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
            <span className="rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-900">
              Preview data
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
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

