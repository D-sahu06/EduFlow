
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  X,
  Search,
  Clock,
  ClipboardList,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveRequest = {
  id: number;
  student: string;
  rollNo: string;
  className: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  appliedOn: string;
  status: LeaveStatus;
};

const initialRequests: LeaveRequest[] = [
  {
    id: 1,
    student: "Ananya Verma",
    rollNo: "STU002",
    className: "Class 10 - A",
    leaveType: "Sick Leave",
    fromDate: "2026-10-27",
    toDate: "2026-10-28",
    days: 2,
    reason: "Not feeling well and need rest.",
    appliedOn: "2026-10-26",
    status: "Pending",
  },
  {
    id: 2,
    student: "Arjun Jain",
    rollNo: "STU005",
    className: "Class 9 - B",
    leaveType: "Personal Leave",
    fromDate: "2026-10-29",
    toDate: "2026-10-29",
    days: 1,
    reason: "Family function at home.",
    appliedOn: "2026-10-25",
    status: "Pending",
  },
  {
    id: 3,
    student: "Isha Gupta",
    rollNo: "STU006",
    className: "Class 9 - A",
    leaveType: "Medical Leave",
    fromDate: "2026-10-20",
    toDate: "2026-10-21",
    days: 2,
    reason: "Doctor appointment and recovery.",
    appliedOn: "2026-10-19",
    status: "Approved",
  },
  {
    id: 4,
    student: "Kabir Joshi",
    rollNo: "STU007",
    className: "Class 9 - B",
    leaveType: "Personal Leave",
    fromDate: "2026-10-22",
    toDate: "2026-10-22",
    days: 1,
    reason: "Personal reasons.",
    appliedOn: "2026-10-20",
    status: "Rejected",
  },
  {
    id: 5,
    student: "Rohan Patel",
    rollNo: "STU003",
    className: "Class 10 - B",
    leaveType: "Sick Leave",
    fromDate: "2026-10-30",
    toDate: "2026-10-31",
    days: 2,
    reason: "Requested leave due to illness.",
    appliedOn: "2026-10-26",
    status: "Pending",
  },
];

const statusStyles: Record<LeaveStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LeaveManagementPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [notice, setNotice] = useState("");
  const router = useRouter();

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        request.student.toLowerCase().includes(search.toLowerCase()) ||
        request.rollNo.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesType =
        typeFilter === "All" || request.leaveType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, search, statusFilter, typeFilter]);

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
  };

  function updateStatus(id: number, status: LeaveStatus) {
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );

    setSelectedRequest((current) =>
      current?.id === id ? { ...current, status } : current
    );

    setNotice(`Leave request ${status.toLowerCase()} successfully.`);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>
          
          <h1 className="mt-2 text-2xl font-extrabold text-gray-950 md:text-3xl">
            Leave Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review student leave applications and manage approval status.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
          >
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 hover:bg-green-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Requests",
              value: counts.total,
              icon: ClipboardList,
              color: "text-gray-900",
              bg: "bg-yellow-100",
            },
            {
              label: "Pending",
              value: counts.pending,
              icon: Clock,
              color: "text-yellow-800",
              bg: "bg-yellow-100",
            },
            {
              label: "Approved",
              value: counts.approved,
              icon: CheckCircle2,
              color: "text-green-700",
              bg: "bg-green-100",
            },
            {
              label: "Rejected",
              value: counts.rejected,
              icon: XCircle,
              color: "text-red-700",
              bg: "bg-red-100",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {item.label}
                  </p>
                  <div className={`rounded-xl p-2.5 ${item.bg}`}>
                    <Icon size={20} className={item.color} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-gray-950">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-950">Filter Requests</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or roll no."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              <option value="All">All leave types</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Personal Leave">Personal Leave</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                Leave Applications
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredRequests.length} requests found
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays size={18} />
              Academic leave register
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Leave Type</th>
                  <th className="px-5 py-4">Leave Period</th>
                  <th className="px-5 py-4">Days</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="align-top transition hover:bg-yellow-50/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {request.student}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {request.rollNo} · {request.className}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {request.leaveType}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      <p>{formatDate(request.fromDate)}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        to {formatDate(request.toDate)}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-700">
                      {request.days}
                    </td>

                    <td className="max-w-56 px-5 py-4 text-gray-600">
                      <p className="line-clamp-2">{request.reason}</p>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="mt-1 text-xs font-bold text-yellow-700 hover:underline"
                      >
                        View details
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyles[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {request.status === "Pending" ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() =>
                              updateStatus(request.id, "Approved")
                            }
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              updateStatus(request.id, "Rejected")
                            }
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Action completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No leave requests match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-400">
            Demo implementation · Changes currently remain in page state only.
          </div>
        </section>

        {selectedRequest && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-dialog-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2
                    id="leave-dialog-title"
                    className="text-xl font-extrabold text-gray-950"
                  >
                    Leave Request Details
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedRequest.student} · {selectedRequest.rollNo}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close details"
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Class</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRequest.className}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Leave Type</span>
                  <span className="font-semibold text-gray-900">
                    {selectedRequest.leaveType}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-right font-semibold text-gray-900">
                    {formatDate(selectedRequest.fromDate)} –{" "}
                    {formatDate(selectedRequest.toDate)} ({selectedRequest.days} day(s))
                  </span>
                </div>
                <div>
                  <p className="mb-2 text-gray-500">Reason</p>
                  <p className="rounded-xl bg-gray-50 p-4 leading-6 text-gray-800">
                    {selectedRequest.reason}
                  </p>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Applied On</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(selectedRequest.appliedOn)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[selectedRequest.status]}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {selectedRequest.status === "Pending" && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      updateStatus(selectedRequest.id, "Approved");
                      setSelectedRequest(null);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700"
                  >
                    <Check size={17} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      updateStatus(selectedRequest.id, "Rejected");
                      setSelectedRequest(null);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700"
                  >
                    <X size={17} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
