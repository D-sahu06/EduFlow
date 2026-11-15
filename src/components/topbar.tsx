"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  X,
  UserRound,
  LogOut,
  ChevronRight,
  Loader2,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUnreadNotifications } from "@/lib/notifications";
import { hasFeatureAccess } from "@/lib/permissions";
import { useSidebar } from "@/lib/sidebar";
import type { Role } from "@/types/permission";

type SearchResultItem = {
  id: string;
  title: string;
  category:
    | "Student"
    | "Teacher"
    | "User"
    | "Admission"
    | "Announcement"
    | "Notification"
    | "Message"
    | "Attendance"
    | "Fee"
    | "Exam"
    | "Page";
  subtitle?: string;
  url: string;
};

type QuickNavItem = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  module: string;
  feature: string;
  keywords: string;
};

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "nav-profile", title: "My Profile", subtitle: "Account settings & personal info", url: "/profile", module: "profile", feature: "viewProfile", keywords: "profile account password details" },
  { id: "nav-users", title: "All Users", subtitle: "User management & roles", url: "/admin/users", module: "roleManagement", feature: "roles", keywords: "users roles accounts delete reset password" },
  { id: "nav-users-create", title: "Create User", subtitle: "Add new staff or student user", url: "/admin/users/create", module: "roleManagement", feature: "userRoleAssignment", keywords: "add user register create account" },
  { id: "nav-admission", title: "Admission Dashboard", subtitle: "Overview of admission cycle", url: "/admission", module: "admission", feature: "admissionDashboard", keywords: "admission applicants dashboard" },
  { id: "nav-admission-apps", title: "Admission Applications", subtitle: "Review & approve applicants", url: "/admission/applications", module: "admission", feature: "applications", keywords: "applications approve reject pending" },
  { id: "nav-admission-new", title: "New Admission", subtitle: "Register new student admission", url: "/admission/new", module: "admission", feature: "newAdmission", keywords: "new admission enroll apply" },
  { id: "nav-merit", title: "Merit List", subtitle: "Shortlisted admission candidates", url: "/admission/merit-list", module: "admission", feature: "meritList", keywords: "merit list selection" },
  { id: "nav-att-dash", title: "Attendance Dashboard", subtitle: "Daily attendance overview", url: "/attendance", module: "attendance", feature: "attendanceDashboard", keywords: "attendance overview" },
  { id: "nav-att-view", title: "View Attendance", subtitle: "Student & class attendance records", url: "/attendance/view", module: "attendance", feature: "viewAttendance", keywords: "view attendance history" },
  { id: "nav-att-mark", title: "Mark Attendance", subtitle: "Take class attendance", url: "/attendance/mark", module: "attendance", feature: "markAttendance", keywords: "mark take present absent attendance" },
  { id: "nav-att-rep", title: "Attendance Reports", subtitle: "Class & monthly attendance reports", url: "/attendance/reports", module: "attendance", feature: "attendanceReports", keywords: "attendance reports export" },
  { id: "nav-att-leave", title: "Leave Management", subtitle: "Student & staff leave requests", url: "/attendance/leaves", module: "attendance", feature: "leaveManagement", keywords: "leave applications requests" },
  { id: "nav-fee-dash", title: "Finance Dashboard", subtitle: "Collection & dues overview", url: "/fees", module: "finance", feature: "financeDashboard", keywords: "fees finance dashboard collection" },
  { id: "nav-fee-struct", title: "Fee Structure", subtitle: "Course & class fee plans", url: "/fees/structure", module: "finance", feature: "feesStructure", keywords: "fee structure tuition plans" },
  { id: "nav-fee-dues", title: "Pending Dues", subtitle: "Outstanding fee balances", url: "/fees/dues", module: "finance", feature: "pendingDues", keywords: "pending dues overdue balance" },
  { id: "nav-fee-receipts", title: "Fee Receipts & Payments", subtitle: "Record payments & print receipts", url: "/fees/receipts", module: "finance", feature: "receipts", keywords: "receipts payment cash upi fee pay" },
  { id: "nav-fee-reports", title: "Finance Reports", subtitle: "Revenue & fee reports", url: "/reports/fees", module: "finance", feature: "financeReports", keywords: "finance reports revenue" },
  { id: "nav-comm-ann", title: "Announcements", subtitle: "Campus notices & circulars", url: "/communication/announcements", module: "communication", feature: "announcements", keywords: "announcements notices circulars" },
  { id: "nav-comm-msg", title: "Messages", subtitle: "Direct inbox & sent messages", url: "/communication/messages", module: "communication", feature: "messages", keywords: "messages inbox chat mail" },
  { id: "nav-comm-notif", title: "Notification Center", subtitle: "All system alerts & updates", url: "/communication/notification", module: "communication", feature: "notifications", keywords: "notifications alerts bell updates" },
  { id: "nav-exam-dash", title: "Examination Dashboard", subtitle: "Upcoming & recent exams", url: "/examinations", module: "examinations", feature: "examinationDashboard", keywords: "examination exam dashboard" },
  { id: "nav-exam-mgmt", title: "Exam Management", subtitle: "Schedule & manage exams", url: "/examinations/management", module: "examinations", feature: "examManagement", keywords: "exam management schedule" },
  { id: "nav-exam-proc", title: "Result Processing", subtitle: "Enter marks & process results", url: "/examinations/result-processing", module: "examinations", feature: "resultProcessing", keywords: "result processing marks entry grades" },
  { id: "nav-exam-res", title: "Result Dashboard", subtitle: "View published exam results", url: "/examinations/result-dashboard", module: "examinations", feature: "resultDashboard", keywords: "results dashboard marks grades" },
  { id: "nav-exam-card", title: "Report Card", subtitle: "Student report cards & transcripts", url: "/examinations/report-card", module: "examinations", feature: "reportCard", keywords: "report card marksheet" },
  { id: "nav-stu-all", title: "All Students", subtitle: "Student directory & profiles", url: "/students-management/all", module: "students", feature: "allStudents", keywords: "students directory list roll number" },
  { id: "nav-stu-promo", title: "Student Promotion", subtitle: "Promote students to next class", url: "/students-management/promotion", module: "students", feature: "studentPromotion", keywords: "student promotion upgrade" },
  { id: "nav-stu-docs", title: "Student Documents", subtitle: "Verify student documents", url: "/students-management/documents", module: "students", feature: "studentDocuments", keywords: "documents certificates verification" },
  { id: "nav-tch-all", title: "All Teachers", subtitle: "Faculty & staff directory", url: "/teacher-management/all-teachers", module: "teachers", feature: "allTeachers", keywords: "teachers faculty staff directory" },
  { id: "nav-tch-subj", title: "Assign Subjects", subtitle: "Assign subjects & classes to teachers", url: "/teacher-management/assign-subjects", module: "teachers", feature: "assignSubjects", keywords: "assign subjects teacher classes" },
  { id: "nav-tch-leave", title: "Teacher Leave Management", subtitle: "Faculty leave approvals", url: "/teacher-management/leave-management", module: "teachers", feature: "leaveManagement", keywords: "teacher leave management" },
];

type User = {
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

export default function Topbar() {
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();

  const [user, setUser] = useState<User>({
    name: "User",
    role: "Admin",
  });

  const [accountOpen, setAccountOpen] = useState(false);
  const [role, setRole] = useState("");
  const [isDark, setIsDark] = useState(false);
  const { sidebarOpen, toggleSidebar } = useSidebar();

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedRole = (role || user.role || "").toUpperCase() as Role;

  const quickPageResults = useMemo<SearchResultItem[]>(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];

    return QUICK_NAV_ITEMS.filter((item) => {
      const allowed = normalizedRole
        ? hasFeatureAccess(normalizedRole, item.module, item.feature, "view")
        : true;
      if (!allowed) return false;

      const haystack = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
      return haystack.includes(trimmed);
    })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        category: "Page",
        subtitle: item.subtitle,
        url: item.url,
      }));
  }, [searchQuery, normalizedRole]);

  const combinedResults = useMemo<SearchResultItem[]>(() => {
    const seen = new Set<string>();
    const merged: SearchResultItem[] = [];
    for (const item of [...searchResults, ...quickPageResults]) {
      const key = `${item.category}-${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  }, [searchResults, quickPageResults]);

  // Debounced search API request
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError("");
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError("");
    setActiveIndex(0);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ success: boolean; results: SearchResultItem[] }>(
          `/search?q=${encodeURIComponent(trimmed)}`
        );
        if (cancelled) return;
        setSearchResults(Array.isArray(res?.results) ? res.results : []);
        setSearchOpen(true);
      } catch (err: any) {
        if (cancelled) return;
        setSearchError(err?.message || "Failed to fetch search results.");
        setSearchResults([]);
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("eduflow-theme");
      const isDarkMode =
        savedTheme === "dark" ||
        (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        setIsDark(true);
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        setIsDark(false);
      }
    };

    syncTheme();
    window.addEventListener("eduflow-theme-change", syncTheme);
    return () => window.removeEventListener("eduflow-theme-change", syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("eduflow-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("eduflow-theme", "light");
    }
    window.dispatchEvent(new Event("eduflow-theme-change"));
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser =
          localStorage.getItem("eduflow-user") ||
          localStorage.getItem("edunexus-user") ||
          localStorage.getItem("currentUser") ||
          localStorage.getItem("user");

        if (savedUser) {
          const parsed = JSON.parse(savedUser) as User;
          setUser(parsed);
          if (parsed.role) setRole(parsed.role.toUpperCase());
        }

        const token =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        if (token) {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            const liveUser = data.user || data.data;
            if (liveUser) {
              setUser(liveUser);
              if (liveUser.role) setRole(liveUser.role.toUpperCase());
              localStorage.setItem("eduflow-user", JSON.stringify(liveUser));
            }
          }
        }
      } catch (error) {
        console.error("Unable to load user details:", error);
      }
    };

    loadUser();
    window.addEventListener("eduflow-user-change", loadUser);
    return () => window.removeEventListener("eduflow-user-change", loadUser);
  }, []);

  const displayName =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    "User";

  const profileImage = user.profileImage || user.avatar;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleManageAccount = () => {
    setAccountOpen(false);
    router.push("/profile");
  };

  const handleLogout = () => {
    [
      "eduflow-user",
      "edunexus-user",
      "currentUser",
      "user",
      "token",
      "access_token",
      "eduflow-demo-auth",
      "eduflow-demo-role",
    ].forEach((key) => localStorage.removeItem(key));

    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "auth-token=; path=/; max-age=0";

    setAccountOpen(false);
    router.push("/");
  };

  const canCreateUser =
    role === "SUPER_ADMIN" || role === "ADMIN" || role === "PRINCIPAL";

  return (
    <>
      <header className="relative z-30 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 md:px-8">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 shadow-xs transition-all duration-200 hover:border-yellow-400 hover:bg-yellow-50 hover:text-gray-950 active:scale-95 cursor-pointer dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-yellow-400 dark:hover:bg-gray-700"
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
              className="transition-transform duration-200 group-hover:scale-105"
            >
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="4" y1="12" x2="21" y2="12" />
              <line x1="7" y1="18" x2="18" y2="18" />
            </svg>
          </button>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 sm:text-lg truncate">
              Welcome to EduFlow
            </h2>
            <p className="hidden text-xs text-gray-500 sm:block sm:text-sm">
              Education management made simple
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {canCreateUser && (
            <button
              onClick={() => {
                router.push("/admin/users/create");
              }}
              title="Create User"
              className="shrink-0 rounded-lg flex items-center gap-1.5 sm:gap-2 bg-yellow-300 px-2.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold transition-colors hover:bg-yellow-400 cursor-pointer shadow-2xs"
            >
              <UserPlus size={17} />
              <span className="hidden sm:inline">Create User</span>
            </button>
          )}

          <div ref={searchContainerRef} className="relative hidden sm:block">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition focus-within:border-yellow-400 focus-within:bg-white focus-within:shadow-sm">
              {isSearching ? (
                <Loader2 size={18} className="animate-spin text-yellow-500" />
              ) : (
                <Search size={18} className="text-gray-400" />
              )}

              <input
                ref={searchInputRef}
                type="text"
                aria-label="Global search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  setSearchOpen(val.trim().length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setSearchOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (!searchOpen && e.key !== "Escape") return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((prev) =>
                      combinedResults.length > 0 ? (prev + 1) % combinedResults.length : 0
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((prev) =>
                      combinedResults.length > 0
                        ? (prev - 1 + combinedResults.length) % combinedResults.length
                        : 0
                    );
                  } else if (e.key === "Enter" && combinedResults.length > 0) {
                    e.preventDefault();
                    const chosen = combinedResults[activeIndex] || combinedResults[0];
                    if (chosen) {
                      setSearchOpen(false);
                      setSearchQuery("");
                      router.push(chosen.url);
                    }
                  } else if (e.key === "Escape") {
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search anything..."
                className="w-40 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 md:w-56"
              />

              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchOpen(false);
                    searchInputRef.current?.focus();
                  }}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400">
                  /
                </kbd>
              )}
            </div>

            {/* Results Dropdown */}
            {searchOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl md:w-96">
                {isSearching && (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin text-yellow-500" />
                    Searching records...
                  </div>
                )}

                {searchError && combinedResults.length === 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                    <AlertCircle size={15} />
                    {searchError}
                  </div>
                )}

                {!isSearching && !searchError && combinedResults.length === 0 && (
                  <div className="py-6 text-center text-sm text-gray-500">
                    <p className="font-semibold text-gray-700">No records found</p>
                    <p className="mt-1 text-xs text-gray-400">
                      No matching records or pages found for &ldquo;{searchQuery}&rdquo; within your authorized scope.
                    </p>
                  </div>
                )}

                {combinedResults.length > 0 &&
                  combinedResults.map((item, idx) => {
                    let badgeClass = "bg-gray-100 text-gray-700 border-gray-200";
                    if (item.category === "Student") badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                    else if (item.category === "Teacher") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    else if (item.category === "User") badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                    else if (item.category === "Admission") badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                    else if (item.category === "Announcement") badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
                    else if (item.category === "Notification") badgeClass = "bg-yellow-50 text-yellow-800 border-yellow-200";
                    else if (item.category === "Message") badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
                    else if (item.category === "Attendance") badgeClass = "bg-cyan-50 text-cyan-800 border-cyan-200";
                    else if (item.category === "Fee") badgeClass = "bg-yellow-50 text-yellow-800 border-yellow-200";
                    else if (item.category === "Exam") badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    else if (item.category === "Page") badgeClass = "bg-orange-50 text-orange-700 border-orange-200";

                    const isHighlighted = idx === activeIndex;

                    return (
                      <button
                        key={`${item.category}-${item.id}`}
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          router.push(item.url);
                        }}
                        className={`flex w-full items-start justify-between gap-3 rounded-lg p-2.5 text-left transition cursor-pointer ${
                          isHighlighted ? "bg-yellow-50" : "hover:bg-yellow-50/60"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="truncate text-xs text-gray-500">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                        >
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-yellow-50 cursor-pointer"
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            type="button"
            onClick={() => {
              router.push("/communication/notification");
            }}
            aria-label={
              unreadCount > 0
                ? `Notifications (${unreadCount} unread)`
                : "Notifications"
            }
            className="relative rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-yellow-50 cursor-pointer"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold leading-none text-slate-900 ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          
                    {/* Logged-in user */}
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-label="Open account panel"
            aria-expanded={accountOpen}
            className="flex items-center gap-2 border-l border-gray-200 pl-3 text-left cursor-pointer"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-200 bg-yellow-100 font-bold text-gray-800">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || "U"
              )}
            </div>

            <div className="hidden sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-gray-900">
                {displayName}
              </p>
              <p className="text-xs capitalize text-gray-500">
                {role ? role.replace("_", " ").toLowerCase() : "user"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-gray-500 sm:block"
            />
          </button>
        </div>
      </header>

      {/* Dark backdrop */}
      {accountOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70"
          onClick={() => setAccountOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Right-side Account Panel */}
      <aside
        aria-label="Account panel"
        aria-hidden={!accountOpen}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-105 flex-col bg-white shadow-2xl transition-transform duration-300 ${
          accountOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Account
          </h2>

          <button
            type="button"
            onClick={() => setAccountOpen(false)}
            aria-label="Close account panel"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          >
            <X size={21} />
          </button>
        </div>

        {/* User details */}
        <div className="flex flex-col items-center px-6 pb-7 pt-8">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-green-50 bg-yellow-100 text-3xl font-bold text-gray-800">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={displayName}
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              initials || "U"
            )}
          </div>

          <h3 className="mt-4 max-w-full wrap-break-words text-center text-xl font-semibold text-gray-900">
            {displayName}
          </h3>

          <p className="mt-1 capitalize text-gray-500">
            {role ? role.replace("_", " ").toLowerCase() : "user"}
          </p>

          {user.email && (
            <p className="mt-2 max-w-full break-all text-sm text-gray-500">
              {user.email}
            </p>
          )}
        </div>

        <div className="mx-6 border-t border-gray-200" />

        {/* Manage Account */}
        <div className="flex-1 px-6 py-7">
          <button
            type="button"
            onClick={handleManageAccount}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-green-300 hover:bg-green-50 cursor-pointer"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
              <UserRound size={22} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-gray-900">
                Manage Account
              </span>
              <span className="mt-0.5 block text-sm text-gray-500">
                View and edit your profile
              </span>
            </span>

            <ChevronRight size={21} className="text-gray-500" />
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 border-t border-gray-200 p-6">
          <button
            type="button"
            onClick={() => setAccountOpen(false)}
            className="flex-1 rounded-lg border border-green-500 px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-green-50 cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 cursor-pointer"
          >
            <LogOut size={17} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
