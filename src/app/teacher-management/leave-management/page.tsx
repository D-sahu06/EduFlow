"use client";

import { useEffect, useMemo, useState } from "react";
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
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";

type LeaveStatus = "Pending" | "Approved" | "Rejected";
type LeaveType =
  | "Casual"
  | "Medical"
  | "Academic"
  | "Maternity"
  | "Paternity"
  | "Other";

const leaveTypeOptions: LeaveType[] = [
  "Casual",
  "Medical",
  "Academic",
  "Maternity",
  "Paternity",
  "Other",
];

type LeaveRequest = {
  id: string;
  userId?: string;
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
  reviewNotes?: string;
  reviewedBy?: string;
};

type TeacherOption = {
  _id: string;
  name: string;
  teacherId: string;
  department: string;
};

export default function LeaveManagementPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [teachersList, setTeachersList] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequest | null>(null);

  const [confirmation, setConfirmation] = useState<{
    id: string;
    action: "Approved" | "Rejected";
  } | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Apply / Record Leave Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTeacherRef, setSelectedTeacherRef] = useState("");
  const [applyLeaveType, setApplyLeaveType] = useState<LeaveType>("Casual");
  const [applyFromDate, setApplyFromDate] = useState("");
  const [applyToDate, setApplyToDate] = useState("");
  const [applyReason, setApplyReason] = useState("");
  const [applyError, setApplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState("");

  const isAdminManager = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);
  const canApprove = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD"].includes(userRole);
  const canApplyOrRecord = [
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "HOD",
    "TEACHER",
  ].includes(userRole);

  useEffect(() => {
    let resolvedRole = "";
    let resolvedUserId = "";
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.role) resolvedRole = String(u.role).toUpperCase();
        if (u?._id || u?.id) resolvedUserId = String(u._id || u.id);
      }
    } catch {}

    if (!resolvedRole) {
      resolvedRole = (
        localStorage.getItem("eduflow-role") ||
        localStorage.getItem("role") ||
        ""
      ).toUpperCase();
    }

    setUserRole(resolvedRole);
    setCurrentUserId(resolvedUserId);
    fetchLeaves();

    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HOD"].includes(resolvedRole)) {
      fetchTeachers();
    }
  }, []);

  async function fetchTeachers() {
    try {
      const res = await api.get<{ success: boolean; teachers: any[] }>("/teachers");
      if (res?.teachers) {
        setTeachersList(
          res.teachers.map((t: any) => ({
            _id: t._id,
            name: t.name || "Teacher",
            teacherId: t.teacherId || "",
            department: t.department || "General",
          }))
        );
      }
    } catch {
      setTeachersList([]);
    }
  }

  async function fetchLeaves() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; leaves: any[] }>(
        "/attendance/leaves?role=TEACHER"
      );
      if (res?.leaves) {
        const mapped: LeaveRequest[] = res.leaves.map((leave: any) => {
          const start = leave.startDate ? new Date(leave.startDate) : null;
          const end = leave.endDate ? new Date(leave.endDate) : null;
          const diffDays =
            start && end
              ? Math.max(
                  1,
                  Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                )
              : 1;

          return {
            id: leave._id,
            userId:
              leave.user?._id ||
              (typeof leave.user === "string" ? leave.user : undefined),
            teacherName:
              leave.applicantName ||
              leave.teacher?.name ||
              leave.user?.name ||
              "Unknown Teacher",
            teacherId:
              leave.teacherId ||
              leave.teacher?.teacherId ||
              leave.user?.teacherId ||
              "—",
            department:
              leave.department ||
              leave.teacher?.department ||
              leave.user?.department ||
              "Unassigned",
            leaveType: (leave.leaveType as LeaveType) || "Casual",
            fromDate: start ? start.toISOString().slice(0, 10) : "",
            toDate: end ? end.toISOString().slice(0, 10) : "",
            days: leave.days || diffDays,
            reason: leave.reason || "—",
            appliedOn: leave.createdAt
              ? new Date(leave.createdAt).toISOString().slice(0, 10)
              : "",
            status: (leave.status as LeaveStatus) || "Pending",
            reviewNotes: leave.reviewNotes || "",
            reviewedBy: leave.reviewedBy?.name || "",
          };
        });
        setRequests(mapped);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

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
        searchMatch && statusMatch && departmentMatch && leaveTypeMatch
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    departmentFilter,
    leaveTypeFilter,
  ]);

  const updateStatus = async (
    id: string,
    action: "Approved" | "Rejected"
  ) => {
    try {
      setUpdatingStatus(true);
      const notes = reviewNotesInput.trim();
      const res = await api.put<{ success: boolean; leave?: any }>(
        `/attendance/leaves/${id}/status`,
        {
          status: action,
          reviewNotes: notes,
        }
      );

      const updatedReviewer = res?.leave?.reviewedBy?.name || "";

      setRequests((prev) =>
        prev.map((request) =>
          request.id === id
            ? {
                ...request,
                status: action,
                reviewNotes: notes || request.reviewNotes,
                reviewedBy: updatedReviewer || request.reviewedBy,
              }
            : request
        )
      );

      setSelectedRequest((prev) =>
        prev?.id === id
          ? {
              ...prev,
              status: action,
              reviewNotes: notes || prev.reviewNotes,
              reviewedBy: updatedReviewer || prev.reviewedBy,
            }
          : prev
      );

      setFeedback(
        `Leave request for ${
          requests.find((r) => r.id === id)?.teacherName
        } marked as ${action.toLowerCase()}.`
      );
    } catch (err: any) {
      setFeedback(
        err?.message || "Failed to update leave request. Please check permissions."
      );
    } finally {
      setUpdatingStatus(false);
      setConfirmation(null);
      setReviewNotesInput("");
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError("");

    if (canApprove && !selectedTeacherRef) {
      setApplyError("Please select a teacher.");
      return;
    }

    if (!applyFromDate || !applyToDate || !applyReason.trim()) {
      setApplyError("Start date, end date, and reason are required.");
      return;
    }

    if (new Date(applyToDate) < new Date(applyFromDate)) {
      setApplyError("To Date cannot be earlier than From Date.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, any> = {
        leaveType: applyLeaveType,
        startDate: applyFromDate,
        endDate: applyToDate,
        reason: applyReason.trim(),
      };

      if (canApprove && selectedTeacherRef) {
        payload.teacherRef = selectedTeacherRef;
      }

      await api.post("/attendance/leaves", payload);
      await fetchLeaves();

      setShowApplyModal(false);
      setSelectedTeacherRef("");
      setApplyLeaveType("Casual");
      setApplyFromDate("");
      setApplyToDate("");
      setApplyReason("");
      setFeedback("Teacher leave request submitted to MongoDB successfully.");
    } catch (err: any) {
      setApplyError(err?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeave = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/attendance/leaves/${deleteTarget.id}`);
      setRequests((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      if (selectedRequest?.id === deleteTarget.id) {
        setSelectedRequest(null);
      }
      setFeedback(
        `Leave request for ${deleteTarget.teacherName} deleted successfully.`
      );
    } catch (err: any) {
      setFeedback(
        err?.message || "Failed to delete leave request. Please check permissions."
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const canDeleteRequest = (request: LeaveRequest) =>
    isAdminManager ||
    (Boolean(currentUserId) &&
      request.userId === currentUserId &&
      request.status === "Pending");

  const statusStyle = (status: LeaveStatus) => {
    if (status === "Approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
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

        {canApplyOrRecord && (
          <button
            onClick={() => {
              setApplyError("");
              setShowApplyModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500 cursor-pointer"
          >
            <Plus size={18} />
            {canApprove ? "Record Teacher Leave" : "Apply Leave"}
          </button>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-700">{feedback}</p>
          <button
            onClick={() => setFeedback("")}
            className="text-green-700 cursor-pointer"
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
          <h2 className="font-semibold text-slate-900">Search & Filters</h2>
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
            {Array.from(
              new Set(requests.map((r) => r.department).filter(Boolean))
            ).map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Leave Types</option>
            {leaveTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
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
            className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-bold text-slate-900">Teacher Leave Requests</h2>
          <p className="mt-1 text-sm text-gray-500">
            Check leave details and take action on pending requests.
          </p>
        </div>

        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        ) : (
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
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                        >
                          <Eye size={17} />
                        </button>

                        {request.status === "Pending" && canApprove && (
                          <>
                            <button
                              title="Approve"
                              onClick={() => {
                                setReviewNotesInput("");
                                setConfirmation({
                                  id: request.id,
                                  action: "Approved",
                                });
                              }}
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50 cursor-pointer"
                            >
                              <Check size={17} />
                            </button>

                            <button
                              title="Reject"
                              onClick={() => {
                                setReviewNotesInput("");
                                setConfirmation({
                                  id: request.id,
                                  action: "Rejected",
                                });
                              }}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <X size={17} />
                            </button>
                          </>
                        )}

                        {canDeleteRequest(request) && (
                          <button
                            title="Delete Leave Request"
                            onClick={() => setDeleteTarget(request)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 size={17} />
                          </button>
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
                        {requests.length === 0
                          ? "No teacher leave applications have been submitted in MongoDB yet."
                          : "Try changing your search or filters."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply / Record Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {canApprove
                    ? "Record Teacher Leave Request"
                    : "Apply for Leave"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Leave applications are saved permanently to MongoDB.
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 p-5">
              {applyError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {applyError}
                </div>
              )}

              {canApprove && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Select Teacher *
                  </label>
                  <select
                    required
                    value={selectedTeacherRef}
                    onChange={(e) => setSelectedTeacherRef(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  >
                    <option value="">Choose a teacher...</option>
                    {teachersList.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.teacherId} · {t.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Leave Type *
                </label>
                <select
                  value={applyLeaveType}
                  onChange={(e) =>
                    setApplyLeaveType(e.target.value as LeaveType)
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                >
                  {leaveTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyFromDate}
                    onChange={(e) => setApplyFromDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    To Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyToDate}
                    min={applyFromDate || undefined}
                    onChange={(e) => setApplyToDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="Enter reason for leave request..."
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-yellow-400 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-500 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  Request ID: {selectedRequest.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
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
                <Detail
                  label="Total Days"
                  value={`${selectedRequest.days} ${
                    selectedRequest.days === 1 ? "Day" : "Days"
                  }`}
                />
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

              {(selectedRequest.reviewedBy || selectedRequest.reviewNotes) && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600 space-y-1">
                  {selectedRequest.reviewedBy && (
                    <p>
                      <span className="font-semibold text-slate-700">
                        Reviewed By:
                      </span>{" "}
                      {selectedRequest.reviewedBy}
                    </p>
                  )}
                  {selectedRequest.reviewNotes && (
                    <p>
                      <span className="font-semibold text-slate-700">
                        Review Notes:
                      </span>{" "}
                      {selectedRequest.reviewNotes}
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.status === "Pending" && canApprove && (
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    onClick={() => {
                      setReviewNotesInput("");
                      setConfirmation({
                        id: selectedRequest.id,
                        action: "Approved",
                      });
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 cursor-pointer"
                  >
                    <Check size={17} />
                    Approve Request
                  </button>

                  <button
                    onClick={() => {
                      setReviewNotesInput("");
                      setConfirmation({
                        id: selectedRequest.id,
                        action: "Rejected",
                      });
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 cursor-pointer"
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

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Review Notes (optional)
              </label>
              <input
                value={reviewNotesInput}
                onChange={(e) => setReviewNotesInput(e.target.value)}
                placeholder="Add remarks or notes..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setConfirmation(null);
                  setReviewNotesInput("");
                }}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={updatingStatus}
                onClick={() =>
                  updateStatus(confirmation.id, confirmation.action)
                }
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer ${
                  confirmation.action === "Approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updatingStatus ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={23} />
            </div>

            <h2 className="mt-4 text-center text-lg font-bold text-slate-900">
              Delete Leave Request?
            </h2>

            <p className="mt-2 text-center text-sm text-gray-500">
              Are you sure you want to permanently remove the leave request for{" "}
              <span className="font-semibold text-slate-700">
                {deleteTarget.teacherName}
              </span>
              ?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                onClick={handleDeleteLeave}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
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
