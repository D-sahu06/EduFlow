
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Receipt,
  IndianRupee,
  CreditCard,
  Wallet,
  Printer,
  Eye,
  X,
  CheckCircle2,
  CalendarDays,
  RotateCcw,
} from "lucide-react";

type PaymentMethod = "Cash" | "UPI" | "Bank Transfer" | "Card";

type Payment = {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  note: string;
};

const initialPayments: Payment[] = [
  {
    id: "RCP-2026-1001",
    studentId: "STU001",
    studentName: "Aarav Sharma",
    course: "B.Tech - CSE",
    date: "2026-10-26",
    amount: 25000,
    method: "UPI",
    reference: "UPI-DEMO-1001",
    note: "Semester fee installment",
  },
  {
    id: "RCP-2026-1002",
    studentId: "STU002",
    studentName: "Priya Verma",
    course: "B.Tech - IT",
    date: "2026-10-25",
    amount: 18000,
    method: "Bank Transfer",
    reference: "BANK-DEMO-1002",
    note: "Tuition fee",
  },
  {
    id: "RCP-2026-1003",
    studentId: "STU003",
    studentName: "Rahul Patel",
    course: "BBA",
    date: "2026-10-25",
    amount: 12000,
    method: "Cash",
    reference: "CASH-DEMO-1003",
    note: "Fee installment",
  },
  {
    id: "RCP-2026-1004",
    studentId: "STU004",
    studentName: "Sneha Gupta",
    course: "B.Com",
    date: "2026-10-24",
    amount: 15000,
    method: "UPI",
    reference: "UPI-DEMO-1004",
    note: "Semester fee installment",
  },
];

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const displayDate = (value: string) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const emptyForm = {
  studentId: "",
  studentName: "",
  course: "",
  date: today(),
  amount: "",
  method: "UPI" as PaymentMethod,
  reference: "",
  note: "",
};

export default function ReceiptsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const term = search.toLowerCase();

        const matchesSearch =
          payment.id.toLowerCase().includes(term) ||
          payment.studentName.toLowerCase().includes(term) ||
          payment.studentId.toLowerCase().includes(term);

        const matchesMethod =
          methodFilter === "All" || payment.method === methodFilter;

        const matchesFrom = !fromDate || payment.date >= fromDate;
        const matchesTo = !toDate || payment.date <= toDate;

        return (
          matchesSearch &&
          matchesMethod &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [payments, search, methodFilter, fromDate, toDate]);

  const totalCollected = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const todayCollected = payments
    .filter((payment) => payment.date === today())
    .reduce((sum, payment) => sum + payment.amount, 0);

  const cashlessCount = payments.filter(
    (payment) => payment.method !== "Cash"
  ).length;

  function openNewPayment() {
    setForm({ ...emptyForm, date: today() });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const amount = Number(form.amount);

    if (
      !form.studentId.trim() ||
      !form.studentName.trim() ||
      !form.course.trim()
    ) {
      setError("Please fill in the student ID, name and course.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (!form.date || form.date > today()) {
      setError("Please select a valid payment date.");
      return;
    }

    if (
      form.method !== "Cash" &&
      !form.reference.trim()
    ) {
      setError("Enter the transaction/reference number for this payment method.");
      return;
    }

    const receiptId = `RCP-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-6)}`;

    const newPayment: Payment = {
      id: receiptId,
      studentId: form.studentId.trim(),
      studentName: form.studentName.trim(),
      course: form.course.trim(),
      date: form.date,
      amount,
      method: form.method,
      reference: form.reference.trim() || "—",
      note: form.note.trim() || "Fee payment",
    };

    setPayments((previous) => [newPayment, ...previous]);
    setShowForm(false);
    setForm(emptyForm);
    setNotice(`Demo receipt ${receiptId} created successfully.`);
    setSelectedPayment(newPayment);
  }

  function exportCSV() {
    const headers = [
      "Receipt Number",
      "Student ID",
      "Student Name",
      "Course",
      "Payment Date",
      "Amount",
      "Payment Method",
      "Transaction Reference",
      "Note",
    ];

    const rows = filteredPayments.map((payment) => [
      payment.id,
      payment.studentId,
      payment.studentName,
      payment.course,
      payment.date,
      payment.amount,
      payment.method,
      payment.reference,
      payment.note,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "eduflow-payment-receipts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function printReceipt(payment: Payment) {
    const printWindow = window.open("", "_blank", "width=760,height=800");

    if (!printWindow) {
      setNotice("Please allow pop-ups to print the receipt.");
      return;
    }

    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (char) => {
        const map: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return map[char];
      });

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Receipt ${escapeHtml(payment.id)}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 36px; color: #10233f; }
          .receipt { max-width: 620px; margin: auto; border: 1px solid #dbe2ea; padding: 30px; }
          .brand { background: #10233f; color: white; padding: 22px; }
          .brand h1 { margin: 0 0 6px; font-size: 24px; }
          .brand p { margin: 0; color: #facc15; font-size: 13px; }
          .row { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid #e2e8f0; padding: 13px 0; }
          .label { color: #64748b; }
          .amount { margin-top: 22px; background: #fef3c7; padding: 18px; font-size: 22px; font-weight: bold; }
          .footer { margin-top: 28px; color: #64748b; font-size: 12px; line-height: 1.6; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="brand">
            <h1>EduFlow ERP</h1>
            <p>FEE PAYMENT RECEIPT · DEMO</p>
          </div>
          <div class="row"><span class="label">Receipt Number</span><strong>${escapeHtml(payment.id)}</strong></div>
          <div class="row"><span class="label">Student Name</span><strong>${escapeHtml(payment.studentName)}</strong></div>
          <div class="row"><span class="label">Student ID</span><strong>${escapeHtml(payment.studentId)}</strong></div>
          <div class="row"><span class="label">Course</span><strong>${escapeHtml(payment.course)}</strong></div>
          <div class="row"><span class="label">Payment Date</span><strong>${escapeHtml(displayDate(payment.date))}</strong></div>
          <div class="row"><span class="label">Payment Method</span><strong>${escapeHtml(payment.method)}</strong></div>
          <div class="row"><span class="label">Transaction Reference</span><strong>${escapeHtml(payment.reference)}</strong></div>
          <div class="row"><span class="label">Description</span><strong>${escapeHtml(payment.note)}</strong></div>
          <div class="amount">Amount Received: ${escapeHtml(money(payment.amount))}</div>
          <div class="footer">
            This is a demonstration receipt generated by the EduFlow ERP frontend.
            It is not proof of an actual payment. Connect and verify payment through
            the authorized backend before using receipts operationally.
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  function resetFilters() {
    setSearch("");
    setMethodFilter("All");
    setFromDate("");
    setToDate("");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back
            </button>

               <h1 className="text-2xl font-bold tracking-tight text-[#10233f] sm:text-3xl">
              Receipts & Payments
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Record fee payments, review transactions and print demo receipts.
            </p>
          </div>

          <button
            onClick={openNewPayment}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-300 sm:self-auto"
          >
            <Plus size={18} />
            Record Payment
          </button>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss notification">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Total Recorded Collection"
            value={money(totalCollected)}
            note="All demo transactions"
            icon={<Wallet size={21} />}
          />
          <SummaryCard
            title="Today's Collection"
            value={money(todayCollected)}
            note={`${payments.filter((p) => p.date === today()).length} payment(s) dated today`}
            icon={<IndianRupee size={21} />}
          />
          <SummaryCard
            title="Digital Payments"
            value={String(cashlessCount)}
            note="UPI, bank transfer or card"
            icon={<CreditCard size={21} />}
          />
        </section>

        {/* Transaction Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#10233f]">
                Payment Transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter and export receipt records.
              </p>
            </div>

            <button
              onClick={exportCSV}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-semibold transition hover:bg-slate-50 xl:self-auto"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search receipt or student..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
            </select>

            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              aria-label="From date"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            />

            <div className="flex gap-2">
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                aria-label="To date"
                className="min-w-0 w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-amber-400"
              />
              <button
                onClick={resetFilters}
                title="Reset filters"
                aria-label="Reset filters"
                className="rounded-xl border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing {filteredPayments.length} of {payments.length} records
            </p>
            <p className="text-xs font-semibold text-slate-600">
              Filtered total:{" "}
              {money(
                filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-2375 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Receipt</th>
                  <th className="px-4 py-4">Student</th>
                  <th className="px-4 py-4">Payment Date</th>
                  <th className="px-4 py-4">Method</th>
                  <th className="px-4 py-4">Reference</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="font-bold text-[#10233f]">{payment.id}</p>
                      <p className="mt-1 text-xs text-slate-500">{payment.note}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="whitespace-nowrap font-semibold text-slate-900">
                        {payment.studentName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.studentId} · {payment.course}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {displayDate(payment.date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                        {payment.method === "Cash" ? (
                          <Wallet size={14} />
                        ) : (
                          <CreditCard size={14} />
                        )}
                        {payment.method}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {payment.reference}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-[#10233f]">
                      {money(payment.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          aria-label={`View receipt ${payment.id}`}
                          title="View receipt"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => printReceipt(payment)}
                          aria-label={`Print receipt ${payment.id}`}
                          title="Print receipt"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <Receipt size={30} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-800">
                        No payment records found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try different filters or record a new demo payment.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Demo environment · Records are held in page state and reset on refresh.
          </div>
        </section>

        {/* Record Payment Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-form-title"
              className="my-6 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
                <div>
                  <h2
                    id="payment-form-title"
                    className="text-xl font-bold text-[#10233f]"
                  >
                    Record Fee Payment
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter details to create a demo receipt.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  aria-label="Close payment form"
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitPayment} className="space-y-5 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Student ID">
                    <input
                      required
                      value={form.studentId}
                      onChange={(event) =>
                        setForm({ ...form, studentId: event.target.value })
                      }
                      placeholder="e.g. STU007"
                      className="payment-input"
                    />
                  </FormField>

                  <FormField label="Student Name">
                    <input
                      required
                      value={form.studentName}
                      onChange={(event) =>
                        setForm({ ...form, studentName: event.target.value })
                      }
                      placeholder="Enter full name"
                      className="payment-input"
                    />
                  </FormField>

                  <FormField label="Course / Class">
                    <input
                      required
                      value={form.course}
                      onChange={(event) =>
                        setForm({ ...form, course: event.target.value })
                      }
                      placeholder="e.g. B.Tech - CSE"
                      className="payment-input"
                    />
                  </FormField>

                  <FormField label="Payment Date">
                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        type="date"
                        max={today()}
                        value={form.date}
                        onChange={(event) =>
                          setForm({ ...form, date: event.target.value })
                        }
                        className="payment-input pl-9"
                      />
                    </div>
                  </FormField>

                  <FormField label="Amount Received (₹)">
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) =>
                        setForm({ ...form, amount: event.target.value })
                      }
                      placeholder="Enter amount"
                      className="payment-input"
                    />
                  </FormField>

                  <FormField label="Payment Method">
                    <select
                      value={form.method}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          method: event.target.value as PaymentMethod,
                        })
                      }
                      className="payment-input"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                    </select>
                  </FormField>

                  {form.method !== "Cash" && (
                    <div className="sm:col-span-2">
                      <FormField label="Transaction / Reference Number">
                        <input
                          required
                          value={form.reference}
                          onChange={(event) =>
                            setForm({ ...form, reference: event.target.value })
                          }
                          placeholder="Enter demo transaction reference"
                          className="payment-input"
                        />
                      </FormField>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <FormField label="Payment Description">
                      <textarea
                        rows={3}
                        value={form.note}
                        onChange={(event) =>
                          setForm({ ...form, note: event.target.value })
                        }
                        placeholder="e.g. Semester fee installment"
                        className="payment-input"
                      />
                    </FormField>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Demo receipt preview
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#10233f]">
                    {money(Number(form.amount) || 0)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    This form records a frontend demo entry only. It does not
                    verify or collect real money.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
                  >
                    <CheckCircle2 size={17} />
                    Save Demo Payment
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* Receipt Details Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="receipt-detail-title"
              className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    EduFlow ERP · Demo Receipt
                  </p>
                  <h2
                    id="receipt-detail-title"
                    className="mt-2 text-xl font-bold text-[#10233f]"
                  >
                    {selectedPayment.id}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  aria-label="Close receipt details"
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="my-5 rounded-xl bg-[#10233f] p-5 text-white">
                <p className="text-sm text-slate-300">Amount received</p>
                <p className="mt-2 text-3xl font-bold">
                  {money(selectedPayment.amount)}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  Demo entry recorded
                </div>
              </div>

              <div className="space-y-3">
                <ReceiptRow label="Student" value={selectedPayment.studentName} />
                <ReceiptRow label="Student ID" value={selectedPayment.studentId} />
                <ReceiptRow label="Course" value={selectedPayment.course} />
                <ReceiptRow label="Date" value={displayDate(selectedPayment.date)} />
                <ReceiptRow label="Method" value={selectedPayment.method} />
                <ReceiptRow label="Reference" value={selectedPayment.reference} />
                <ReceiptRow label="Description" value={selectedPayment.note} />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => printReceipt(selectedPayment)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
                >
                  <Printer size={17} />
                  Print Receipt
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="flex flex-wrap justify-between gap-2 py-2 text-xs text-slate-400">
          <span>EduFlow ERP · Finance Management</span>
          <span>Receipts & Payments · Demo Environment</span>
        </footer>
      </div>

      <style jsx global>{`
        .payment-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          background: #fff;
          color: #1e293b;
        }
        .payment-input:focus {
          border-color: #fbbf24;
          box-shadow: 0 0 0 2px rgb(251 191 36 / 20%);
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 wrap-break-words text-2xl font-bold tracking-tight text-[#10233f]">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{note}</p>
        </div>
        <div className="rounded-xl bg-amber-100 p-3 text-amber-800">
          {icon}
        </div>
      </div>
    </article>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[65%] wrap-break-words text-right font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
