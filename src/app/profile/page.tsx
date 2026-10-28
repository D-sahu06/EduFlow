"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

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
};

const defaultProfile: Profile = {
  firstName: "Dewansh",
  lastName: "Sahu",
  fullName: "Dewansh Sahu",
  username: "dewansh.sahu",
  email: "dewanshsahu89@gmail.com",
  birthDate: "2005-07-09",
  phone: "7869135957",
  gender: "Male",
  status: "Unmarried",
  maritalStatus: "Unmarried",
  emergencyContact: "",
  emergencyRelation: "",
  emergencyName: "",
  address: "",
  profileImage: "",
  institution: "Not added",
};

const attendance: Record<number, string> = {
  2: "Absent",
  5: "Absent",
  8: "Present",
  9: "Present",
  12: "Absent",
  15: "Present",
  20: "Holiday",
  22: "Present",
  23: "Present",
};

function getAccountRole(): string {
  const userKeys = [
    "edunexus-user",
    "eduflow-user",
    "currentUser",
    "user",
  ];

  for (const key of userKeys) {
    const savedUser = localStorage.getItem(key);

    if (!savedUser) continue;

    try {
      const user = JSON.parse(savedUser);
      const rawRole = String(user?.role ?? "").trim().toLowerCase();

      if (!rawRole) continue;

      if (["admin", "administrator"].includes(rawRole)) {
        return "Administrator";
      }

      if (rawRole === "teacher" || rawRole === "faculty") {
        return "Teacher";
      }

      return rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
    } catch {
      // Ignore invalid user data.
    }
  }

  return "Administrator";
}

export default function ProfilePage() {
  // const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [role, setRole] = useState("Administrator");
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [today, setToday] = useState<Date | null>(null);
  // const [role, setRole] = useState("Administrator");

  const [profile, setProfile] = useState<Profile>(() => {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  try {
    const savedProfile = localStorage.getItem("profile");

    if (!savedProfile) {
      return defaultProfile;
    }

    const parsed = JSON.parse(savedProfile);

    return {
      ...defaultProfile,
      ...parsed,
      status: parsed.status ?? defaultProfile.status,
    };
  } catch (error) {
    console.error("Failed to load profile:", error);
    return defaultProfile;
  }
});

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(
    year,
    monthIndex + 1,
    0
  ).getDate();

  // Calendar starts on Monday.
  const firstDay =
    (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function getStatus(day: number) {
    const date = new Date(year, monthIndex, day);

    if (date.getDay() === 0) {
      return "Weekend";
    }

    if (
      today &&
      date.getDate() === today.getDate() &&
      monthIndex === today.getMonth() &&
      year === today.getFullYear()
    ) {
      return "Today";
    }

    // Demo attendance data is available for October 2026 only.
    if (monthIndex !== 9 || year !== 2026) {
      return "";
    }

    return attendance[day] || "";
  }

  const displayValue = (value: string | undefined) =>
    value?.trim() || "Not added";

  const info = [
    {
      label: "Full Name",
      value: displayValue(
        `${profile.firstName} ${profile.lastName}`.trim()
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
      value: displayValue(
        profile.maritalStatus || profile.status
      ),
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

      <div className="min-w-0 md:ml-64">
        <Topbar />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6" />

          {/* Profile cover */}
          <section className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative h-30 overflow-hidden bg-linear-to-r from-yellow-200 via-amber-100 to-yellow-300 sm:h-44">
              <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border-2 border-yellow-500/40" />
              <div className="absolute right-20 -top-28 h-64 w-64 rounded-full border-2 border-yellow-500/30" />
              <div className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 sm:px-8">
              <div className=" flex min-w-0 items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-900 text-2xl font-bold text-yellow-400 shadow-md sm:h-28 sm:w-28 sm:text-3xl">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt="Profile"
                      width={112}
                      height={212}
                      unoptimized
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    `${profile.firstName?.[0] ?? "D"}${profile.lastName?.[0] ?? "S"}`
                  )}
                </div>

                <div className="min-w-0 pb-2">
                  <h1 className="wrap-break-words text-xl font-bold text-gray-900 sm:text-2xl">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">
                    @{profile.username}
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

                  {role.toLowerCase() === "administrator" && (
  <Link
    href="/profile/add-user"
    className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
  >
    + Add User
  </Link>
)}

                  <Link
                    href="/profile/edit"
                    aria-label="Edit profile information"
                    title="Edit Profile"
                    className="shrink-0 rounded-lg bg-yellow-400 p-2 text-gray-900 transition hover:bg-yellow-500"
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
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
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
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
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
                    const status = day ? getStatus(day) : "";
                    const isToday = status === "Today";

                    const statusClass =
                      status === "Present"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : status === "Absent"
                        ? "border-red-200 bg-red-50 text-red-600"
                        : status === "Holiday"
                        ? "border-orange-200 bg-orange-50 text-orange-700"
                        : status === "Weekend"
                        ? "border-gray-200 bg-gray-100 text-gray-500"
                        : "";

                    return (
                      <div
                        key={`${year}-${monthIndex}-${index}`}
                        className="flex min-h-16.5 min-w-0 flex-col items-center border border-gray-200 px-0.5 py-2 sm:min-h-19"
                      >
                        {day && (
                          <>
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
                                isToday
                                  ? "bg-green-600 text-white"
                                  : "text-gray-800"
                              }`}
                            >
                              {day}
                            </span>

                            {status && (
                              <span
                                className={`mt-1 max-w-full truncate rounded border px-1 py-0.5 text-[9px] font-semibold sm:px-1.5 sm:text-[10px] ${statusClass}`}
                              >
                                {status}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="mt-2 text-2xl font-bold text-orange-500">
                      0
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                      0
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
                  href="/leave-requests"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-500"
                >
                  <CalendarClock size={17} />
                  Apply for Leave
                </Link>
              </div>
            </section>

            {/* ERP information */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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

              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <ShieldCheck className="text-green-600" size={21} />
                  <div>
                    <p className="text-sm text-gray-500">Account Role</p>
                    <p className="font-semibold text-gray-900">
                      {role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <Building2 className="text-blue-600" size={21} />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Institution</p>
                    <p className="wrap-break-words font-semibold text-gray-900">
                      {displayValue(profile.institution)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <CheckCircle2 className="text-green-600" size={21} />
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <p className="font-semibold text-green-700">Active</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
                  <Clock className="text-orange-500" size={21} />
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
