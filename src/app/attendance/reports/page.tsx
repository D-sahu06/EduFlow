
"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileBarChart,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";

type ReportRecord = {
  id: number;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
};

const demoRecords: ReportRecord[] = [
  { id: 1, name: "Aarav Sharma", rollNo: "STU001", className: "Class 10", section: "A", total: 20, present: 19, absent: 1, late: 0, leave: 0 },
  { id: 2, name: "Ananya Verma", rollNo: "STU002", className: "Class 10", section: "A", total: 20, present: 15, absent: 4, late: 1, leave: 0 },
  { id: 3, name: "Rohan Patel", rollNo: "STU003", className: "Class 10", section: "B", total: 20, present: 17, absent: 2, late: 1, leave: 0 },
  { id: 4, name: "Priya Singh", rollNo: "STU004", className: "Class 9", section: "A", total: 20, present: 20, absent: 0, late: 0, leave: 0 },
  { id: 5, name: "Arjun Jain", rollNo: "STU005", className: "Class 9", section: "B", total: 20, present: 13, absent: 5, late: 1, leave: 1 },
  { id: 6, name: "Isha Gupta", rollNo: "STU006", className: "Class 9", section: "A", total: 20, present: 18, absent: 1, late: 1, leave: 0 },
  { id: 7, name: "Kabir Joshi", rollNo: "STU007", className: "Class 9", section: "B", total: 20, present: 16, absent: 3, late: 0, leave: 1 },
];

function percentage(record: ReportRecord) {
  if (record.total === 0) return 0;
  return Math.round((record.present / record.total) * 100);
}

export default function AttendanceReportsPage() {
  const [classFilter, setClassFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-26");

  const records = useMemo(() => {
    return demoRecords.filter((record) => {
      const matchesClass =
        classFilter === "All" || record.className === classFilter;

      const matchesSearch =
        record.name.toLowerCase().includes(search.toLowerCase()) ||
        record.rollNo.toLowerCase().includes(search.toLowerCase());

      return matchesClass && matchesSearch;
    });
  }, [classFilter, search]);

  const totals = useMemo(() => {
    const total = records.reduce((sum, r) => sum + r.total, 0);
    const present = records.reduce((sum, r) => sum + r.present, 0);
    const absent = records.reduce((sum, r) => sum + r.absent, 0);
    const late = records.reduce((sum, r) => sum + r.late, 0);
    const leave = records.reduce((sum, r) => sum + r.leave, 0);

    return {
      students: records.length,
      total,
      present,
      absent,
      late,
      leave,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  }, [records]);

  const lowAttendance = records.filter((record) => percentage(record) < 75);

  function exportCSV() {
    const header = [
      "Student",
      "Roll Number",
      "Class",
      "Section",
      "Total Sessions",
      "Present",
      "Absent",
      "Late",
      "On Leave",
      "Attendance Percentage",
    ];

    const rows = records.map((r) => [
      r.name,
      r.rollNo,
      r.className,
      r.section,
      r.total,
      r.present,
      r.absent,
      r.late,
      r.leave,
      `${percentage(r)}%`,
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
    link.download = "attendance-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    {
      label: "Students",
      value: totals.students,
      icon: Users,
      style: "bg-yellow-100 text-yellow-800",
    },
    {
      label: "Attendance Rate",
      value: `${totals.rate}%`,
      icon: CheckCircle2,
      style: "bg-green-100 text-green-700",
    },
    {
      label: "Absent Sessions",
      value: totals.absent,
      icon: XCircle,
      style: "bg-red-100 text-red-700",
    },
    {
      label: "Late Sessions",
      value: totals.late,
      icon: Clock,
      style: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Dashboard / Attendance / Reports
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-gray-950 md:text-3xl">
              Attendance Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review attendance performance and identify students who need attention.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-300"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-950">Report Filters</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-semibold text-gray-700">
              Start Date
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-yellow-400"
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              End Date
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-yellow-400"
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Class
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-yellow-400"
              >
                <option value="All">All Classes</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
              </select>
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Search Student
              <div className="relative mt-2">
                <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or roll number"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 font-normal outline-none focus:border-yellow-400"
                />
              </div>
            </label>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Demo report data is illustrative; date filters are shown for the planned reporting period.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <div className={`rounded-xl p-2.5 ${stat.style}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-gray-950">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <FileBarChart size={20} className="text-yellow-600" />
              <h2 className="font-bold text-gray-950">Attendance Overview</h2>
            </div>

            <div className="space-y-5">
              {[
                { label: "Present", value: totals.present, color: "bg-green-500" },
                { label: "Absent", value: totals.absent, color: "bg-red-500" },
                { label: "Late", value: totals.late, color: "bg-yellow-400" },
                { label: "On Leave", value: totals.leave, color: "bg-blue-500" },
              ].map((item) => {
                const totalSessions = totals.present + totals.absent + totals.late + totals.leave;
                const share = totalSessions
                  ? Math.round((item.value / totalSessions) * 100)
                  : 0;

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <span className="text-gray-500">
                        {item.value} sessions ({share}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-500" />
              <h2 className="font-bold text-gray-950">Low Attendance</h2>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              Students below 75% attendance
            </p>

            {lowAttendance.length > 0 ? (
              <div className="space-y-3">
                {lowAttendance.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-xl border border-orange-100 bg-orange-50 p-3"
                  >
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                      <span>{student.rollNo} · {student.className}</span>
                      <span className="font-bold text-orange-700">
                        {percentage(student)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
                No students below 75% in this selection.
              </p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h2 className="font-bold text-gray-950">Student-wise Attendance</h2>
            <p className="mt-1 text-sm text-gray-500">
              Attendance summaries for the selected class.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Present</th>
                  <th className="px-5 py-4">Absent</th>
                  <th className="px-5 py-4">Late</th>
                  <th className="px-5 py-4">Leave</th>
                  <th className="px-5 py-4">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((record) => {
                  const rate = percentage(record);
                  return (
                    <tr key={record.id} className="hover:bg-yellow-50/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{record.name}</p>
                        <p className="mt-1 text-xs text-gray-400">{record.rollNo}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {record.className} - {record.section}
                      </td>
                      <td className="px-5 py-4 font-semibold text-green-700">{record.present}</td>
                      <td className="px-5 py-4 font-semibold text-red-600">{record.absent}</td>
                      <td className="px-5 py-4 text-gray-600">{record.late}</td>
                      <td className="px-5 py-4 text-gray-600">{record.leave}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${rate < 75 ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className={`font-bold ${rate < 75 ? "text-red-600" : "text-green-700"}`}>
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      No students match your search or class filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-400">
            {records.length} student records · Demo data
          </div>
        </section>
      </div>
    </main>
  );
}
