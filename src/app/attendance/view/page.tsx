
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "Late" | "On Leave";

type AttendanceRecord = {
  id: number;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  date: string;
  status: AttendanceStatus;
};

const initialRecords: AttendanceRecord[] = [
  { id: 1, name: "Aarav Sharma", rollNo: "STU001", className: "Class 10", section: "A", date: "2026-10-26", status: "Present" },
  { id: 2, name: "Ananya Verma", rollNo: "STU002", className: "Class 10", section: "A", date: "2026-10-26", status: "Absent" },
  { id: 3, name: "Rohan Patel", rollNo: "STU003", className: "Class 10", section: "B", date: "2026-10-26", status: "Late" },
  { id: 4, name: "Priya Singh", rollNo: "STU004", className: "Class 9", section: "A", date: "2026-10-26", status: "Present" },
  { id: 5, name: "Arjun Jain", rollNo: "STU005", className: "Class 9", section: "B", date: "2026-10-26", status: "On Leave" },
  { id: 6, name: "Isha Gupta", rollNo: "STU006", className: "Class 10", section: "A", date: "2026-10-25", status: "Present" },
  { id: 7, name: "Kabir Joshi", rollNo: "STU007", className: "Class 9", section: "B", date: "2026-10-25", status: "Absent" },
];

const statusStyles: Record<AttendanceStatus, string> = {
  Present: "bg-green-100 text-green-700",
  Absent: "bg-red-100 text-red-700",
  Late: "bg-yellow-100 text-yellow-800",
  "On Leave": "bg-blue-100 text-blue-700",
};

export default function ViewAttendancePage() {
  const [records] = useState(initialRecords);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("2026-10-26");

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        record.name.toLowerCase().includes(search.toLowerCase()) ||
        record.rollNo.toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        classFilter === "All" || record.className === classFilter;

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      const matchesDate = !dateFilter || record.date === dateFilter;

      return matchesSearch && matchesClass && matchesStatus && matchesDate;
    });
  }, [records, search, classFilter, statusFilter, dateFilter]);

  const counts = {
    present: filteredRecords.filter((r) => r.status === "Present").length,
    absent: filteredRecords.filter((r) => r.status === "Absent").length,
    late: filteredRecords.filter((r) => r.status === "Late").length,
    leave: filteredRecords.filter((r) => r.status === "On Leave").length,
  };

  function exportCSV() {
    const header = ["Student", "Roll No", "Class", "Section", "Date", "Status"];
    const rows = filteredRecords.map((r) => [
      r.name, r.rollNo, r.className, r.section, r.date, r.status,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
   const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back
            </button>
            {/* <p className="text-sm text-gray-500">
              Dashboard / Attendance / View Attendance
            </p> */}
            <h1 className="mt-2 text-2xl font-extrabold text-gray-950 md:text-3xl">
              View Attendance
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Search and review student attendance records.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-300"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Present", value: counts.present, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Absent", value: counts.absent, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Late", value: counts.late, icon: Clock, color: "text-yellow-700", bg: "bg-yellow-50" },
            { label: "On Leave", value: counts.leave, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-gray-950">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-gray-400">Filtered records</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center gap-2">
            <Users size={20} className="text-yellow-600" />
            <h2 className="text-lg font-bold text-gray-950">
              Attendance Records
            </h2>
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-gray-800">
              {filteredRecords.length}
            </span>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or roll no."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              <option value="">All dates</option>
              <option value="2026-10-26">26 Oct 2026</option>
              <option value="2026-10-25">25 Oct 2026</option>
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              <option value="All">All classes</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              <option value="All">All statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-4 font-semibold">Student</th>
                  <th className="px-4 py-4 font-semibold">Roll No.</th>
                  <th className="px-4 py-4 font-semibold">Class</th>
                  <th className="px-4 py-4 font-semibold">Section</th>
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="transition hover:bg-yellow-50/50">
                    <td className="px-4 py-4 font-semibold text-gray-900">{record.name}</td>
                    <td className="px-4 py-4 text-gray-600">{record.rollNo}</td>
                    <td className="px-4 py-4 text-gray-600">{record.className}</td>
                    <td className="px-4 py-4 text-gray-600">{record.section}</td>
                    <td className="px-4 py-4 text-gray-600">{record.date}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyles[record.status]}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No attendance records match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Showing {filteredRecords.length} matching records. Demo data only.
          </p>
        </section>
      </div>
    </main>
  );
}
