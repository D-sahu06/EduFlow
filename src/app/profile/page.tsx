"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { useSidebar } from "@/lib/sidebar";
import { api } from "@/lib/api";

import {
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  Cake,
  Building2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  CalendarClock,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

type Profile = {
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  birthDate: string;
  phone: string;
  gender: string;
  status: string;
  maritalStatus: string;
  emergencyContact: string;
  emergencyRelation: string;
  emergencyName: string;
  address: string;
  profileImage: string;
  institution: string;
  role: string;
  department?: string;
  className?: string;
  rollNumber?: string;
  employeeId?: string;
};

const emptyProfile: Profile = {
  firstName: "",
  lastName: "",
  fullName: "",
  username: "",
  email: "",
  birthDate: "",
  phone: "",
  gender: "",
  status: "Active",
  maritalStatus: "",
  emergencyContact: "",
  emergencyRelation: "",
  emergencyName: "",
  address: "",
  profileImage: "",
  institution: "EduFlow Academy",
  role: "User",
};

export default function ProfilePage() {
  const { sidebarOpen } = useSidebar();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [role, setRole] = useState("Administrator");
  const [month, setMonth] = useState(new Date());
  const [today, setToday] = useState<Date | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, any>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    attendancePercentage: 0,
  });

  const fetchAttendance = async (currentMonth: Date) => {
    try {
      setAttendanceLoading(true);
      const m = currentMonth.getMonth() + 1;
      const y = currentMonth.getFullYear();

      const [recRes, statsRes] = await Promise.allSettled([
        api.get<{ success?: boolean; records?: any[] }>(`/attendance/self?month=${m}&year=${y}`),
        api.get<{ success?: boolean; stats?: any }>(`/attendance/self/stats`),
      ]);

      const records =
        recRes.status === "fulfilled" && recRes.value && Array.isArray(recRes.value.records)
          ? recRes.value.records
          : [];

      const map: Record<number, any> = {};
      records.forEach((r: any) => {
        if (!r.date) return;
        let dayNum: number | null = null;
        if (typeof r.date === "string" && r.date.includes("-")) {
          const parts = r.date.split("T")[0].split("-");
          if (parts.length === 3) {
            const docYear = parseInt(parts[0], 10);
            const docMonth = parseInt(parts[1], 10) - 1; // 0-indexed
            const docDay = parseInt(parts[2], 10);
            if (docYear === y && docMonth === currentMonth.getMonth()) {
              dayNum = docDay;
            }
          }
        }
        if (dayNum === null) {
          const d = new Date(r.date);
          if (d.getUTCFullYear() === y && d.getUTCMonth() === currentMonth.getMonth()) {
            dayNum = d.getUTCDate();
          } else if (d.getFullYear() === y && d.getMonth() === currentMonth.getMonth()) {
            dayNum = d.getDate();
          }
        }
        if (dayNum !== null) {
          map[dayNum] = r;
        }
      });
      setAttendanceRecords(map);

      if (statsRes.status === "fulfilled" && statsRes.value && statsRes.value.stats) {
        const s = statsRes.value.stats;
        setAttendanceStats({
          totalWorkingDays: s.totalWorkingDays || 0,
          presentDays: s.presentDays || 0,
          absentDays: s.absentDays || 0,
          lateDays: s.lateDays || 0,
          leaveDays: s.leaveDays || 0,
          attendancePercentage: s.attendancePercentage || 0,
        });
      }
    } catch {
      setAttendanceRecords({});
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      // 1. Check local cached user first
      const savedUser = localStorage.getItem("eduflow-user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const nameParts = (u.name || "").split(" ");
        setProfile((prev) => ({
          ...prev,
          firstName: u.firstName || nameParts[0] || "",
          lastName: u.lastName || nameParts.slice(1).join(" ") || "",
          fullName: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          username: u.username || "",
          email: u.email || "",
          phone: u.phone || "",
          role: u.role || "User",
          department: u.department || "",
          institution: u.institution || "EduFlow Academy",
        }));
        if (u.role) setRole(u.role.replace("_", " "));
      }

      // 2. Fetch live profile from MongoDB via verified JWT
      const res = await api.get("/users/profile");
      if (res && res.user) {
        const u = res.user;
        const nameParts = (u.name || "").split(" ");
        const liveProfile: Profile = {
          firstName: u.firstName || nameParts[0] || "",
          lastName: u.lastName || nameParts.slice(1).join(" ") || "",
          fullName: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          username: u.username || "",
          email: u.email || "",
          birthDate: u.birthDate ? u.birthDate.slice(0, 10) : u.dob ? u.dob.slice(0, 10) : "",
          phone: u.phone || "",
          gender: u.gender || "",
          status: u.status || "Active",
          maritalStatus: u.maritalStatus || "Unmarried",
          emergencyContact: u.emergencyContact || u.parentPhone || "",
          emergencyRelation: u.emergencyRelation || (u.parentName ? "Guardian" : ""),
          emergencyName: u.emergencyName || u.parentName || "",
          address: u.address || "",
          profileImage: u.profileImage || "",
          institution: u.institution || "EduFlow Academy",
          role: u.role || "User",
          department: u.department || "",
          className: u.className || u.class || "",
          rollNumber: u.rollNumber || "",
          employeeId: u.employeeId || "",
        };

        setProfile(liveProfile);
        if (u.role) setRole(u.role.replace("_", " "));
        localStorage.setItem("eduflow-user", JSON.stringify(u));
        localStorage.setItem("eduflow-profile", JSON.stringify(liveProfile));
      }
    } catch (err) {
      console.error("Failed to fetch live profile:", err);
    }
  };

  useEffect(() => {
    const curDate = new Date();
    setToday(curDate);
    fetchProfile();
    fetchAttendance(month);

    window.addEventListener("eduflow-user-change", fetchProfile);
    return () => window.removeEventListener("eduflow-user-change", fetchProfile);
  }, []);

  useEffect(() => {
    fetchAttendance(month);
  }, [month]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Calendar starts on Monday
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function getAttendanceRecord(day: number) {
    return attendanceRecords[day] || null;
  }

  const displayValue = (value: string | undefined) =>
    value?.trim() || "Not added";

  const initials =
    (profile.firstName?.[0] || profile.fullName?.[0] || "U").toUpperCase() +
    (profile.lastName?.[0] || "").toUpperCase();

  const info = [
    {
      label: "Full Name",
      value: displayValue(
        profile.fullName || `${profile.firstName} ${profile.lastName}`.trim()
      ),
      icon: UserRound,
    },
    {
      label: "Username",
      value: displayValue(profile.username),
      icon: UserRound,
    },
    {
      label: "Email",
      value: displayValue(profile.email),
      icon: Mail,
    },
    {
      label: "Phone Number",
      value: displayValue(profile.phone),
      icon: Phone,
    },
    {
      label: "Date of Birth",
      value: displayValue(profile.birthDate),
      icon: Cake,
    },
    {
      label: "Gender",
      value: displayValue(profile.gender),
      icon: UserRound,
    },
    {
      label: "Marital Status",
      value: displayValue(profile.maritalStatus || profile.status),
      icon: UserRound,
    },
    {
      label: "Emergency Contact",
      value: displayValue(profile.emergencyContact),
      icon: Phone,
    },
    {
      label: "Emergency Person Name",
      value: displayValue(profile.emergencyName),
      icon: UserRound,
    },
    {
      label: "Emergency Person Relation",
      value: displayValue(profile.emergencyRelation),
      icon: UserRound,
    },
    {
      label: "Current Address",
      value: displayValue(profile.address),
      icon: UserRound,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Sidebar />

      <div
        data-sidebar-content="true"
        className={`min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "md:ml-64" : "ml-0 md:ml-0 w-full"
        }`}
      >
        <Topbar />

        <main className="px-5 py-6 md:px-8">
          <div className="mb-6" />

          {/* Profile cover */}
          <section className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative h-30 overflow-hidden bg-linear-to-r from-yellow-200 via-amber-100 to-yellow-300 sm:h-44">
              <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border-2 border-yellow-500/40" />
              <div className="absolute right-20 -top-28 h-64 w-64 rounded-full border-2 border-yellow-500/30" />
              <div className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 sm:px-8">
              <div className="flex min-w-0 items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-900 text-2xl font-bold text-yellow-400 shadow-md sm:h-28 sm:w-28 sm:text-3xl">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt="Profile"
                      width={112}
                      height={112}
                      unoptimized
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0 pb-2">
                  <h1 className="wrap-break-words text-xl font-bold text-gray-900 sm:text-2xl">
                    {profile.fullName || `${profile.firstName} ${profile.lastName}`.trim() || "User"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    @{profile.username || "user"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Profile information and attendance */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 bg-linear-to-r from-yellow-100 to-amber-50 px-5 py-5 sm:px-6">
                <div className="rounded-xl bg-yellow-400 p-3 text-gray-900">
                  <UserRound size={23} />
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Profile Information
                    </h2>
                  </div>

                  <Link
                    href="/profile/edit"
                    aria-label="Edit profile information"
                    title="Edit Profile"
                    className="shrink-0 rounded-lg bg-yellow-400 p-2 text-gray-900 transition hover:bg-yellow-500 cursor-pointer"
                  >
                    <Pencil size={18} />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-7 p-5 sm:grid-cols-2 sm:p-6">
                {info.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="flex min-w-0 gap-3"
                    >
                      <div className="h-fit rounded-full bg-green-50 p-2.5 text-green-600">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">
                          {item.label}
                        </p>
                        <p className="mt-1 wrap-break-words font-semibold text-gray-900">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Attendance calendar */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 bg-linear-to-r from-teal-100 to-sky-100 px-5 py-5 sm:px-6">
                <div className="rounded-xl bg-teal-500 p-3 text-white">
                  <CalendarDays size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Attendance Calendar
                  </h2>
                  <p className="text-sm text-gray-600">
                    Monthly attendance overview
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMonth(new Date(year, monthIndex - 1, 1))
                    }
                    aria-label="Previous month"
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                    {month.toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      setMonth(new Date(year, monthIndex + 1, 1))
                    }
                    aria-label="Next month"
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-7">
                  {[
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                  ].map((day) => (
                    <div
                      key={day}
                      className="border border-gray-200 bg-gray-50 py-2 text-center text-xs font-semibold text-gray-600 sm:text-sm"
                    >
                      {day}
                    </div>
                  ))}

                  {calendarDays.map((day, index) => {
                    const record = day ? getAttendanceRecord(day) : null;
                    const rawStatus = (record?.status || "").trim();

                    const isToday = Boolean(
                      today &&
                        day === today.getDate() &&
                        monthIndex === today.getMonth() &&
                        year === today.getFullYear()
                    );

                    const isSelected = selectedDay === day;

                    // Check if date is in the future
                    const dayDate = day ? new Date(year, monthIndex, day, 23, 59, 59, 999) : null;
                    const isFuture = dayDate && today ? dayDate.getTime() > today.getTime() : false;

                    // Only show status when an actual MongoDB record exists and the date is not in the future
                    let status: string | null = null;
                    let statusClass = "border-gray-200 bg-gray-50 text-gray-700";
                    let dotClass = "bg-gray-400";

                    if (!isFuture && record && rawStatus) {
                      if (rawStatus === "Present") {
                        status = "Present";
                        statusClass = "border-emerald-200 bg-emerald-50 text-emerald-800";
                        dotClass = "bg-emerald-500";
                      } else if (rawStatus === "Absent") {
                        status = "Absent";
                        statusClass = "border-rose-200 bg-rose-50 text-rose-800";
                        dotClass = "bg-rose-500";
                      } else if (rawStatus === "Late") {
                        status = "Late";
                        statusClass = "border-amber-200 bg-amber-50 text-amber-800";
                        dotClass = "bg-amber-500";
                      } else if (
                        rawStatus === "On Leave" ||
                        rawStatus === "Excused" ||
                        rawStatus.toLowerCase() === "onleave"
                      ) {
                        status = "On Leave";
                        statusClass = "border-indigo-200 bg-indigo-50 text-indigo-800";
                        dotClass = "bg-indigo-500";
                      }
                    }

                    return (
                      <div
                        key={`${year}-${monthIndex}-${index}`}
                        onClick={() => {
                          if (day) {
                            setSelectedDay(selectedDay === day ? null : day);
                          }
                        }}
                        className={`flex min-h-16.5 min-w-0 flex-col items-center border border-gray-200 px-0.5 py-2 sm:min-h-19 cursor-pointer transition ${
                          isSelected ? "bg-yellow-50/50 ring-1 ring-yellow-400 inset-0" : "hover:bg-gray-50/80"
                        }`}
                      >
                        {day && (
                          <>
                            {isToday ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-slate-950 shadow ring-2 ring-yellow-400 ring-offset-2 sm:h-8 sm:w-8 sm:text-sm">
                                {day}
                              </span>
                            ) : (
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${
                                  isSelected
                                    ? "bg-slate-900 text-white font-bold"
                                    : "text-gray-800"
                                }`}
                              >
                                {day}
                              </span>
                            )}

                            {status && (
                              <span
                                className={`mt-1 inline-flex max-w-full items-center gap-1 truncate rounded border px-1 py-0.5 text-[8.5px] font-bold sm:px-1.5 sm:text-[9.5px] ${statusClass}`}
                              >
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
                                <span className="truncate">{status}</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Attendance Calendar Legend
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-slate-950 ring-1 ring-yellow-400">
                        {today ? today.getDate() : "15"}
                      </span>
                      <span className="font-semibold text-slate-900">Today&apos;s Date (Indicator)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-emerald-800">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                      <span className="font-semibold text-rose-800">Absent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                      <span className="font-semibold text-amber-800">Late</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                      <span className="font-semibold text-indigo-800">On Leave</span>
                    </div>
                  </div>
                </div>

                {/* Selected Date Details Card */}
                {selectedDay !== null && (
                  <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-yellow-900">
                        Selected Date:{" "}
                        {new Date(year, monthIndex, selectedDay).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedDay(null)}
                        className="rounded px-2 py-0.5 text-xs font-semibold text-gray-600 hover:bg-yellow-200/50 hover:text-gray-900 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    {getAttendanceRecord(selectedDay) ? (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                        <div>
                          <span className="text-gray-500">Status</span>
                          <p className="mt-0.5 font-bold text-gray-950">
                            {getAttendanceRecord(selectedDay)?.status}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Class / Dept</span>
                          <p className="mt-0.5 font-semibold text-gray-950">
                            {getAttendanceRecord(selectedDay)?.className || profile.department || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Recorded By</span>
                          <p className="mt-0.5 font-semibold text-gray-950">
                            {getAttendanceRecord(selectedDay)?.markedBy?.name || "Authorized Staff"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Remarks</span>
                          <p className="mt-0.5 font-semibold text-gray-950">
                            {getAttendanceRecord(selectedDay)?.remarks || "Regular attendance"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-600">
                        No attendance record found for this date.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <p className="text-xs text-gray-500">Present Days</p>
                    <p className="mt-1 text-xl font-extrabold text-emerald-600">
                      {attendanceStats.presentDays}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <p className="text-xs text-gray-500">Absent Days</p>
                    <p className="mt-1 text-xl font-extrabold text-rose-600">
                      {attendanceStats.absentDays}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <p className="text-xs text-gray-500">Late Days</p>
                    <p className="mt-1 text-xl font-extrabold text-amber-600">
                      {attendanceStats.lateDays}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <p className="text-xs text-gray-500">On Leave</p>
                    <p className="mt-1 text-xl font-extrabold text-indigo-600">
                      {attendanceStats.leaveDays}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <p className="text-xs text-gray-500">Total Working</p>
                    <p className="mt-1 text-xl font-extrabold text-gray-900">
                      {attendanceStats.totalWorkingDays}
                    </p>
                  </div>

                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3.5">
                    <p className="text-xs font-semibold text-yellow-800">Attendance Rate</p>
                    <p className="mt-1 text-xl font-black text-yellow-950">
                      {attendanceStats.attendancePercentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-5 text-center">
                  <CalendarClock
                    className="mx-auto text-gray-400"
                    size={28}
                  />
                  <p className="mt-2 font-semibold text-gray-800">
                    No leave requests yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your submitted leave requests will appear here.
                  </p>
                </div>

                <Link
                  href="/attendance/leaves"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-500 cursor-pointer"
                >
                  <CalendarClock size={17} />
                  Apply for Leave
                </Link>
              </div>
            </section>

            {/* ERP information */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center gap-3 bg-linear-to-r from-blue-100 to-cyan-100 px-5 py-5">
                <div className="rounded-xl bg-blue-500 p-3 text-white">
                  <GraduationCap size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    ERP Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Your account and institution details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <ShieldCheck className="text-green-600 shrink-0" size={21} />
                  <div>
                    <p className="text-sm text-gray-500">Account Role</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <Building2 className="text-blue-600 shrink-0" size={21} />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Institution</p>
                    <p className="wrap-break-words font-semibold text-gray-900">
                      {displayValue(profile.institution)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <CheckCircle2 className="text-green-600 shrink-0" size={21} />
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <p className="font-semibold text-green-700">Active</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <Clock className="text-orange-500 shrink-0" size={21} />
                  <div>
                    <p className="text-sm text-gray-500">Portal</p>
                    <p className="font-semibold text-gray-900">
                      EduFlow ERP
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
