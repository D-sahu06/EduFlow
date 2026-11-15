"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

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

type AdmissionStats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  decisionsMade: number;
  approvalRate: string;
};

type ApplicationRecord = {
  _id: string;
  applicationNumber: string;
  applicantName: string;
  applyingForClass: string;
  createdAt?: string;
  status: string;
};

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

function normalizeAdmissionStats(rawStats: any): AdmissionStats {
  const approved = Number(rawStats?.approved ?? rawStats?.approvedCount ?? 0) || 0;
  const rejected = Number(rawStats?.rejected ?? rawStats?.rejectedCount ?? 0) || 0;
  const pending = Number(rawStats?.pending ?? rawStats?.pendingCount ?? 0) || 0;
  const total =
    Number(rawStats?.total ?? rawStats?.totalApplications ?? approved + rejected + pending) || 0;
  const decisionsMade = Number(rawStats?.decisionsMade ?? approved + rejected) || 0;
  const approvalRate =
    typeof rawStats?.approvalRate === "string"
      ? rawStats.approvalRate
      : `${total > 0 ? Math.round((approved / total) * 100) : 0}%`;

  return {
    total,
    approved,
    pending,
    rejected,
    decisionsMade,
    approvalRate,
  };
}

export default function AdmissionDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdmissionData = async () => {
      try {
        setLoading(true);
        setError("");
        const [statsRes, appsRes] = await Promise.allSettled([
          api.get("/admissions/stats"),
          api.get("/admissions/applications?limit=5"),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value?.stats) {
          setStats(normalizeAdmissionStats(statsRes.value.stats));
        } else if (statsRes.status === "rejected") {
          setError(statsRes.reason?.message || "Could not load admission statistics.");
        }

        if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value?.applications)) {
          setRecentApplications(appsRes.value.applications);
        }
      } catch (err: any) {
        console.warn("Could not load admission data:", err);
        setError(err?.message || "Could not load admission data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissionData();
  }, []);

  const total = stats?.total ?? 0;
  const approved = stats?.approved ?? 0;
  const pending = stats?.pending ?? 0;
  const rejected = stats?.rejected ?? 0;
  const decisionsMade = stats?.decisionsMade ?? 0;

  const statCards = [
    {
      title: "Total Applications",
      value: loading ? "..." : String(total),
      subtitle: "Applications received",
      icon: ClipboardList,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Pending Review",
      value: loading ? "..." : String(pending),
      subtitle: "Awaiting verification",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Approved",
      value: loading ? "..." : String(approved),
      subtitle: "Applications approved",
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Rejected",
      value: loading ? "..." : String(rejected),
      subtitle: "Applications rejected",
      icon: XCircle,
      color: "bg-red-100 text-red-700",
    },
  ];

  const breakdown = [
    {
      label: "Approved",
      value: approved,
      color: "bg-green-500",
    },
    {
      label: "Pending Review",
      value: pending,
      color: "bg-yellow-400",
    },
    {
      label: "Rejected",
      value: rejected,
      color: "bg-red-500",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Page heading */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer"
          >
            <ArrowLeft size={18} />
            Back
          </button>

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

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
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
            {breakdown.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {item.label}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {item.value} ({pct}%)
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
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
              <span className="font-bold text-gray-900">{total}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <span className="text-sm text-gray-600">
                Decisions made
              </span>
              <span className="font-bold text-gray-900">{decisionsMade}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Pending decisions
              </span>
              <span className="font-bold text-yellow-700">{pending}</span>
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
              Latest applications recorded in MongoDB
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
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="animate-spin text-yellow-500" size={18} />
              <span>Loading applications...</span>
            </div>
          ) : (
            <table className="w-full min-w-162.5 text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-3 font-semibold">Applicant</th>
                  <th className="px-3 py-3 font-semibold">Course / Class</th>
                  <th className="px-3 py-3 font-semibold">Applied On</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentApplications.length > 0 ? (
                  recentApplications.map((application) => (
                    <tr
                      key={application._id || application.applicationNumber}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold text-gray-900">
                          {application.applicantName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 font-mono">
                          {application.applicationNumber}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {application.applyingForClass}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {application.createdAt
                          ? new Date(application.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-gray-500">
                      No admission applications recorded in the database yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
