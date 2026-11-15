"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Search,
  GraduationCap,
  BriefcaseBusiness,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type TeacherStatus = "Active" | "On Leave" | "Inactive";

type Teacher = {
  id: string | number;
  name: string;
  department: string;
  designation: string;
  status: TeacherStatus;
  joiningDate: string;
};

type LeaveRequest = {
  id: string | number;
  teacherName: string;
  department: string;
  type: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    "On Leave": "bg-yellow-100 text-yellow-700",
    Inactive: "bg-gray-100 text-gray-600",
    Approved: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function TeacherReportsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [teachersRes, leavesRes] = await Promise.allSettled([
          api.get("/teachers"),
          api.get("/attendance/leaves?role=TEACHER"),
        ]);

        if (teachersRes.status === "fulfilled" && teachersRes.value?.teachers) {
          const mappedTeachers: Teacher[] = teachersRes.value.teachers.map((t: any, idx: number) => {
            const rawStatus = (t.status || "Active").toLowerCase();
            const status: TeacherStatus =
              rawStatus === "on leave" || rawStatus === "on_leave"
                ? "On Leave"
                : rawStatus === "inactive"
                ? "Inactive"
                : "Active";

            return {
              id: t.teacherId || t._id || idx + 1,
              name: t.name,
              department: t.department || "General Academics",
              designation: t.designation || "Faculty",
              status,
              joiningDate: t.joiningDate
                ? t.joiningDate.slice(0, 10)
                : t.createdAt
                ? t.createdAt.slice(0, 10)
                : "—",
            };
          });
          setTeachers(mappedTeachers);
        }

        if (leavesRes.status === "fulfilled" && leavesRes.value?.leaves) {
          const mappedLeaves: LeaveRequest[] = leavesRes.value.leaves.map((l: any, idx: number) => {
            const days =
              l.days ||
              (l.startDate && l.endDate
                ? Math.max(1, Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 3600 * 24)) + 1)
                : 1);
            const status =
              l.status === "APPROVED" || l.status === "Approved"
                ? "Approved"
                : l.status === "REJECTED" || l.status === "Rejected"
                ? "Rejected"
                : "Pending";

            return {
              id: l._id || idx + 1,
              teacherName: l.applicantName || l.teacher?.name || l.user?.name || "Unknown Teacher",
              department: l.department || l.teacher?.department || l.user?.department || "Unassigned",
              type: l.leaveType || l.type || "Casual",
              days,
              status,
            };
          });
          setLeaveRequests(mappedLeaves);
        }
      } catch (err) {
        console.error("Failed to load teacher reports:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const departments = useMemo(() => {
    return [
      "All Departments",
      ...Array.from(new Set(teachers.map((teacher) => teacher.department))).filter(Boolean),
    ];
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesDepartment =
        department === "All Departments" || teacher.department === department;

      const matchesStatus =
        status === "All Status" || teacher.status === status;

      const matchesSearch =
        teacher.name.toLowerCase().includes(search.toLowerCase()) ||
        teacher.designation.toLowerCase().includes(search.toLowerCase());

      return matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [teachers, department, status, search]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter(
      (leave) =>
        department === "All Departments" ||
        leave.department === department
    );
  }, [leaveRequests, department]);

  const activeCount = filteredTeachers.filter(
    (teacher) => teacher.status === "Active"
  ).length;

  const onLeaveCount = filteredTeachers.filter(
    (teacher) => teacher.status === "On Leave"
  ).length;

  const inactiveCount = filteredTeachers.filter(
    (teacher) => teacher.status === "Inactive"
  ).length;

  const approvedLeaves = filteredLeaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  const pendingLeaves = filteredLeaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const departmentSummary = useMemo(() => {
    const summary = new Map<string, number>();

    filteredTeachers.forEach((teacher) => {
      summary.set(
        teacher.department,
        (summary.get(teacher.department) || 0) + 1
      );
    });

    return Array.from(summary.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [filteredTeachers]);

  const exportCSV = () => {
    const headers = [
      "Teacher ID",
      "Teacher Name",
      "Department",
      "Designation",
      "Status",
      "Joining Date",
    ];

    const rows = filteredTeachers.map((teacher) => [
      teacher.id,
      teacher.name,
      teacher.department,
      teacher.designation,
      teacher.status,
      teacher.joiningDate,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "teacher-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center cursor-pointer gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            Teacher Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze teacher strength, departments and leave records.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredTeachers.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400 disabled:opacity-50 cursor-pointer"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Search size={18} className="text-gray-500" />
          <h2 className="font-semibold text-slate-900">Report Filters</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search teacher or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          />

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            {departments.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>On Leave</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Teacher Statistics */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Teacher Overview
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Teachers"
            value={loading ? 0 : filteredTeachers.length}
            icon={Users}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            title="Active Teachers"
            value={loading ? 0 : activeCount}
            icon={UserCheck}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            title="On Leave"
            value={loading ? 0 : onLeaveCount}
            icon={CalendarDays}
            color="bg-yellow-100 text-yellow-700"
          />
          <StatCard
            title="Inactive Teachers"
            value={loading ? 0 : inactiveCount}
            icon={UserX}
            color="bg-red-100 text-red-700"
          />
        </div>
      </div>

      {/* Department Summary */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BriefcaseBusiness size={20} className="text-yellow-600" />
            <h2 className="font-bold text-slate-900">
              Department-wise Teacher Count
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              <Loader2 className="mr-2 animate-spin text-yellow-500" size={18} />
              Loading department counts...
            </div>
          ) : departmentSummary.length > 0 ? (
            <div className="space-y-5">
              {departmentSummary.map((item) => {
                const percentage =
                  filteredTeachers.length > 0
                    ? (item.count / filteredTeachers.length) * 100
                    : 0;

                return (
                  <div key={item.name}>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-700">
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-900">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              No department data found.
            </p>
          )}
        </div>

        {/* Leave Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays size={20} className="text-yellow-600" />
            <h2 className="font-bold text-slate-900">Leave Summary</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-700">Approved Leaves</p>
              <p className="mt-2 text-2xl font-bold text-green-800">
                {loading ? 0 : approvedLeaves}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-700">Pending Leaves</p>
              <p className="mt-2 text-2xl font-bold text-yellow-800">
                {loading ? 0 : pendingLeaves}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                <Loader2 className="mr-2 animate-spin text-yellow-500" size={18} />
                Loading leave records...
              </div>
            ) : filteredLeaves.length === 0 ? (
              <p className="py-5 text-center text-sm text-gray-500">
                No leave records found in MongoDB.
              </p>
            ) : (
              filteredLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {leave.teacherName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {leave.type} · {leave.days} days
                    </p>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Teacher Details Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap size={20} className="text-yellow-600" />
              <h2 className="font-bold text-slate-900">
                Teacher Details Report
              </h2>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredTeachers.length} teacher records
            </p>
          </div>

          <span className="text-xs font-semibold text-emerald-600">
            Connected to MongoDB
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-187.5 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Teacher</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Designation</th>
                <th className="px-5 py-4">Joining Date</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    <Loader2 className="mr-2 inline animate-spin text-yellow-500" size={18} />
                    Loading teacher reports...
                  </td>
                </tr>
              ) : filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {teacher.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {teacher.id}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {teacher.department}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {teacher.designation}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {new Date(
                      teacher.joiningDate + "T00:00:00"
                    ).toLocaleDateString("en-IN")}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={teacher.status} />
                  </td>
                </tr>
              ))}

              {!loading && filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    No teacher records found in MongoDB.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}