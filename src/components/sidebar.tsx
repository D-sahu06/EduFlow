// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useState } from "react";
// import {
//   LayoutDashboard,
//   UserCircle,
//   GraduationCap,
//   CalendarCheck,
//   Wallet,
//   MessageSquare,
//   ChartNoAxesCombined,
//   Users,
//   // Settings,
//   ChevronDown,
//   ClipboardList,
//   School,
//   Menu,
//   X,
// } from "lucide-react";

// const modules = [
//   {
//     title: "Dashboard",
//     icon: LayoutDashboard,
//     href: "/admin",
//     children: [],
//   },
//   {
//   title: "My Profile",
//   icon: UserCircle,
//   href: "/profile",
//   children: [],
// },
//   {
//     title: "Admission",
//     icon: GraduationCap,
//     children: [
//       { title: "Admission Dashboard", href: "/admission" },
//       { title: "Applications", href: "/admission/applications" },
//       { title: "New Admission", href: "/admission/new" },
//       { title: "Merit List", href: "/admission/merit-list" },
//     ],
//   },
//   {
//     title: "Attendance",
//     icon: CalendarCheck,
//     children: [
//   { title: "Attendance Dashboard", href: "/attendance/" },
//   { title: "View Attendance", href: "/attendance/view" },
//   { title: "Mark Attendance", href: "/attendance/mark" },
//   { title: "Attendance Reports", href: "/attendance/reports" },
//   { title: "Leave Management", href: "/attendance/leaves" },
// ],
//   },
//   {
//     title: "Fees & Finance",
//     icon: Wallet,
//     children: [
//       { title: "Finance Dashboard", href: "/fees" },
//       { title: "Fee Structure", href: "/fees/structure" },
//       { title: "Pending Dues", href: "/fees/dues" },
//       { title: "Receipts", href: "/fees/receipts" },
      
//     ],
//   },
//   {
//     title: "Communication Center",
//     icon: MessageSquare,
//     children: [
//       { title: "Announcements", href: "/communication" },
//       { title: "Messages", href: "/communication/messages" },
//       { title: "Communication History", href: "/communication/history" },
//     ],
//   },
//   {
//     title: "Report & Analysis",
//     icon: ChartNoAxesCombined,
//     children: [
//       { title: "Reports Dashboard", href: "/reports" },
//       { title: "Admission Reports", href: "/reports/admissions" },
//       { title: "Attendance Reports", href: "/reports/attendance" },
//       { title: "Fee Reports", href: "/reports/fees" },
//       { title: "Academic Performance", href: "/reports/academic" },
//     ],
//   },
//   {
//     title: "Student Information",
//     icon: Users,
//     children: [
//       { title: "All Students", href: "/students/all" },
     
//       { title: "Classes & Sections", href: "/students/classes" },
//     ],
//   },
//   {
//   title: "Examination & Results",
//   icon: ClipboardList,
//   children: [
//     { title: "Examination Dashboard", href: "/examinations" },
//     { title: "Exam Management", href: "/examinations/management" },
//     { title: "Result Processing", href: "/examinations/result-processing" },
//     { title: "Result Dashboard", href: "/examinations/result-dashboard" },
//     { title: "Report Card", href: "/examinations/report-card" },
//     { title: "Exam Reports", href: "/examinations/reports" },
//   ],
// },
// {
//   title: "Student Management",
//   icon: Users,
//   children: [
//     { title: "Student Dashboard", href: "/students-management" },
//     { title: "All Students", href: "/students-management/all" },
//     { title: "Student Promotion", href: "/students-management/promotion" },
//     { title: "Student Documents", href: "/students-management/documents" },
//   ],
// },
// {
//   title: "Teacher Management",
//   icon: GraduationCap,
//   children: [
//     {
//       title: "Teacher Dashboard",
//       href: "/teacher-management",
//     },
//     { title: "All Teachers", href: "/teacher-management/all-teachers" },
//     {
//       title: "Assign Subjects",
//       href: "/teacher-management/assign-subjects",
//     },
//     {
//       title: "Leave Management",
//       href: "/teacher-management/leave-management",
//     },
//     {
//       title: "Teacher Reports",
//       href: "/teacher-management/reports",
//     },
    
//   ],
// }
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [manualOpen, setManualOpen] = useState<string | null>(null);

//   const isActive = (href: string) => pathname === href;
//   const hasActiveChild = (item: (typeof modules)[number]) =>
//     item.children.some(
//       (child) =>
//         pathname === child.href || pathname.startsWith(child.href + "/")
//     );

//   const sidebarContent = (
//     <>
//       <Link
//         href="/admin"
//         onClick={() => setMobileOpen(false)}
//         className="mb-7 flex items-center gap-3 px-2"
//       >
//         <div className="rounded-xl bg-white p-2.5">
//           <School size={25} className="text-yellow-300 " />
//         </div>
//         <div>
//           <h1 className="text-xl font-extrabold text-gray-950">Edu <span className="text-yellow-300">Flow</span></h1>
//           <p className="text-[10px] font-bold tracking-[2px] text-gray-800">
//             ERP MANAGEMENT
//           </p>
//         </div>
//       </Link>

//       <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[1.5px] text-gray-700">
//         Main Menu
//       </p>

//       <nav className="flex flex-col gap-1.5">
//         {modules.map((item) => {
//           const Icon = item.icon;
//           const active = isActive(item.href || "") || hasActiveChild(item);
//           const isOpen =
//             manualOpen === item.title ||
//             (manualOpen === null && hasActiveChild(item));

//           if (item.href) {
//             return (
//               <Link
//                 key={item.title}
//                 href={item.href}
//                 onClick={() => setMobileOpen(false)}
//                 className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
//                   isActive(item.href)
//                     ? "bg-yellow-300 text-black"
//                     : "text-black hover:bg-yellow-300"
//                 }`}
//               >
//                 <Icon size={19} />
//                 <span>{item.title}</span>
//               </Link>
//             );
//           }

//           return (
//             <div key={item.title}>
//               <button
//                 type="button"
//                 onClick={() => setManualOpen(isOpen ? "__closed__" : item.title)}
//                 className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
//                   active
//                     ? " text-white"
//                     : "text-black hover:bg-yellow-300"
//                 }`}
//               >
//                 <Icon size={19} />
//                 <span className="flex-1">{item.title}</span>
//                 <ChevronDown
//                   size={16}
//                   className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
//                 />
//               </button>

//               {isOpen && (
//                 <div className="ml-5 mt-1 space-y-1 border-l-2 border-yellow-300 pl-3">
//                   {item.children.map((child) => {
//                     const childActive =
//                     pathname === child.href ||
//                     (child.href !== "/examinations" &&
//                      pathname.startsWith(child.href + "/"));

//                     return (
//                       <Link
//                         key={child.href}
//                         href={child.href}
//                         onClick={() => setMobileOpen(false)}
//                         className={`block rounded-lg px-3 py-2.5 text-xs font-medium transition ${
//                           childActive
//                             ? "bg-gray-950 text-yellow-300"
//                             : "text-gray-800 hover:bg-yellow-300"
//                         }`}
//                       >
//                         {child.title}
//                       </Link>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </nav>

//        </>
//   );

//   return (
//     <>
//       <button
//         type="button"
//         aria-label="Open navigation"
//         onClick={() => setMobileOpen(true)}
//         className="fixed left-4 top-4 z-40 rounded-xl border border-gray-200 bg-yellow-300 p-3 text-gray-950 shadow-md md:hidden"
//       >
//         <Menu size={21} />
//       </button>

//       {mobileOpen && (
//         <button
//           type="button"
//           aria-label="Close navigation overlay"
//           onClick={() => setMobileOpen(false)}
//           className="fixed inset-0 z-40 bg-black/40 md:hidden"
//         />
//       )}

//       <aside
//         className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-white p-5 shadow-lg transition-transform duration-200 md:w-64 md:translate-x-0 md:shadow-none ${
//           mobileOpen ? "translate-x-0" : "-translate-x-full"
//         }`}
//       >
//         <div className="mb-4 flex justify-end md:hidden">
//           <button
//             type="button"
//             aria-label="Close navigation"
//             onClick={() => setMobileOpen(false)}
//             className="rounded-lg p-2 hover:bg-yellow-300"
//           >
//             <X size={21} />
//           </button>
//         </div>
//         {sidebarContent}
//       </aside>
//     </>
//   );
// }


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UserCircle,
  GraduationCap,
  CalendarCheck,
  Wallet,
  MessageSquare,
  Users,
  ChevronDown,
  ClipboardList,
  School,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

import type { Role } from "@/types/permission";
import {
  hasModuleAccess,
  hasFeatureAccess,
} from "@/lib/permissions";

type SidebarChild = {
  title: string;
  href: string;
  feature: string;
};

type SidebarModule = {
  title: string;
  icon: React.ElementType;
  href?: string;
  permissionModule: string;
  feature?: string;
  children: SidebarChild[];
};

const modules: SidebarModule[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    permissionModule: "dashboard",
    feature: "overview",
    children: [],
  },
  {
    title: "My Profile",
    icon: UserCircle,
    href: "/profile",
    permissionModule: "profile",
    feature: "viewProfile",
    children: [],
  },
  {
    title: "Admission",
    icon: GraduationCap,
    permissionModule: "admission",
    children: [
      { title: "Admission Dashboard", href: "/admission", feature: "admissionDashboard" },
      { title: "Applications", href: "/admission/applications", feature: "applications" },
      { title: "New Admission", href: "/admission/new", feature: "newAdmission" },
      { title: "Merit List", href: "/admission/merit-list", feature: "meritList" },
    ],
  },
  {
    title: "Attendance",
    icon: CalendarCheck,
    permissionModule: "attendance",
    children: [
      { title: "Attendance Dashboard", href: "/attendance", feature: "attendanceDashboard" },
      { title: "View Attendance", href: "/attendance/view", feature: "viewAttendance" },
      { title: "Mark Attendance", href: "/attendance/mark", feature: "markAttendance" },
      { title: "Attendance Reports", href: "/attendance/reports", feature: "attendanceReports" },
      { title: "Leave Management", href: "/attendance/leaves", feature: "leaveManagement" },
    ],
  },
  {
    title: "Fees & Finance",
    icon: Wallet,
    permissionModule: "finance",
    children: [
      { title: "Finance Dashboard", href: "/fees", feature: "financeDashboard" },
      { title: "Fee Structure", href: "/fees/structure", feature: "feesStructure" },
      { title: "Pending Dues", href: "/fees/dues", feature: "pendingDues" },
      { title: "Receipts", href: "/fees/receipts", feature: "receipts" },
      { title: "Finance Reports", href: "/fees/reports", feature: "financeReports" },
    ],
  },
  {
    title: "Communication Center",
    icon: MessageSquare,
    permissionModule: "communication",
    children: [
      { title: "Announcements", href: "/communication", feature: "announcements" },
      { title: "Messages", href: "/communication/messages", feature: "messages" },
      { title: "Notifications", href: "/communication/notifications", feature: "notifications" },
      { title: "Events & Calendar", href: "/communication/events", feature: "eventsCalendar" },
    ],
  },
  {
    title: "Student Information",
    icon: Users,
    permissionModule: "students",
    children: [
      { title: "All Students", href: "/students/all", feature: "allStudents" },
    ],
  },
  {
    title: "Examination & Results",
    icon: ClipboardList,
    permissionModule: "examinations",
    children: [
      { title: "Examination Dashboard", href: "/examinations", feature: "examinationDashboard" },
      { title: "Exam Management", href: "/examinations/management", feature: "examManagement" },
      { title: "Result Processing", href: "/examinations/result-processing", feature: "resultProcessing" },
      { title: "Result Dashboard", href: "/examinations/result-dashboard", feature: "resultDashboard" },
      { title: "Report Card", href: "/examinations/report-card", feature: "reportCard" },
      { title: "Exam Reports", href: "/examinations/reports", feature: "examReports" },
    ],
  },
  {
    title: "Student Management",
    icon: Users,
    permissionModule: "students",
    children: [
      { title: "Student Dashboard", href: "/students-management", feature: "studentDashboard" },
      { title: "All Students", href: "/students-management/all", feature: "allStudents" },
      { title: "Student Promotion", href: "/students-management/promotion", feature: "studentPromotion" },
      { title: "Student Documents", href: "/students-management/documents", feature: "studentDocuments" },
    ],
  },
  {
    title: "Teacher Management",
    icon: GraduationCap,
    permissionModule: "teachers",
    children: [
      { title: "Teacher Dashboard", href: "/teacher-management", feature: "teacherDashboard" },
      { title: "All Teachers", href: "/teacher-management/all-teachers", feature: "allTeachers" },
      { title: "Assign Subjects", href: "/teacher-management/assign-subjects", feature: "assignSubjects" },
      { title: "Leave Management", href: "/teacher-management/leave-management", feature: "leaveManagement" },
      { title: "Teacher Reports", href: "/teacher-management/reports", feature: "teacherReports" },
    ],
  },
  // {
  //   title: "Role & Permission Management",
  //   icon: ShieldCheck,
  //   permissionModule: "roleManagement",
  //   children: [
  //     { title: "Roles", href: "/role-management/roles", feature: "roles" },
  //     { title: "Permissions", href: "/role-management/permissions", feature: "permissions" },
  //     { title: "User Role Assignment", href: "/role-management/assignments", feature: "userRoleAssignment" },
  //     { title: "Access Logs", href: "/role-management/logs", feature: "accessLogs" },
  //   ],
  // },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>("ADMIN");

  // Read the selected demo role after the component mounts.
  useEffect(() => {
    const savedRole = localStorage.getItem("eduflow-demo-role");

    const validRoles: Role[] = [
      "SUPER_ADMIN",
      "ADMIN",
      "PRINCIPAL",
      "HOD",
      "TEACHER",
      "ACCOUNTANT",
      "STUDENT",
    ];

    if (savedRole && validRoles.includes(savedRole as Role)) {
      setCurrentRole(savedRole as Role);
    }
  }, []);

  const visibleModules = modules
    .map((item) => {
      if (!hasModuleAccess(currentRole, item.permissionModule)) {
        return null;
      }

      if (item.href) {
        if (
          !item.feature ||
          !hasFeatureAccess(
            currentRole,
            item.permissionModule,
            item.feature,
            "view"
          )
        ) {
          return null;
        }

        return item;
      }

      const visibleChildren = item.children.filter((child) =>
        hasFeatureAccess(
          currentRole,
          item.permissionModule,
          child.feature,
          "view"
        )
      );

      if (visibleChildren.length === 0) {
        return null;
      }

      return {
        ...item,
        children: visibleChildren,
      };
    })
    .filter((item): item is SidebarModule => item !== null);

  const isActive = (href: string) => pathname === href;

  const hasActiveChild = (item: SidebarModule) =>
    item.children.some(
      (child) =>
        pathname === child.href ||
        pathname.startsWith(child.href + "/")
    );

  const sidebarContent = (
    <>
      <Link
        href="/admin"
        onClick={() => setMobileOpen(false)}
        className="mb-7 flex items-center gap-3 px-2"
      >
        <div className="rounded-xl bg-white p-2.5">
          <School size={25} className="text-yellow-300" />
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-gray-950">
            Edu <span className="text-yellow-300">Flow</span>
          </h1>
          <p className="text-[10px] font-bold tracking-[2px] text-gray-800">
            ERP MANAGEMENT
          </p>
        </div>
      </Link>

      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[1.5px] text-gray-700">
        Main Menu
      </p>

      <nav className="flex flex-col gap-1.5">
        {visibleModules.map((item) => {
          const Icon = item.icon;

          const active =
            (item.href ? isActive(item.href) : false) ||
            hasActiveChild(item);

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
                onClick={() =>
                  setManualOpen(isOpen ? "__closed__" : item.title)
                }
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "text-black"
                    : "text-black hover:bg-yellow-300"
                }`}
              >
                <Icon size={19} />
                <span className="flex-1">{item.title}</span>

                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="ml-5 mt-1 space-y-1 border-l-2 border-yellow-300 pl-3">
                  {item.children.map((child) => {
                    const childActive =
                      pathname === child.href ||
                      pathname.startsWith(child.href + "/");

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                          childActive
                            ? "bg-gray-950 text-yellow-300"
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
        className="fixed left-4 top-4 z-40 rounded-xl border border-gray-200 bg-yellow-300 p-3 text-gray-950 shadow-md md:hidden"
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
