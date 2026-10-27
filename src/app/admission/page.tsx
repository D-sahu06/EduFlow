
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  ClipboardList,
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  FileText,
  Trophy,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    title: "Total Applications",
    value: "480",
    subtitle: "Applications received",
    icon: ClipboardList,
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Pending Review",
    value: "126",
    subtitle: "Awaiting verification",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    title: "Approved",
    value: "245",
    subtitle: "Applications approved",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Rejected",
    value: "109",
    subtitle: "Applications rejected",
    icon: XCircle,
    color: "bg-red-100 text-red-700",
  },
];

const recentApplications = [
  {
    id: "APP-1001",
    name: "Aarav Sharma",
    course: "B.Tech - IT",
    date: "26 Oct 2026",
    status: "Pending",
  },
  {
    id: "APP-1002",
    name: "Priya Verma",
    course: "B.Tech - CSE",
    date: "25 Oct 2026",
    status: "Approved",
  },
  {
    id: "APP-1003",
    name: "Rahul Patel",
    course: "BBA",
    date: "25 Oct 2026",
    status: "Pending",
  },
  {
    id: "APP-1004",
    name: "Ananya Singh",
    course: "B.Tech - IT",
    date: "24 Oct 2026",
    status: "Rejected",
  },
];

const quickActions = [
  {
    title: "New Admission",
    description: "Register a new student application",
    href: "/admission/new",
    icon: UserPlus,
  },
  {
    title: "View Applications",
    description: "Review and manage all applications",
    href: "/admission/applications",
    icon: FileText,
  },
  {
    title: "Merit List",
    description: "View applicant rankings and selection",
    href: "/admission/merit-list",
    icon: Trophy,
  },
];

function statusStyle(status: string) {
  if (status === "Approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-800";
}

export default function AdmissionDashboard() {
    const router = useRouter();
  return (
    
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
        
      {/* Page heading */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        

        <div>
          {/* <p className="mb-2 text-sm text-gray-500">
            EduFlow / Admission
          </p> */}
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Admission Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage applications, admissions and student selection.
          </p>
        </div>

        <Link
          href="/admission/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-gray-900 transition hover:bg-yellow-500"
        >
          <UserPlus size={18} />
          New Admission
        </Link>
      </div>
      <button
  onClick={() => router.back()}
  className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50"
>
  <ArrowLeft size={18} />
  Back
</button>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </h2>
                </div>

                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Admission progress */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Admission Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Current application status breakdown
              </p>
            </div>
            <TrendingUp className="text-yellow-600" size={23} />
          </div>

          <div className="mt-7 space-y-6">
            {[
              {
                label: "Approved",
                value: 245,
                color: "bg-green-500",
              },
              {
                label: "Pending Review",
                value: 126,
                color: "bg-yellow-400",
              },
              {
                label: "Rejected",
                value: 109,
                color: "bg-red-500",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {item.value} (
                    {Math.round((item.value / 480) * 100)}%)
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${(item.value / 480) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-xl bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              Admission cycle at a glance
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Review pending applications and prepare the merit list
              after verifying applicant eligibility.
            </p>
          </div>
        </section>

        {/* Quick summary */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
              <Users size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                Admission Summary
              </h2>
              <p className="text-sm text-gray-500">
                Current cycle
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <span className="text-sm text-gray-600">
                Total applicants
              </span>
              <span className="font-bold text-gray-900">480</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <span className="text-sm text-gray-600">
                Decisions made
              </span>
              <span className="font-bold text-gray-900">354</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Pending decisions
              </span>
              <span className="font-bold text-yellow-700">126</span>
            </div>
          </div>

          <Link
            href="/admission/applications"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:border-yellow-400 hover:bg-yellow-50"
          >
            Manage Applications <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      {/* Quick actions */}
      <section className="mt-7">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-yellow-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-900"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent applications */}
      <section className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Applications
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest sample application records
            </p>
          </div>

          <Link
            href="/admission/applications"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-800 hover:text-yellow-700"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-162.5 text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-3 py-3 font-semibold">Applicant</th>
                <th className="px-3 py-3 font-semibold">Course</th>
                <th className="px-3 py-3 font-semibold">Applied On</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentApplications.map((application) => (
                <tr
                  key={application.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-3 py-4">
                    <p className="font-semibold text-gray-900">
                      {application.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {application.id}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600">
                    {application.course}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600">
                    {application.date}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
