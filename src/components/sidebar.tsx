
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UserCircle,
  GraduationCap,
  CalendarCheck,
  Wallet,
  MessageSquare,
  ChartNoAxesCombined,
  Users,
  // Settings,
  ChevronDown,
  School,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

const modules = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    children: [],
  },
  {
  title: "My Profile",
  icon: UserCircle,
  href: "/profile",
  children: [],
},
  {
    title: "Admission",
    icon: GraduationCap,
    children: [
      { title: "Admission Dashboard", href: "/admission" },
      { title: "Applications", href: "/admission/applications" },
      { title: "New Admission", href: "/admission/create" },
      { title: "Merit List", href: "/admission/merit-list" },
    ],
  },
  {
    title: "Attendance",
    icon: CalendarCheck,
    children: [
  { title: "Attendance Dashboard", href: "/attendance" },
  { title: "View Attendance", href: "/attendance/view" },
  { title: "Mark Attendance", href: "/attendance/mark" },
  { title: "Attendance Reports", href: "/attendance/reports" },
  { title: "Leave Management", href: "/attendance/leaves" },
],
  },
  {
    title: "Fees & Finance",
    icon: Wallet,
    children: [
      { title: "Finance Dashboard", href: "/fees" },
      // { title: "Fee Collection", href: "/fees/collection" },
      { title: "Fee Structure", href: "/fees/structure" },
      { title: "Pending Dues", href: "/fees/dues" },
      { title: "Receipts", href: "/fees/receipts" },
      // { title: "Scholarships", href: "/fees/scholarships" },
    ],
  },
  {
    title: "Communication Center",
    icon: MessageSquare,
    children: [
      { title: "Announcements", href: "/communication" },
      { title: "Messages", href: "/communication/messages" },
      { title: "Communication History", href: "/communication/history" },
    ],
  },
  {
    title: "Report & Analysis",
    icon: ChartNoAxesCombined,
    children: [
      { title: "Reports Dashboard", href: "/reports" },
      { title: "Admission Reports", href: "/reports/admissions" },
      { title: "Attendance Reports", href: "/reports/attendance" },
      { title: "Fee Reports", href: "/reports/fees" },
      { title: "Academic Performance", href: "/reports/academic" },
    ],
  },
  {
    title: "Student Information",
    icon: Users,
    children: [
      { title: "All Students", href: "/students" },
     
      { title: "Classes & Sections", href: "/students/classes" },
    ],
  },
  // {
  //   title: "User Management",
  //   icon: ShieldCheck,
  //   children: [
  //     { title: "All Accounts", href: "/admin/users" },
  //     { title: "Create Account", href: "/admin/users/create" },
  //   ],
  // },
  // {
  //   title: "Settings",
  //   icon: Settings,
  //   children: [
  //     { title: "Institution Settings", href: "/settings" },
  //     { title: "Academic Year", href: "/settings/academic-year" },
  //     { title: "Attendance Rules", href: "/settings/attendance" },
  //     { title: "Fee Rules", href: "/settings/fees" },
  //   ],
  // },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState<string | null>(null);

  const isActive = (href: string) => pathname === href;
  const hasActiveChild = (item: (typeof modules)[number]) =>
    item.children.some(
      (child) =>
        pathname === child.href || pathname.startsWith(child.href + "/")
    );

  const sidebarContent = (
    <>
      <Link
        href="/admin"
        onClick={() => setMobileOpen(false)}
        className="mb-7 flex items-center gap-3 px-2"
      >
        <div className="rounded-xl bg-white p-2.5">
          <School size={25} className="text-yellow-500 " />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-950">Edu <span className="text-yellow-400">Flow</span></h1>
          <p className="text-[10px] font-bold tracking-[2px] text-gray-800">
            ERP MANAGEMENT
          </p>
        </div>
      </Link>

      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[1.5px] text-gray-700">
        Main Menu
      </p>

      <nav className="flex flex-col gap-1.5">
        {modules.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href || "") || hasActiveChild(item);
          const isOpen =
            manualOpen === item.title ||
            (manualOpen === null && hasActiveChild(item));

          if (item.href) {
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive(item.href)
                    ? "bg-yellow-300 text-black"
                    : "text-black hover:bg-yellow-300"
                }`}
              >
                <Icon size={19} />
                <span>{item.title}</span>
              </Link>
            );
          }

          return (
            <div key={item.title}>
              <button
                type="button"
                onClick={() => setManualOpen(isOpen ? "__closed__" : item.title)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? " text-white"
                    : "text-black hover:bg-yellow-200"
                }`}
              >
                <Icon size={19} />
                <span className="flex-1">{item.title}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="ml-5 mt-1 space-y-1 border-l-2 border-yellow-500 pl-3">
                  {item.children.map((child) => {
                    const childActive = isActive(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                          childActive
                            ? "bg-gray-950 text-yellow-400"
                            : "text-gray-800 hover:bg-yellow-300"
                        }`}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

       </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl border border-gray-200 bg-yellow-400 p-3 text-gray-950 shadow-md md:hidden"
      >
        <Menu size={21} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-white p-5 shadow-lg transition-transform duration-200 md:w-64 md:translate-x-0 md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex justify-end md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 hover:bg-yellow-300"
          >
            <X size={21} />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
