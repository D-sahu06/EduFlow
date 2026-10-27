
"use client";

import Link from "next/link";
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
} from "lucide-react";

const stats = [
  {
    title: "Total Students",
    value: "1,248",
    detail: "Student records",
    icon: GraduationCap,
  },
  {
    title: "Total Teachers",
    value: "86",
    detail: "Teaching staff",
    icon: Users,
  },
  {
    title: "Total Staff",
    value: "42",
    detail: "Non-teaching staff",
    icon: UserRoundCheck,
  },
  {
    title: "Fee Collection",
    value: "₹8.4L",
    detail: "Demo amount",
    icon: Wallet,
  },
];

const activities = [
  {
    title: "New student admission",
    detail: "Admission module",
    time: "Recent",
  },
  {
    title: "Attendance overview",
    detail: "Attendance module",
    time: "Today",
  },
  {
    title: "Fee records overview",
    detail: "Finance module",
    time: "Today",
  },
];

export default function AdminDashboard() {
   console.log("Admin dashboard page rendered");
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      <Sidebar />

      <main className="min-h-screen min-w-0 px-4 pb-8 pt-20 sm:px-6 md:ml-64 md:pt-6 lg:px-9">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Admin / Dashboard
            </p>

            <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Admin Dashboard
              
            </h2>
           
            

            <p className="mt-2 text-sm text-gray-500">
              Overview of your institution management system.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:flex">
              <Search size={18} className="text-gray-400" />
              <input
                placeholder="Search..."
                aria-label="Search dashboard"
                className="w-28 bg-transparent text-sm outline-none"
              />
            </div>

            <button
              type="button"
              aria-label="Notifications"
              className="rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-100"
            >
              <Bell size={19} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950 font-bold text-yellow-400">
              A
            </div>
          </div>
        </header>

        {/* Welcome Banner */}
        <section className="mb-8 rounded-2xl bg-gray-950 p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-yellow-400">
                ADMINISTRATOR WORKSPACE
              </p>

              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                Welcome to EduFlow!
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300">
                Manage accounts, student information, attendance and
                institutional operations from one place.
              </p>
            </div>

            <Link
              href="/admin/users/create"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-gray-950 transition hover:bg-yellow-300"
            >
              <UserPlus size={19} />
              Create Account
            </Link>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Institution Overview</h3>
            <span className="text-xs text-gray-500">Sample data</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
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

                  <p className="mt-2 text-3xl font-extrabold">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {stat.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity and Quick Actions */}
        <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-bold">Recent Activity</h3>
              <span className="text-xs text-gray-500">Preview</span>
            </div>

            <div className="space-y-5">
              {activities.map((activity, index) => (
                <div
                  key={activity.title}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800">
                    {index === 0 ? (
                      <GraduationCap size={20} />
                    ) : index === 1 ? (
                      <CalendarCheck size={20} />
                    ) : (
                      <Wallet size={20} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {activity.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {activity.detail}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-gray-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="mb-5 font-bold">Quick Actions</h3>

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
                href="/students"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-sm font-semibold transition hover:border-yellow-400 hover:bg-yellow-50"
              >
                <GraduationCap
                  size={20}
                  className="shrink-0 text-yellow-700"
                />
                Student Information
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-gray-400">
          EduFlow ERP · Admin Dashboard · Frontend preview
        </footer>
      </main>
    </div>
  );
}
