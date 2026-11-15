"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  IndianRupee,
  Clock,
  CheckCircle,
  Search,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type FeeRecord = {
  id: string;
  studentId: string;
  student: string;
  className: string;
  totalFee: number;
  paid: number;
  date: string;
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function FeesReportsPage() {
  const router = useRouter();

  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    let role = "";
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?.role) role = String(parsed.role).toUpperCase();
      }
    } catch {}
    if (!role) {
      role = (
        localStorage.getItem("eduflow-role") ||
        localStorage.getItem("eduflow-demo-role") ||
        localStorage.getItem("role") ||
        ""
      ).toUpperCase();
    }
    setUserRole(role);
    fetchFeeData();
  }, []);

  async function fetchFeeData() {
    setLoading(true);
    try {
      const [resDues, resReceipts, resStudents] = await Promise.allSettled([
        api.get<{ dues: any[] }>("/fees/dues"),
        api.get<{ receipts: any[] }>("/fees/receipts"),
        api.get<{ students: any[] }>("/students"),
      ]);

      const dues =
        resDues.status === "fulfilled" && resDues.value?.dues
          ? resDues.value.dues
          : [];

      const receipts =
        resReceipts.status === "fulfilled" && resReceipts.value?.receipts
          ? resReceipts.value.receipts
          : [];

      const students =
        resStudents.status === "fulfilled" && resStudents.value?.students
          ? resStudents.value.students
          : [];

      if (dues.length > 0 || receipts.length > 0) {
        const studentMap: Record<string, FeeRecord> = {};

        dues.forEach((d: any) => {
          const sId = d.student?._id || d.student?.studentId || String(d.student);
          const total = Number(d.totalFee !== undefined ? d.totalFee : (d.totalAmount || 0));
          const paid = Number(d.amountPaid !== undefined ? d.amountPaid : Math.max(0, total - Number(d.balanceDue || 0)));
          studentMap[sId] = {
            id: d._id || sId,
            studentId: sId,
            student: d.student?.name || d.studentName || "Student",
            className: d.className || d.student?.className || "Class 10",
            totalFee: total,
            paid: paid,
            date: d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : "—",
          };
        });

        receipts.forEach((r: any) => {
          const sId = r.student?._id || r.student?.studentId || String(r.student);
          const amt = Number(r.amount || 0);
          if (studentMap[sId]) {
            studentMap[sId].paid = Math.max(studentMap[sId].paid, amt);
          } else {
            studentMap[sId] = {
              id: r._id || sId,
              studentId: sId,
              student: r.student?.name || r.studentName || "Student",
              className: r.className || r.student?.className || "Class 10",
              totalFee: amt,
              paid: amt,
              date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "—",
            };
          }
        });

        setFees(Object.values(studentMap));
      } else {
        setFees([]);
      }
    } catch {
      setFees([]);
    } finally {
      setLoading(false);
    }
  }

  const canManageFees = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"].includes(
    userRole
  );

  const totalFee = fees.reduce((sum, fee) => sum + fee.totalFee, 0);
  const totalPaid = fees.reduce((sum, fee) => sum + fee.paid, 0);
  const totalPending = totalFee - totalPaid;

  const filteredFees = fees.filter((fee) => {
    const matchesSearch =
      fee.student.toLowerCase().includes(search.toLowerCase()) ||
      fee.className.toLowerCase().includes(search.toLowerCase());

    const status =
      fee.paid >= fee.totalFee
        ? "Paid"
        : fee.paid > 0
          ? "Partial"
          : "Unpaid";

    return matchesSearch && (filter === "All" || status === filter);
  });

  async function recordPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const amount = Number(paymentAmount);

    if (!selectedId || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const selectedFee = fees.find((fee) => fee.id === selectedId);
    if (!selectedFee) return;

    try {
      await api.post("/fees/pay", {
        studentId: selectedFee.studentId,
        amount,
        paymentMethod: "Cash",
      });

      setFees((current) =>
        current.map((fee) =>
          fee.id === selectedId
            ? { ...fee, paid: fee.paid + amount, date: new Date().toISOString().slice(0, 10) }
            : fee
        )
      );
    } catch {
      setFees((current) =>
        current.map((fee) =>
          fee.id === selectedId
            ? { ...fee, paid: fee.paid + amount, date: new Date().toISOString().slice(0, 10) }
            : fee
        )
      );
    }

    setPaymentAmount("");
    setSelectedId(null);
    setShowModal(false);
  }

  const stats = [
    {
      title: "Total Fees",
      value: formatINR(totalFee),
      icon: Wallet,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Fees Collected",
      value: formatINR(totalPaid),
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Pending Dues",
      value: formatINR(totalPending),
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: "Collection Rate",
      value: `${totalFee ? Math.round((totalPaid / totalFee) * 100) : 0}%`,
      icon: IndianRupee,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
          Back 
        </button>

        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              Fees Reports
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track student fee payments, collections and outstanding dues.
            </p>
          </div>

          {/* {canManageFees && (
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setPaymentAmount("");
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
            >
              <Plus size={18} />
              Record Payment
            </button>
          )} */}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-xl font-bold text-slate-800">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              Student Fee Records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review payments and outstanding balances.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or class..."
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="animate-spin text-amber-500" size={28} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Total Fee</th>
                    <th className="px-4 py-3 font-semibold">Paid</th>
                    <th className="px-4 py-3 font-semibold">Pending</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredFees.map((fee) => {
                    const pendingAmount = fee.totalFee - fee.paid;
                    const status =
                      pendingAmount === 0
                        ? "Paid"
                        : fee.paid > 0
                          ? "Partial"
                          : "Unpaid";

                    const badgeStyle =
                      status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : status === "Partial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700";

                    return (
                      <tr key={fee.id} className="hover:bg-amber-50/40">
                        <td className="px-4 py-4 font-medium text-slate-800">
                          {fee.student}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {fee.className}
                        </td>
                        <td className="px-4 py-4">{formatINR(fee.totalFee)}</td>
                        <td className="px-4 py-4 text-green-700">
                          {formatINR(fee.paid)}
                        </td>
                        <td className="px-4 py-4 text-red-600">
                          {formatINR(pendingAmount)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {pendingAmount > 0 && canManageFees ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(fee.id);
                                setPaymentAmount("");
                                setShowModal(true);
                              }}
                              className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Add Payment
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {pendingAmount === 0 ? "Completed" : "View only"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredFees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        No fee records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  Record Fee Payment
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close payment form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={recordPayment} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Student
                  </label>
                  <select
                    required
                    value={selectedId ?? ""}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="" disabled>
                      Select student
                    </option>
                    {fees
                      .filter((fee) => fee.paid < fee.totalFee)
                      .map((fee) => (
                        <option key={fee.id} value={fee.id}>
                          {fee.student} — Due {formatINR(fee.totalFee - fee.paid)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment Amount (₹)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={
                      selectedId
                        ? fees.find((fee) => fee.id === selectedId)!.totalFee -
                          fees.find((fee) => fee.id === selectedId)!.paid
                        : undefined
                    }
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-amber-400"
                  />
                </div>

                {selectedId !== null && (
                  <p className="text-xs text-slate-500">
                    Outstanding balance:{" "}
                    {formatINR(
                      fees.find((fee) => fee.id === selectedId)!.totalFee -
                        fees.find((fee) => fee.id === selectedId)!.paid
                    )}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    !selectedId ||
                    !paymentAmount ||
                    Number(paymentAmount) <= 0
                  }
                  className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Payment
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}