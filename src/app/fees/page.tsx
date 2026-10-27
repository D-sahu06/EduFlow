
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  IndianRupee,
  Clock,
  TrendingUp,
  ArrowUpRight,
  // ArrowDownRight,
  Plus,
  FileText,
  // CreditCard,
  Receipt,
  Users,
  Download,
  CalendarDays,
} from "lucide-react";

const monthlyCollection = [
  { month: "Jan", amount: 55 },
  { month: "Feb", amount: 72 },
  { month: "Mar", amount: 48 },
  { month: "Apr", amount: 86 },
  { month: "May", amount: 65 },
  { month: "Jun", amount: 95 },
  { month: "Jul", amount: 76 },
  { month: "Aug", amount: 88 },
  { month: "Sep", amount: 60 },
  { month: "Oct", amount: 100 },
  { month: "Nov", amount: 78 },
  { month: "Dec", amount: 90 },
];

const recentPayments = [
  {
    id: "REC-1001",
    name: "Aarav Sharma",
    className: "B.Tech - CSE",
    date: "26 Oct 2026",
    method: "UPI",
    amount: 25000,
    status: "Paid",
  },
  {
    id: "REC-1002",
    name: "Priya Verma",
    className: "B.Tech - IT",
    date: "25 Oct 2026",
    method: "Bank Transfer",
    amount: 18000,
    status: "Paid",
  },
  {
    id: "REC-1003",
    name: "Rahul Patel",
    className: "BBA",
    date: "25 Oct 2026",
    method: "Cash",
    amount: 12000,
    status: "Paid",
  },
  {
    id: "REC-1004",
    name: "Sneha Gupta",
    className: "B.Com",
    date: "24 Oct 2026",
    method: "UPI",
    amount: 15000,
    status: "Paid",
  },
  {
    id: "REC-1005",
    name: "Karan Mehta",
    className: "B.Tech - CSE",
    date: "23 Oct 2026",
    method: "Bank Transfer",
    amount: 22000,
    status: "Paid",
  },
];

const quickActions = [
  {
    title: "Fee Structure",
    description: "Manage course-wise fees",
    href: "/finance/structure",
    icon: FileText,
  },
  {
    title: "Pending Dues",
    description: "Check outstanding payments",
    href: "/finance/dues",
    icon: Clock,
  },
  {
    title: "Create Receipt",
    description: "Record a student payment",
    href: "/finance/receipts",
    icon: Receipt,
  },
  {
    title: "Fee Reports",
    description: "View collection reports",
    href: "/finance/reports",
    icon: TrendingUp,
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

  const stats = [
    {
      title: "Total Fee Collection",
      value: "₹48,50,000",
      change: "+12.8%",
      note: "compared to last month",
      icon: Wallet,
      positive: true,
    },
    {
      title: "Pending Dues",
      value: "₹12,75,000",
      change: "86 students",
      note: "have outstanding fees",
      icon: Clock,
      positive: false,
    },
    {
      title: "Today's Collection",
      value: "₹92,000",
      change: "+8.2%",
      note: "compared to yesterday",
      icon: IndianRupee,
      positive: true,
    },
    {
      title: "Collection Rate",
      value: "79.2%",
      change: "+4.5%",
      note: "compared to last month",
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
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            {/* <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
              <Link href="/dashboard" className="hover:text-amber-600">
                Dashboard
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-800">Finance</span>
            </div> */}

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Finance Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage fees, collections, receipts and outstanding dues.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100"
            >
              <Download size={17} />
              Export / Print
            </button>

            <Link
              href="/finance/receipts"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              <Plus size={18} />
              Record Payment
            </Link>
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
                      {stat.value}
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
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Fee Collection Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Monthly collection trend for the current year
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium">
                <CalendarDays size={16} />
                2026
              </span>
            </div>

            <div className="mt-8 flex h-56 items-end justify-between gap-2 border-b border-l border-slate-200 px-2 sm:gap-3">
              {monthlyCollection.map((item) => (
                <div
                  key={item.month}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    title={`${item.month}: ${item.amount}% of chart scale`}
                    className={`w-full max-w-10 rounded-t-md transition hover:opacity-75 ${
                      item.month === "Oct"
                        ? "bg-amber-400"
                        : "bg-slate-800"
                    }`}
                    style={{ height: `${item.amount}%` }}
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
                  ₹48,50,000
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <ArrowUpRight size={17} />
                12.8% growth
              </span>
            </div>
          </section>

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
                  <span className="font-bold text-slate-900">79.2%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[79.2%] rounded-full bg-amber-400" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-bold text-slate-900">20.8%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[20.8%] rounded-full bg-slate-800" />
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
                    <Link
                      href="/finance/dues"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-800 hover:underline"
                    >
                      View pending dues
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Common finance tasks in one place
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
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
                Latest recorded fee transactions
              </p>
            </div>

            <Link
              href="/finance/history"
              className="text-sm font-bold text-amber-700 hover:underline"
            >
              View all payments →
            </Link>
          </div>

          <div className="overflow-x-auto">
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
                  <tr key={payment.id} className="transition hover:bg-slate-50">
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
          </div>

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Demo data for UI preview. Connect the finance API to display real
            transactions.
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-slate-500">
          <span>EduFlow ERP · Finance Management</span>
          <span>Secure administration · Demo dashboard</span>
        </footer>
      </div>
    </div>
  );
}
