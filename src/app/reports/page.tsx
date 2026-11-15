"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Users,
  UserPlus,
  CalendarCheck,
  Wallet,
  GraduationCap,
  TrendingUp,
  IndianRupee,
  FileText,
  Loader2,
} from "lucide-react";

const reportModules = [
  {
    title: "Admission Reports",
    description:
      "View new admissions, class-wise enrollment, and admission trends.",
    href: "/reports/admissions",
    icon: UserPlus,
    color: "bg-blue-100 text-blue-700",
    tag: "Admissions",
  },
  {
    title: "Attendance Reports",
    description:
      "Analyze attendance percentage, absentees, and class-wise records.",
    href: "/reports/attendance",
    icon: CalendarCheck,
    color: "bg-green-100 text-green-700",
    tag: "Attendance",
  },
  {
    title: "Fees Reports",
    description:
      "Track fee collection, outstanding dues, and payment status.",
    href: "/reports/fees",
    icon: Wallet,
    color: "bg-purple-100 text-purple-700",
    tag: "Finance",
  },
  {
    title: "Academic Performance",
    description:
      "Review exam results, subject averages, and student performance.",
    href: "/reports/academic",
    icon: GraduationCap,
    color: "bg-amber-100 text-amber-700",
    tag: "Academics",
  },
];

export default function ReportsDashboardPage() {
  const router = useRouter();

  const [overview, setOverview] = useState<any>(null);
  const [admissionStats, setAdmissionStats] = useState<any>(null);
  const [monthlyFees, setMonthlyFees] = useState<{ month: string; collected: number; pending: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const [ovRes, admRes, receiptsRes] = await Promise.allSettled([
          api.get("/reports/overview"),
          api.get("/admissions/stats"),
          api.get("/fees/receipts"),
        ]);

        if (ovRes.status === "fulfilled" && ovRes.value?.overview) {
          setOverview(ovRes.value.overview);
        }

        if (admRes.status === "fulfilled" && admRes.value?.stats) {
          setAdmissionStats(admRes.value.stats);
        }

        if (receiptsRes.status === "fulfilled" && receiptsRes.value?.receipts) {
          const receipts = receiptsRes.value.receipts;
          const monthsMap: Record<string, number> = {};
          receipts.forEach((r: any) => {
            const date = r.paymentDate ? new Date(r.paymentDate) : new Date(r.createdAt || Date.now());
            const m = date.toLocaleDateString("en-US", { month: "short" });
            monthsMap[m] = (monthsMap[m] || 0) + (r.amountPaid || r.amount || 0);
          });
          const formatted = Object.entries(monthsMap).map(([month, val]) => ({
            month,
            collected: val,
            pending: 0,
          }));
          setMonthlyFees(formatted);
        }
      } catch (err) {
        console.warn("Could not load reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  const monthlyAdmissions = admissionStats?.monthlyApplications || [];
  const maxAdmissionVal = Math.max(...monthlyAdmissions.map((m: any) => m.count || 0), 1);
  const maxFeeVal = Math.max(...monthlyFees.map((f) => f.collected || 0), 1);

  const stats = [
    {
      title: "Total Students",
      value: loading ? "..." : String(overview?.totalStudents ?? 0),
      subtitle: "Across all classes",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Total Admissions",
      value: loading ? "..." : String(admissionStats?.total ?? 0),
      subtitle: `${admissionStats?.approved ?? 0} approved applicants`,
      icon: UserPlus,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Attendance Rate",
      value: loading ? "..." : (overview?.averageAttendance || "0%"),
      subtitle: "Overall student presence",
      icon: CalendarCheck,
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: "Fees Collected",
      value: loading ? "..." : (overview?.totalRevenue || "₹0"),
      subtitle: `Dues pending: ${overview?.pendingDues || "₹0"}`,
      icon: IndianRupee,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back 
        </button>

        {/* Header */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                <BarChart3 size={27} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                Reports & Analysis
              </h1>
            </div>

            <p className="text-sm text-slate-500">
              Monitor institutional performance through reports and analytics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 sm:self-auto">
            <FileText size={17} />
            Admin Reports
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      {stat.title}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-800">
                      {stat.value}
                    </h2>
                  </div>

                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {stat.subtitle}
                </p>
              </div>
            );
          })}
        </section>

        {/* Report Modules */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              Reports Modules
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a report to explore detailed records and analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {reportModules.map((module) => {
              const Icon = module.icon;

              return (
                <button
                  key={module.title}
                  type="button"
                  onClick={() => router.push(module.href)}
                  className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md sm:p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`rounded-xl p-3 ${module.color}`}
                    >
                      <Icon size={25} />
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {module.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-800">
                    {module.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {module.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-amber-700">
                    <span>View Report</span>
                    <ArrowRight
                      size={18}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

          {/* Admission Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-800">
                  Admission Trends
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Monthly application distribution in database
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <TrendingUp size={20} />
              </div>
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin text-yellow-500" size={18} />
                <span>Loading trends...</span>
              </div>
            ) : monthlyAdmissions.length > 0 ? (
              <div className="flex h-56 items-end gap-3 border-b border-l border-slate-200 px-3 pb-2 pt-4 sm:gap-5">
                {monthlyAdmissions.map((item: any) => {
                  const heightPercent = Math.max(Math.round(((item.count || 0) / maxAdmissionVal) * 100), 10);
                  return (
                    <div
                      key={item.month}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-xs font-semibold text-slate-600">
                        {item.count || 0}
                      </span>

                      <div
                        className="w-full max-w-12 rounded-t-md bg-amber-400 transition hover:bg-amber-500"
                        style={{ height: `${heightPercent}%` }}
                        title={`${item.month}: ${item.count} applications`}
                      />

                      <span className="text-xs text-slate-500">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-xs text-slate-500">
                No admission trends recorded in the database yet.
              </div>
            )}
          </div>

          {/* Fees Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-800">
                  Fee Collection Analysis
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Monthly verified receipts in database
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-2 text-purple-700">
                <Wallet size={20} />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-amber-400" />
                Collected
              </span>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin text-yellow-500" size={18} />
                <span>Loading fee data...</span>
              </div>
            ) : monthlyFees.length > 0 ? (
              <div className="flex h-48 items-end gap-3 border-b border-l border-slate-200 px-3 pb-2 pt-4 sm:gap-5">
                {monthlyFees.map((item) => {
                  const heightPercent = Math.max(Math.round(((item.collected || 0) / maxFeeVal) * 100), 10);
                  return (
                    <div
                      key={item.month}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[10px] font-semibold text-slate-600">
                        ₹{(item.collected / 1000).toFixed(0)}k
                      </span>
                      <div className="flex h-full w-full max-w-12 items-end gap-1">
                        <div
                          className="flex-1 rounded-t-sm bg-amber-400"
                          style={{ height: `${heightPercent}%` }}
                          title={`Collected: ₹${item.collected}`}
                        />
                      </div>

                      <span className="text-xs text-slate-500">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-slate-500">
                No fee collection transactions recorded in the database yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
