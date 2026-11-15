"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { useSidebar } from "@/lib/sidebar";
import { api } from "@/lib/api";
import {
  Wallet,
  IndianRupee,
  FileCheck2,
  CalendarDays,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Loader2,
} from "lucide-react";

export default function AccountantDashboard() {
  const { sidebarOpen } = useSidebar();
  const [overview, setOverview] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [structureCount, setStructureCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);
        const [overviewRes, receiptsRes, structuresRes] = await Promise.allSettled([
          api.get<{ overview: any }>("/reports/overview"),
          api.get<{ receipts: any[] }>("/fees/receipts"),
          api.get<{ feeStructures: any[] }>("/fees/structures"),
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value?.overview) {
          setOverview(overviewRes.value.overview);
        }

        if (receiptsRes.status === "fulfilled" && receiptsRes.value?.receipts) {
          setReceipts(receiptsRes.value.receipts);
        }

        if (structuresRes.status === "fulfilled" && structuresRes.value?.feeStructures) {
          setStructureCount(structuresRes.value.feeStructures.length);
        }
      } catch (err) {
        console.warn("Could not load finance overview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  const stats = [
    {
      title: "Total Fee Collections",
      value: overview?.totalRevenue ?? (receipts.length > 0 ? `₹${(receipts.reduce((sum, r) => sum + (r.amount || 0), 0) / 100000).toFixed(1)}L` : "₹0"),
      detail: "Verified transaction revenue",
      icon: IndianRupee,
      href: "/fees/receipts",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Pending Fee Dues",
      value: overview?.pendingDues ?? "₹0",
      detail: "Outstanding fees to collect",
      icon: AlertTriangle,
      href: "/fees/dues",
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Receipts Issued",
      value: String(receipts.length),
      detail: "Generated payment invoices",
      icon: Receipt,
      href: "/fees/receipts",
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Active Fee Categories",
      value: String(structureCount),
      detail: "Configured fee structures",
      icon: FileSpreadsheet,
      href: "/fees/structure",
      color: "text-purple-600 bg-purple-50",
    },
  ];

  const accountantModules = [
    {
      title: "Issue Payment Receipt",
      description: "Record offline/online student fee payments, generate formal receipts with transaction IDs",
      icon: Receipt,
      href: "/fees/receipts",
      badge: "Collect",
    },
    {
      title: "Pending Dues & Defaulters",
      description: "Inspect unpaid student fee installments, filter by class, and issue fee reminder alerts",
      icon: AlertTriangle,
      href: "/fees/dues",
      badge: "Dues",
    },
    {
      title: "Fee Structure & Schedules",
      description: "Manage tuition fees, admission charges, transport tariffs, and lab fees per standard",
      icon: FileSpreadsheet,
      href: "/fees/structure",
      badge: "Tariffs",
    },
    {
      title: "Financial Reports & Audit",
      description: "Generate daily cashier reconciliation sheets, monthly breakdowns, and annual summaries",
      icon: FileCheck2,
      href: "/reports/fees",
      badge: "Reports",
    },
    {
      title: "Student Fee Structure",  
      description: "Look up individual student financial ledgers, past transactions, and waiver records",
      icon: Users,
      href: "/fees/structure",
      badge: "Ledgers",
    },
  ];

  const recentTransactions = receipts.slice(0, 5).map((r) => ({
    id: r.receiptNumber || r._id || "REC",
    student: r.student?.name || r.studentName || "Student",
    class: r.student?.className || r.className || "Class 10",
    amount: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(r.amount || 0),
    mode: r.paymentMode || "Online",
    status: r.status || "Paid",
  }));

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      <Sidebar />

      <div
        data-sidebar-content="true"
        className={`min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "md:ml-64" : "ml-0 md:ml-0 w-full"
        }`}
      >
        <Topbar />

        <main className="min-h-screen px-5 pb-12 pt-6 md:px-8">
          {/* Header */}
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
                  <Wallet size={14} className="text-amber-700" />
                  FINANCE & ACCOUNTS DESK
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl text-gray-900">
                Institutional Accountant Dashboard
              </h1>

              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} />
                {today} 
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/fees/receipts"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-500"
              >
                <PlusCircle size={17} />
                Issue Receipt
              </Link>
            </div>
          </header>

          {/* Core Metrics */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">{item.title}</span>
                    <div className={`rounded-xl p-2.5 ${item.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-gray-800">
                    {loading ? <Loader2 className="animate-spin text-yellow-600" size={24} /> : item.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                    <span>{item.detail}</span>
                    <ArrowUpRight size={14} className="text-gray-400 group-hover:text-yellow-600 transition" />
                  </p>
                </Link>
              );
            })}
          </section>

          {/* Recent Collections Table */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-950">Recent Fee Collections</h3>
                <p className="text-xs text-gray-500 mt-1">Live payments recorded in erp.</p>
              </div>
              <Link href="/fees/receipts" className="text-xs font-bold text-yellow-800 hover:underline">
                View All Receipts →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Receipt No</th>
                    <th className="px-5 py-3.5 font-semibold">Student Name</th>
                    <th className="px-5 py-3.5 font-semibold">Class</th>
                    <th className="px-5 py-3.5 font-semibold">Amount Paid</th>
                    <th className="px-5 py-3.5 font-semibold">Mode</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        <Loader2 className="mr-2 inline animate-spin text-yellow-500" size={18} /> Loading transactions...
                      </td>
                    </tr>
                  ) : recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No fee collection records found in MongoDB.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-gray-900">{tx.id}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-950">{tx.student}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{tx.class}</td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600">{tx.amount}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-700">{tx.mode}</td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Accountant Toolset */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-gray-950">
              Financial Management Modules
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accountantModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-yellow-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="rounded-xl bg-yellow-100 p-3 text-yellow-900 group-hover:bg-yellow-400 transition">
                          <Icon size={22} />
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                          {module.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-950 group-hover:text-yellow-600 transition">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-1 text-xs font-bold text-yellow-700">
                      <span>Open Workspace</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}