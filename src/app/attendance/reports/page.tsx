"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type ReportRecord = {
  id: string;
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

function percentage(record: ReportRecord) {
  if (record.total === 0) return 0;
  return Math.round((record.present / record.total) * 100);
}

export default function AttendanceReportsPage() {
  const router = useRouter();

  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadAttendanceReports = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success?: boolean; records?: any[] }>("/attendance");
      if (res && res.records) {
        const studentAgg: Record<string, ReportRecord> = {};

        res.records.forEach((r: any) => {
          const sName = r.studentName || r.student?.name || "";
          const sRoll = r.rollNumber || r.student?.rollNumber || r.student?.studentId || "—";
          const sClass = r.className || r.student?.className || "—";
          const sSection = r.section || r.student?.section || "—";
          const sId =
            r.student?._id ||
            (typeof r.student === "string" ? r.student : "") ||
            `${sClass.toLowerCase()}|${sSection.toLowerCase()}|${sRoll.toLowerCase()}|${sName.toLowerCase()}`;
          if (!sId || !sName) return;

          if (!studentAgg[sId]) {
            studentAgg[sId] = {
              id: sId,
              name: sName,
              rollNo: sRoll,
              className: sClass,
              section: sSection,
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              leave: 0,
            };
          }

          // Check date filter if provided
          if (startDate && r.date && r.date.slice(0, 10) < startDate) return;
          if (endDate && r.date && r.date.slice(0, 10) > endDate) return;

          studentAgg[sId].total += 1;
          const status = (r.status || "").toLowerCase();
          if (status === "present") studentAgg[sId].present += 1;
          else if (status === "absent") studentAgg[sId].absent += 1;
          else if (status === "late") studentAgg[sId].late += 1;
          else studentAgg[sId].leave += 1;
        });

        setRecords(Object.values(studentAgg));
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Failed to load attendance reports:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceReports();
  }, [startDate, endDate]);

  const filteredRecords = useMemo(() => {
    const normalizedClass = classFilter.trim().toLowerCase();
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesClass =
        !normalizedClass || record.className.toLowerCase().includes(normalizedClass);

      const matchesSearch =
        !normalizedSearch ||
        record.name.toLowerCase().includes(normalizedSearch) ||
        record.rollNo.toLowerCase().includes(normalizedSearch);

      return matchesClass && matchesSearch;
    });
  }, [records, classFilter, search]);

  const totals = useMemo(() => {
    const total = filteredRecords.reduce((sum, r) => sum + r.total, 0);
    const present = filteredRecords.reduce((sum, r) => sum + r.present, 0);
    const absent = filteredRecords.reduce((sum, r) => sum + r.absent, 0);
    const late = filteredRecords.reduce((sum, r) => sum + r.late, 0);
    const leave = filteredRecords.reduce((sum, r) => sum + r.leave, 0);

    return {
      students: filteredRecords.length,
      total,
      present,
      absent,
      late,
      leave,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  }, [filteredRecords]);

  const lowAttendance = filteredRecords.filter((record) => percentage(record) < 75);

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

    const rows = filteredRecords.map((r) => [
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
            <button
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <h1 className="mt-2 text-2xl font-extrabold text-gray-950 md:text-3xl">
              Attendance Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review attendance performance and identify students who need attention.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-300 cursor-pointer"
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
              <input
                type="text"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                placeholder="All Classes"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-yellow-400"
              />
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
                  {loading ? "..." : stat.value}
                </p>
                <p className="mt-1 text-xs text-gray-400">Aggregated database records</p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Student Attendance Analytics</h2>
              <p className="mt-1 text-sm text-gray-500">
                Detailed session breakdown per student from MongoDB
              </p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-gray-800">
              {filteredRecords.length} Students
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                <Loader2 className="animate-spin text-yellow-500" size={18} />
                Calculating attendance metrics from MongoDB...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                No attendance records match the selected filters.
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Sessions</th>
                    <th className="px-5 py-4">Present</th>
                    <th className="px-5 py-4">Absent</th>
                    <th className="px-5 py-4">Late</th>
                    <th className="px-5 py-4">Leave</th>
                    <th className="px-5 py-4">Attendance %</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => {
                    const rate = percentage(record);
                    return (
                      <tr key={record.id} className="hover:bg-yellow-50/40">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{record.name}</p>
                          <p className="mt-1 text-xs text-gray-400">{record.rollNo}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {record.className} - {record.section}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">{record.total}</td>
                        <td className="px-5 py-4 font-semibold text-green-600">{record.present}</td>
                        <td className="px-5 py-4 font-semibold text-red-600">{record.absent}</td>
                        <td className="px-5 py-4 font-semibold text-yellow-700">{record.late}</td>
                        <td className="px-5 py-4 font-semibold text-blue-600">{record.leave}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                rate >= 75
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Low Attendance Section */}
        {lowAttendance.length > 0 && (
          <section className="rounded-2xl border border-red-100 bg-red-50/60 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-red-800">
              <AlertTriangle size={20} />
              <h2 className="font-bold">Students Requiring Intervention (&lt;75% Attendance)</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {lowAttendance.map((student) => (
                <div
                  key={student.id}
                  className="rounded-xl border border-red-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-semibold text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">
                    {student.className} · {student.rollNo}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Attendance:</span>
                    <span className="font-bold text-red-600">{percentage(student)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
