
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Filter,
  Eye,
  Check,
  ArrowLeft,
  X,
  FileText,
} from "lucide-react";

type LeaveStatus = "Pending" | "Approved" | "Rejected";
type LeaveType = "Casual Leave" | "Sick Leave" | "Earned Leave" | "Emergency Leave";

type LeaveRequest = {
  id: number;
  teacherName: string;
  teacherId: string;
  department: string;
  leaveType: LeaveType;
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
    teacherName: "Amit Patel",
    teacherId: "TCH-003",
    department: "Physics",
    leaveType: "Sick Leave",
    fromDate: "2026-11-02",
    toDate: "2026-11-04",
    days: 3,
    reason: "I am not feeling well and need rest as advised by my doctor.",
    appliedOn: "2026-10-28",
    status: "Pending",
  },
  {
    id: 2,
    teacherName: "Priya Verma",
    teacherId: "TCH-002",
    department: "Mathematics",
    leaveType: "Casual Leave",
    fromDate: "2026-11-05",
    toDate: "2026-11-05",
    days: 1,
    reason: "I need one day leave for some personal work.",
    appliedOn: "2026-10-27",
    status: "Pending",
  },
  {
    id: 3,
    teacherName: "Rahul Sharma",
    teacherId: "TCH-001",
    department: "Computer Science",
    leaveType: "Earned Leave",
    fromDate: "2026-10-20",
    toDate: "2026-10-22",
    days: 3,
    reason: "Planning a short family vacation.",
    appliedOn: "2026-10-10",
    status: "Approved",
  },
  {
    id: 4,
    teacherName: "Sneha Gupta",
    teacherId: "TCH-004",
    department: "English",
    leaveType: "Emergency Leave",
    fromDate: "2026-10-25",
    toDate: "2026-10-25",
    days: 1,
    reason: "Family emergency.",
    appliedOn: "2026-10-24",
    status: "Rejected",
  },
  {
    id: 5,
    teacherName: "Vikas Jain",
    teacherId: "TCH-005",
    department: "Chemistry",
    leaveType: "Casual Leave",
    fromDate: "2026-11-10",
    toDate: "2026-11-11",
    days: 2,
    reason: "Personal commitments.",
    appliedOn: "2026-10-29",
    status: "Pending",
  },
];

export default function LeaveManagementPage() {
  const [requests, setRequests] =
    useState<LeaveRequest[]>(initialRequests);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");
  const router = useRouter()

  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequest | null>(null);

  const [confirmation, setConfirmation] = useState<{
    id: number;
    action: "Approved" | "Rejected";
  } | null>(null);

  const [feedback, setFeedback] = useState("");

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected"
  ).length;

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchMatch =
        request.teacherName.toLowerCase().includes(search.toLowerCase()) ||
        request.teacherId.toLowerCase().includes(search.toLowerCase()) ||
        request.department.toLowerCase().includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "All" || request.status === statusFilter;

      const departmentMatch =
        departmentFilter === "All" ||
        request.department === departmentFilter;

      const leaveTypeMatch =
        leaveTypeFilter === "All" ||
        request.leaveType === leaveTypeFilter;

      return (
        searchMatch &&
        statusMatch &&
        departmentMatch &&
        leaveTypeMatch
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    departmentFilter,
    leaveTypeFilter,
  ]);

  const updateStatus = (id: number, status: LeaveStatus) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );

    setSelectedRequest(null);
    setConfirmation(null);

    setFeedback(
      `Leave request successfully marked as ${status.toLowerCase()}.`
    );
  };

  const statusStyle = (status: LeaveStatus) => {
    switch (status) {
      case "Pending":
        return "bg-orange-50 text-orange-700";
      case "Approved":
        return "bg-green-50 text-green-700";
      case "Rejected":
        return "bg-red-50 text-red-700";
    }
  };

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div>
         <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>
        <h1 className="text-2xl font-bold text-slate-900">
          Leave Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage teacher leave applications.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-700">
            {feedback}
          </p>
          <button
            onClick={() => setFeedback("")}
            className="text-green-700"
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Requests",
            value: requests.length,
            icon: Users,
            color: "bg-yellow-100 text-yellow-700",
          },
          {
            title: "Pending Requests",
            value: pendingCount,
            icon: Clock,
            color: "bg-orange-100 text-orange-700",
          },
          {
            title: "Approved Requests",
            value: approvedCount,
            icon: CheckCircle2,
            color: "bg-green-100 text-green-700",
          },
          {
            title: "Rejected Requests",
            value: rejectedCount,
            icon: XCircle,
            color: "bg-red-100 text-red-700",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </h2>
                </div>
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={23} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-yellow-700" />
          <h2 className="font-semibold text-slate-900">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher or ID..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Departments</option>
            {Array.from(new Set(requests.map((r) => r.department))).map(
              (department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              )
            )}
          </select>

          <select
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Leave Types</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Earned Leave">Earned Leave</option>
            <option value="Emergency Leave">Emergency Leave</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setDepartmentFilter("All");
              setLeaveTypeFilter("All");
            }}
            className="text-xs font-semibold text-yellow-700 hover:text-yellow-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-bold text-slate-900">
            Teacher Leave Requests
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Check leave details and take action on pending requests.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-237.5 text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase text-gray-500">
                <th className="px-5 py-4">Teacher</th>
                <th className="px-5 py-4">Leave Type</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Days</th>
                <th className="px-5 py-4">Applied On</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  className="border-t border-gray-100 hover:bg-yellow-50/30"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {request.teacherName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {request.teacherId} · {request.department}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                      {request.leaveType}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    <p>{formatDate(request.fromDate)}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      to {formatDate(request.toDate)}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                    {request.days} {request.days === 1 ? "Day" : "Days"}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {formatDate(request.appliedOn)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="View Details"
                        onClick={() => setSelectedRequest(request)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={17} />
                      </button>

                      {request.status === "Pending" && (
                        <>
                          <button
                            title="Approve"
                            onClick={() =>
                              setConfirmation({
                                id: request.id,
                                action: "Approved",
                              })
                            }
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                          >
                            <Check size={17} />
                          </button>

                          <button
                            title="Reject"
                            onClick={() =>
                              setConfirmation({
                                id: request.id,
                                action: "Rejected",
                              })
                            }
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <X size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <CalendarDays
                      size={36}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="font-semibold text-slate-700">
                      No leave requests found
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Leave Request Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Request ID: LEAVE-{String(selectedRequest.id).padStart(3, "0")}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-yellow-50 p-4">
                <p className="text-xs text-gray-500">Teacher</p>
                <p className="mt-1 font-bold text-slate-900">
                  {selectedRequest.teacherName}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {selectedRequest.teacherId} · {selectedRequest.department}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Detail label="Leave Type" value={selectedRequest.leaveType} />
                <Detail label="Total Days" value={`${selectedRequest.days} Days`} />
                <Detail
                  label="From Date"
                  value={formatDate(selectedRequest.fromDate)}
                />
                <Detail
                  label="To Date"
                  value={formatDate(selectedRequest.toDate)}
                />
                <Detail
                  label="Applied On"
                  value={formatDate(selectedRequest.appliedOn)}
                />
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText size={17} className="text-yellow-700" />
                  <p className="text-sm font-semibold text-slate-800">
                    Reason for Leave
                  </p>
                </div>
                <p className="text-sm leading-6 text-gray-600">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.status === "Pending" && (
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    onClick={() =>
                      setConfirmation({
                        id: selectedRequest.id,
                        action: "Approved",
                      })
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700"
                  >
                    <Check size={17} />
                    Approve Request
                  </button>

                  <button
                    onClick={() =>
                      setConfirmation({
                        id: selectedRequest.id,
                        action: "Rejected",
                      })
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                  >
                    <X size={17} />
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject Confirmation */}
      {confirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                confirmation.action === "Approved"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {confirmation.action === "Approved" ? (
                <CheckCircle2 size={23} />
              ) : (
                <XCircle size={23} />
              )}
            </div>

            <h2 className="mt-4 text-center text-lg font-bold text-slate-900">
              {confirmation.action === "Approved"
                ? "Approve Leave Request?"
                : "Reject Leave Request?"}
            </h2>

            <p className="mt-2 text-center text-sm text-gray-500">
              Are you sure you want to mark this leave request as{" "}
              {confirmation.action.toLowerCase()}?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmation(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  updateStatus(confirmation.id, confirmation.action)
                }
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white ${
                  confirmation.action === "Approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Notice */}
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Frontend Demo Mode
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Leave requests use sample data and React state. Approve/reject
          changes are temporary and will reset after refreshing the page.
          Backend integration is not connected yet.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
