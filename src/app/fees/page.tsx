"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PermissionGate from "@/components/PermissionGate";
import {
  ArrowLeft,
  Wallet,
  IndianRupee,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Plus,
  FileText,
  Receipt,
  Users,
  Download,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type RecentPayment = {
  id: string;
  name: string;
  className: string;
  date: string;
  method: string;
  amount: number;
  status: string;
};

const quickActions = [
  {
    title: "Fee Structure",
    description: "Manage course-wise fees",
    href: "/fees/structure",
    icon: FileText,
    feature: "feesStructure",
    action: "view" as const,
  },
  {
    title: "Pending Dues",
    description: "Check outstanding payments",
    href: "/fees/dues",
    icon: Clock,
    feature: "pendingDues",
    action: "view" as const,
  },
  {
    title: "Create Receipt",
    description: "Record a student payment",
    href: "/fees/receipts",
    icon: Receipt,
    feature: "receipts",
    action: "create" as const,
  },
  {
    title: "Fee Reports",
    description: "View collection reports",
    href: "/reports/fees",
    icon: TrendingUp,
    feature: "financeReports",
    action: "view" as const,
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FinanceDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [totalCollection, setTotalCollection] = useState<number>(0);
  const [totalDues, setTotalDues] = useState<number>(0);
  const [dueCount, setDueCount] = useState<number>(0);
  const [todayCollection, setTodayCollection] = useState<number>(0);

  const [monthlyCollection, setMonthlyCollection] = useState<{ month: string; amount: number }[]>([
    { month: "Jan", amount: 0 },
    { month: "Feb", amount: 0 },
    { month: "Mar", amount: 0 },
    { month: "Apr", amount: 0 },
    { month: "May", amount: 0 },
    { month: "Jun", amount: 0 },
    { month: "Jul", amount: 0 },
    { month: "Aug", amount: 0 },
    { month: "Sep", amount: 0 },
    { month: "Oct", amount: 0 },
    { month: "Nov", amount: 0 },
    { month: "Dec", amount: 0 },
  ]);

  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  useEffect(() => {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"];

    const resolveRole = () => {
      try {
        const userStr = localStorage.getItem("eduflow-user");
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed?.role) return String(parsed.role).toUpperCase();
        }
      } catch {}
      return (
        localStorage.getItem("eduflow-role") ||
        localStorage.getItem("eduflow-demo-role") ||
        localStorage.getItem("role") ||
        ""
      ).toUpperCase();
    };

    const initialRole = resolveRole();
    if (initialRole && !allowedRoles.includes(initialRole)) {
      router.replace("/unauthorized");
      return;
    }

    async function verifyAndLoadFinanceData() {
      try {
        setLoading(true);
        const meRes = await api.get<{ user?: { role?: string } }>("/auth/me").catch(() => null);
        const liveRole = meRes?.user?.role ? String(meRes.user.role).toUpperCase() : initialRole;
        if (liveRole && !allowedRoles.includes(liveRole)) {
          router.replace("/unauthorized");
          return;
        }
        setAuthorized(true);

        const [statsRes, receiptsRes, duesRes] = await Promise.allSettled([
          api.get<{ success?: boolean; stats?: any }>("/fees/stats"),
          api.get<{ success?: boolean; receipts?: any[] }>("/fees/receipts"),
          api.get<{ success?: boolean; dues?: any[] }>("/fees/dues"),
        ]);

        if (statsRes.status === "rejected" || receiptsRes.status === "rejected" || duesRes.status === "rejected") {
          const errMsg =
            (statsRes.status === "rejected" && statsRes.reason?.message) ||
            (receiptsRes.status === "rejected" && receiptsRes.reason?.message) ||
            "";
          if (errMsg.toLowerCase().includes("access denied") || errMsg.toLowerCase().includes("forbidden")) {
            router.replace("/unauthorized");
            return;
          }
        }

        let col = 0;
        let dues = 0;
        let countD = 0;

        if (statsRes.status === "fulfilled" && statsRes.value?.stats) {
          const s = statsRes.value.stats;
          col = s.totalCollection || 0;
          dues = s.totalDues || 0;
          countD = s.dueCount || 0;
          setTotalCollection(col);
          setTotalDues(dues);
          setDueCount(countD);
        }

        if (receiptsRes.status === "fulfilled" && receiptsRes.value?.receipts) {
          const rList = receiptsRes.value.receipts;

          // Today's Collection
          const todayStr = new Date().toISOString().slice(0, 10);
          const todays = rList
            .filter((r: any) => r.createdAt && r.createdAt.slice(0, 10) === todayStr)
            .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
          setTodayCollection(todays);

          // Recent 5 payments
          const mappedRecent: RecentPayment[] = rList.slice(0, 5).map((r: any) => ({
            id: r.receiptNumber || r._id,
            name: r.studentName || r.student?.name || "Student",
            className: r.className || r.student?.className || "General",
            date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "—",
            method: r.paymentMethod || "UPI",
            amount: Number(r.amount || 0),
            status: r.status || "Paid",
          }));
          setRecentPayments(mappedRecent);

          // Calculate Monthly Breakdown
          const monthTotals = Array(12).fill(0);
          rList.forEach((r: any) => {
            if (r.createdAt) {
              const m = new Date(r.createdAt).getMonth();
              monthTotals[m] += Number(r.amount || 0);
            }
          });

          const maxMonthly = Math.max(...monthTotals, 1);
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const updatedMonthly = monthNames.map((name, idx) => ({
            month: name,
            amount: Math.round((monthTotals[idx] / maxMonthly) * 100),
          }));
          setMonthlyCollection(updatedMonthly);
        }
      } catch (err) {
        console.error("Failed to load finance dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    verifyAndLoadFinanceData();
  }, [router]);

  if (!authorized && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-500" size={28} />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const totalBilled = totalCollection + totalDues;
  const collectionRate = totalBilled > 0 ? ((totalCollection / totalBilled) * 100).toFixed(1) : "0.0";
  const pendingRate = totalBilled > 0 ? ((totalDues / totalBilled) * 100).toFixed(1) : "0.0";

  const stats = [
    {
      title: "Total Fee Collection",
      value: formatCurrency(totalCollection),
      change: "Live",
      note: "total verified payments",
      icon: Wallet,
      positive: true,
    },
    {
      title: "Pending Dues",
      value: formatCurrency(totalDues),
      change: `${dueCount} students`,
      note: "have outstanding fees",
      icon: Clock,
      positive: false,
    },
    {
      title: "Today's Collection",
      value: formatCurrency(todayCollection),
      change: "Real-time",
      note: "collected today",
      icon: IndianRupee,
      positive: true,
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      change: "Dynamic",
      note: "of total receivables",
      icon: TrendingUp,
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 cursor-pointer"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Finance Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage fees, collections, receipts and outstanding dues in MongoDB.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Export Permission */}
            <PermissionGate
              module="finance"
              feature="financeDashboard"
              action="export"
            >
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 cursor-pointer"
              >
                <Download size={17} />
                Export / Print
              </button>
            </PermissionGate>

            {/* Create Receipt Permission */}
            {/* <PermissionGate
              module="finance"
              feature="receipts"
              action="create"
            >
              <Link
                href="/fees/receipts"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 cursor-pointer"
              >
                <Plus size={18} />
                Record Payment
              </Link>
            </PermissionGate> */}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <h2 className="mt-3 text-2xl font-bold text-slate-900">
                      {loading ? "..." : stat.value}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                    <Icon size={22} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ${
                      stat.positive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {stat.positive ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <Users size={14} />
                    )}

                    {stat.change}
                  </span>

                  <span className="text-slate-500">{stat.note}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts and Summary */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Fee Collection Overview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Fee Collection Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Monthly collection trend calculated from transactions
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium">
                <CalendarDays size={16} />
                {new Date().getFullYear()}
              </span>
            </div>

            <div className="mt-8 flex h-56 items-end justify-between gap-2 border-b border-l border-slate-200 px-2 sm:gap-3">
              {monthlyCollection.map((item) => (
                <div
                  key={item.month}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    title={`${item.month}: ${item.amount}% relative volume`}
                    className={`w-full max-w-10 rounded-t-md transition hover:opacity-75 ${
                      item.amount > 0 ? "bg-amber-400" : "bg-slate-300"
                    }`}
                    style={{ height: `${Math.max(4, item.amount)}%` }}
                  />

                  <span className="mb-2 text-[10px] text-slate-500 sm:text-xs">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Total collected</p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatCurrency(totalCollection)}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <ArrowUpRight size={17} />
                Live totals
              </span>
            </div>
          </section>

          {/* Collection Summary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Collection Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Fee payment status overview
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Collected</span>
                  <span className="font-bold text-slate-900">{collectionRate}%</span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.min(100, Math.max(0, Number(collectionRate)))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-bold text-slate-900">{pendingRate}%</span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{ width: `${Math.min(100, Math.max(0, Number(pendingRate)))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                    <Clock size={19} />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Pending fee reminder
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      Review overdue balances and follow up with students.
                    </p>

                    <PermissionGate
                      module="finance"
                      feature="pendingDues"
                      action="view"
                    >
                      <Link
                        href="/fees/dues"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-800 hover:underline cursor-pointer"
                      >
                        View pending dues
                        <ArrowUpRight size={15} />
                      </Link>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common finance tasks in one place
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <PermissionGate
                  key={action.title}
                  module="finance"
                  feature={action.feature}
                  action={action.action}
                >
                  <Link
                    href={action.href}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md cursor-pointer"
                  >
                    <div className="rounded-xl bg-amber-100 p-3 text-amber-800 transition group-hover:bg-amber-400">
                      <Icon size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {action.description}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-slate-400 group-hover:text-amber-700"
                    />
                  </Link>
                </PermissionGate>
              );
            })}
          </div>
        </section>

        {/* Recent Payments */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Payments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest recorded fee transactions from MongoDB
              </p>
            </div>

            <PermissionGate
              module="finance"
              feature="receipts"
              action="view"
            >
              <Link
                href="/fees/receipts"
                className="text-sm font-bold text-amber-700 hover:underline cursor-pointer"
              >
                View all payments →
              </Link>
            </PermissionGate>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                <Loader2 className="animate-spin text-amber-500" size={18} />
                Loading payment records ...
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No fee payment records found in MongoDB.
              </div>
            ) : (
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Receipt ID</th>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Method</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {payment.id}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {payment.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {payment.className}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {payment.date}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {payment.method}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-slate-500">
          <span>EduFlow ERP · Finance Management</span>
          <span>Live MongoDB Integration</span>
        </footer>
      </div>
    </div>
  );
}
