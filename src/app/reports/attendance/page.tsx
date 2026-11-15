"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Users,
  UserCheck,
  UserX,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type AttendanceRecord = {
  id: string;
  studentId: string;
  name: string;
  className: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "On Leave";
};

const statusStyles = {
  Present: "bg-green-100 text-green-700",
  Absent: "bg-red-100 text-red-700",
  Late: "bg-amber-100 text-amber-700",
  "On Leave": "bg-blue-100 text-blue-700",
};

export default function AttendanceReportsPage() {
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role);
    fetchAttendance();
  }, []);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; records?: any[]; attendance?: any[] }>(
        "/attendance"
      );

      const attList = res?.records || res?.attendance || [];

      if (attList.length > 0) {
        const validStatuses = new Set<AttendanceRecord["status"]>([
          "Present",
          "Absent",
          "Late",
          "On Leave",
        ]);
        const mapped: AttendanceRecord[] = attList
          .filter((item: any) => Boolean(item._id && validStatuses.has(item.status)))
          .map((item: any) => ({
            id: item._id,
            studentId: item.student?._id || item.student || "",
            name: item.studentName || item.student?.name || "",
            className: item.className || item.student?.className || "—",
            date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
            status: item.status,
          }));
        setRecords(mapped);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  const canMark = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(
    userRole
  );

  const present = records.filter((r) => r.status === "Present").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const late = records.filter((r) => r.status === "Late").length;

  const attendanceRate =
    records.length > 0
      ? Math.round(((present + late) / records.length) * 100)
      : 0;

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesClass =
      classFilter === "All" || record.className === classFilter;

    const matchesStatus =
      statusFilter === "All" || record.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const availableClasses = Array.from(
    new Set(records.map((r) => r.className).filter((c) => c && c !== "—"))
  );

  async function updateStatus(
    record: AttendanceRecord,
    status: AttendanceRecord["status"]
  ) {
    if (!canMark) return;

    try {
      await api.put(`/attendance/${record.id}`, { status });

      setRecords((current) =>
        current.map((r) =>
          r.id === record.id ? { ...r, status } : r
        )
      );
    } catch {
      // Keep UI synced with server state if update fails
    }
  }

  const stats = [
    {
      title: "Total Students",
      value: records.length,
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Present",
      value: present,
      icon: UserCheck,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Absent",
      value: absent,
      icon: UserX,
      color: "bg-red-100 text-red-700",
    },
    {
      title: "Attendance Rate",
      value: `${attendanceRate}%`,
      icon: CalendarCheck,
      color: "bg-amber-100 text-amber-700",
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

        <section>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <CalendarCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                Attendance Reports
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitor daily student attendance and update records.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
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
              Student Attendance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search students, filter records, and update attendance status.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="animate-spin text-amber-500" size={28} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Update Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-4 font-medium text-slate-800">
                        {record.name}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {record.className}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {record.date}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[record.status] || "bg-slate-100 text-slate-700"}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {canMark ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              title="Mark Present"
                              onClick={() => updateStatus(record, "Present")}
                              className="rounded-md bg-green-50 p-2 text-green-700 hover:bg-green-100"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              type="button"
                              title="Mark Absent"
                              onClick={() => updateStatus(record, "Absent")}
                              className="rounded-md bg-red-50 p-2 text-red-700 hover:bg-red-100"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(record, "Late")}
                              className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Late
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle size={15} className="text-green-600" />
            <span>
              Present: {present} · Absent: {absent} · Late: {late}
            </span>
          </div>
        </section>

      </div>
    </main>
  );
}