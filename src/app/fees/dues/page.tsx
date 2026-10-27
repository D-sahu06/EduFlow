
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Download,
  SlidersHorizontal,
  // Clock3,
  IndianRupee,
  Users,
  AlertTriangle,
  Eye,
  CircleCheck,
  CalendarDays,
  X,
} from "lucide-react";

type DueStatus = "Overdue" | "Due Soon" | "Partial";

type DueRecord = {
  id: string;
  studentId: string;
  name: string;
  course: string;
  semester: string;
  totalFee: number;
  paid: number;
  dueDate: string;
  status: DueStatus;
};

const initialDues: DueRecord[] = [
  {
    id: "DUE-1001",
    studentId: "STU001",
    name: "Aarav Sharma",
    course: "B.Tech - CSE",
    semester: "Semester 5",
    totalFee: 85000,
    paid: 55000,
    dueDate: "2026-10-10",
    status: "Overdue",
  },
  {
    id: "DUE-1002",
    studentId: "STU002",
    name: "Priya Verma",
    course: "B.Tech - IT",
    semester: "Semester 3",
    totalFee: 80000,
    paid: 60000,
    dueDate: "2026-10-29",
    status: "Due Soon",
  },
  {
    id: "DUE-1003",
    studentId: "STU003",
    name: "Rahul Patel",
    course: "BBA",
    semester: "Semester 1",
    totalFee: 54000,
    paid: 24000,
    dueDate: "2026-10-15",
    status: "Overdue",
  },
  {
    id: "DUE-1004",
    studentId: "STU004",
    name: "Sneha Gupta",
    course: "B.Com",
    semester: "Semester 3",
    totalFee: 41000,
    paid: 26000,
    dueDate: "2026-11-05",
    status: "Partial",
  },
  {
    id: "DUE-1005",
    studentId: "STU005",
    name: "Karan Mehta",
    course: "B.Tech - CSE",
    semester: "Semester 7",
    totalFee: 85000,
    paid: 65000,
    dueDate: "2026-10-20",
    status: "Overdue",
  },
  {
    id: "DUE-1006",
    studentId: "STU006",
    name: "Neha Gupta",
    course: "B.Sc - Physics",
    semester: "Semester 1",
    totalFee: 46500,
    paid: 30000,
    dueDate: "2026-11-12",
    status: "Partial",
  },
];

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function PendingDuesPage() {
  const router = useRouter();

  const [dues, setDues] = useState<DueRecord[]>(initialDues);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("dueDate");
  const [selectedDue, setSelectedDue] = useState<DueRecord | null>(null);
  const [notice, setNotice] = useState("");

  const getBalance = (due: DueRecord) =>
    Math.max(0, due.totalFee - due.paid);

  const filteredDues = useMemo(() => {
    const filtered = dues.filter((due) => {
      const term = search.toLowerCase();

      const matchesSearch =
        due.name.toLowerCase().includes(term) ||
        due.studentId.toLowerCase().includes(term) ||
        due.id.toLowerCase().includes(term);

      const matchesCourse =
        courseFilter === "All" || due.course === courseFilter;

      const matchesStatus =
        statusFilter === "All" || due.status === statusFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus &&
        getBalance(due) > 0
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "highest") {
        return getBalance(b) - getBalance(a);
      }
      if (sortBy === "lowest") {
        return getBalance(a) - getBalance(b);
      }
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [dues, search, courseFilter, statusFilter, sortBy]);

  const totalOutstanding = dues.reduce(
    (sum, due) => sum + getBalance(due),
    0
  );

  const overdueDues = dues.filter(
    (due) => due.status === "Overdue" && getBalance(due) > 0
  );

  const dueSoonCount = dues.filter(
    (due) => due.status === "Due Soon" && getBalance(due) > 0
  ).length;

  const totalStudents = dues.filter(
    (due) => getBalance(due) > 0
  ).length;

  function recordDemoPayment(due: DueRecord) {
    const balance = getBalance(due);
    const rawAmount = window.prompt(
      `Outstanding balance: ${formatMoney(balance)}\nEnter the demo payment amount:`
    );

    if (rawAmount === null) return;

    const amount = Number(rawAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > balance
    ) {
      setNotice("Enter a valid amount not exceeding the outstanding balance.");
      return;
    }

    setDues((previous) =>
      previous.map((item) =>
        item.id === due.id
          ? {
              ...item,
              paid: item.paid + amount,
              status:
                item.paid + amount >= item.totalFee
                  ? item.status
                  : item.status,
            }
          : item
      )
    );

    setNotice(
      `Demo payment of ${formatMoney(amount)} recorded for ${due.name}.`
    );
    setSelectedDue(null);
  }

  function exportCSV() {
    const headers = [
      "Due ID",
      "Student ID",
      "Student Name",
      "Course",
      "Semester",
      "Total Fee",
      "Paid Amount",
      "Outstanding Balance",
      "Due Date",
      "Status",
    ];

    const rows = filteredDues.map((due) => [
      due.id,
      due.studentId,
      due.name,
      due.course,
      due.semester,
      due.totalFee,
      due.paid,
      getBalance(due),
      due.dueDate,
      due.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    const blobUrl = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "eduflow-pending-dues.csv";
    link.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            

            <h1 className="text-2xl font-bold tracking-tight text-[#10233f] sm:text-3xl">
              Pending Fee Dues
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor outstanding balances, identify overdue accounts and
              record demo payments for follow-up.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:self-auto"
          >
            <Download size={17} />
            Export CSV
          </button>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Outstanding"
            value={formatMoney(totalOutstanding)}
            subtitle="Across demo records"
            icon={<IndianRupee size={21} />}
            accent="yellow"
          />
          <MetricCard
            title="Students With Dues"
            value={String(totalStudents)}
            subtitle="Accounts with balance"
            icon={<Users size={21} />}
            accent="navy"
          />
          <MetricCard
            title="Overdue Accounts"
            value={String(overdueDues.length)}
            subtitle="Past due date"
            icon={<AlertTriangle size={21} />}
            accent="red"
          />
          <MetricCard
            title="Due Soon"
            value={String(dueSoonCount)}
            subtitle="Upcoming payment deadline"
            icon={<CalendarDays size={21} />}
            accent="green"
          />
        </section>

        {/* Overdue Notice */}
        {overdueDues.length > 0 && (
          <section className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <AlertTriangle size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Overdue payments require attention
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {overdueDues.length} demo account(s) are marked overdue.
                  Review the balances and follow up.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("Overdue")}
              className="self-start whitespace-nowrap rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:self-auto"
            >
              View overdue
            </button>
          </section>
        )}

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-slate-500" />
            <h2 className="font-bold text-[#10233f]">Search & Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, student ID or due ID..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Courses</option>
              <option value="B.Tech - CSE">B.Tech - CSE</option>
              <option value="B.Tech - IT">B.Tech - IT</option>
              <option value="BBA">BBA</option>
              <option value="B.Com">B.Com</option>
              <option value="B.Sc - Physics">B.Sc - Physics</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Statuses</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Showing {filteredDues.length} of {totalStudents} outstanding
              account(s)
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="due-sort" className="text-xs text-slate-500">
                Sort by
              </label>
              <select
                id="due-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-amber-400"
              >
                <option value="dueDate">Due date</option>
                <option value="highest">Highest balance</option>
                <option value="lowest">Lowest balance</option>
              </select>
            </div>
          </div>
        </section>

        {/* Dues Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-[#10233f]">
                Student Outstanding Accounts
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Review fee balances and payment deadlines
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              Demo records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-4 py-4">Course / Semester</th>
                  <th className="px-4 py-4">Total Fee</th>
                  <th className="px-4 py-4">Paid</th>
                  <th className="px-4 py-4">Outstanding</th>
                  <th className="px-4 py-4">Due Date</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDues.map((due) => {
                  const balance = getBalance(due);

                  return (
                    <tr
                      key={due.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10233f] text-sm font-bold text-white">
                            {due.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <p className="whitespace-nowrap font-semibold text-slate-900">
                              {due.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {due.studentId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap font-medium text-slate-700">
                          {due.course}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {due.semester}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatMoney(due.totalFee)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatMoney(due.paid)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                        {formatMoney(balance)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(due.dueDate)}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={due.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedDue(due)}
                            title="View account details"
                            aria-label={`View details for ${due.name}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => recordDemoPayment(due)}
                            className="whitespace-nowrap rounded-lg bg-[#10233f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1b365b]"
                          >
                            Record Payment
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredDues.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <CircleCheck
                        size={30}
                        className="mx-auto mb-3 text-emerald-600"
                      />
                      <p className="font-semibold text-slate-800">
                        No outstanding accounts found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try changing the search terms or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              {filteredDues.length > 0 && (
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-4 text-right text-sm font-semibold text-slate-600"
                    >
                      Filtered outstanding total
                    </td>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-sm font-bold text-[#10233f]"
                    >
                      {formatMoney(
                        filteredDues.reduce(
                          (sum, due) => sum + getBalance(due),
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Demo data only. Payment changes are held in page state and are not
            saved to the backend.
          </div>
        </section>

        {/* Account Details Modal */}
        {selectedDue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="due-detail-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account Details
                  </p>
                  <h2
                    id="due-detail-title"
                    className="mt-1 text-xl font-bold text-[#10233f]"
                  >
                    {selectedDue.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedDue.studentId} · {selectedDue.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDue(null)}
                  aria-label="Close details"
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <DetailRow label="Course" value={selectedDue.course} />
                <DetailRow label="Semester" value={selectedDue.semester} />
                <DetailRow
                  label="Total fee"
                  value={formatMoney(selectedDue.totalFee)}
                />
                <DetailRow
                  label="Amount paid"
                  value={formatMoney(selectedDue.paid)}
                />
                <DetailRow
                  label="Due date"
                  value={formatDate(selectedDue.dueDate)}
                />

                <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                  <span className="text-sm font-semibold text-slate-700">
                    Outstanding balance
                  </span>
                  <span className="text-xl font-bold text-[#10233f]">
                    {formatMoney(getBalance(selectedDue))}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setSelectedDue(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => recordDemoPayment(selectedDue)}
                  className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
                >
                  Record Demo Payment
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="flex flex-wrap justify-between gap-2 py-2 text-xs text-slate-400">
          <span>EduFlow ERP · Finance Management</span>
          <span>Pending Dues · Demo Environment</span>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: "yellow" | "navy" | "red" | "green";
}) {
  const accentClasses = {
    yellow: "bg-amber-100 text-amber-800",
    navy: "bg-slate-100 text-[#10233f]",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 wrap-break-words text-2xl font-bold tracking-tight text-[#10233f]">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-3 ${accentClasses[accent]}`}>
          {icon}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: DueStatus }) {
  const classes = {
    Overdue: "bg-red-50 text-red-700 ring-red-100",
    "Due Soon": "bg-amber-50 text-amber-800 ring-amber-100",
    Partial: "bg-blue-50 text-blue-700 ring-blue-100",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
