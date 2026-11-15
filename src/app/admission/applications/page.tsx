"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type Status = "Pending" | "Approved" | "Rejected";

type Application = {
  id: string;
  mongoId: string;
  name: string;
  email: string;
  course: string;
  date: string;
  percentage: number;
  status: Status;
};

function getStatusStyle(status: Status) {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

export default function ApplicationsPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [selected, setSelected] = useState<Application | null>(null);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admissions/applications");
      if (res && res.applications) {
        setApplications(
          res.applications.map((app: any) => ({
            id: app.applicationNumber || app._id,
            mongoId: app._id,
            name: app.applicantName,
            email: app.email,
            course: app.applyingForClass,
            date: app.createdAt
              ? app.createdAt.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            percentage: app.previousPercentage || 0,
            status: (app.status === "Approved" || app.status === "Rejected"
              ? app.status
              : "Pending") as Status,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load applications from MongoDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const query = search.toLowerCase();

      const matchesSearch =
        application.name.toLowerCase().includes(query) ||
        application.id.toLowerCase().includes(query) ||
        application.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      const matchesCourse =
        courseFilter === "All" || application.course === courseFilter;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [applications, search, statusFilter, courseFilter]);

  async function updateStatus(id: string, mongoId: string, status: Status) {
    setActionLoading(id);
    try {
      await api.put(`/admissions/applications/${mongoId}/status`, { status });
      await loadApplications();

      setSelected((current) =>
        current?.id === id ? { ...current, status } : current
      );
    } catch (err: any) {
      alert(err.message || "Failed to update application status in database.");
    } finally {
      setActionLoading(null);
    }
  }

  function exportCSV() {
    const header = [
      "Application ID",
      "Name",
      "Email",
      "Course",
      "Applied Date",
      "Percentage",
      "Status",
    ];

    const rows = filteredApplications.map((application) => [
      application.id,
      application.name,
      application.email,
      application.course,
      application.date,
      application.percentage,
      application.status,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "admission-applications.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const pendingCount = applications.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = applications.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = applications.filter(
    (item) => item.status === "Rejected"
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <button
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Applications
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Live student admission applications saved in MongoDB database.
          </p>
        </div>

        {/* <Link
          href="/admission/new"
          className="rounded-xl bg-yellow-400 px-5 py-3 text-center text-sm font-semibold text-gray-900 hover:bg-yellow-500 cursor-pointer"
        >
          + New Application
        </Link> */}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Pending",
            count: pendingCount,
            icon: Clock,
            color: "text-yellow-600 bg-yellow-50",
          },
          {
            title: "Approved",
            count: approvedCount,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
          {
            title: "Rejected",
            count: rejectedCount,
            icon: XCircle,
            color: "text-red-600 bg-red-50",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-gray-500">{item.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {item.count}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${item.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-yellow-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-yellow-400"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-yellow-400"
        >
          <option value="All">All Courses</option>
          {Array.from(new Set(applications.map((app) => app.course)))
            .filter(Boolean)
            .sort()
            .map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
        </select>

        <button
          onClick={exportCSV}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Applications list */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
              <Loader2 className="animate-spin text-yellow-500" size={24} />
              <span>Fetching applications from MongoDB...</span>
            </div>
          ) : (
            <table className="w-full min-w-160 text-left text-sm text-gray-600">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4">Application ID</th>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Percentage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((application) => (
                  <tr key={application.mongoId} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-900">
                      {application.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {application.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {application.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">{application.course}</td>

                    <td className="px-6 py-4 font-medium text-gray-800">
                      {application.percentage}%
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          title="View details"
                          onClick={() => setSelected(application)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>

                        {application.status === "Pending" && (
                          <>
                            <button
                              title="Approve in Database"
                              disabled={actionLoading === application.id}
                              onClick={() =>
                                updateStatus(
                                  application.id,
                                  application.mongoId,
                                  "Approved"
                                )
                              }
                              className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 size={16} />
                            </button>

                            <button
                              title="Reject in Database"
                              disabled={actionLoading === application.id}
                              onClick={() =>
                                updateStatus(
                                  application.id,
                                  application.mongoId,
                                  "Rejected"
                                )
                              }
                              className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No applications found in MongoDB. Click &ldquo;+ New Application&rdquo; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Application details modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-dialog-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="application-dialog-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Application Details
                </h2>
                <p className="mt-1 font-mono text-sm text-gray-500">
                  {selected.id} (ID: {selected.mongoId})
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {[
                ["Applicant Name", selected.name],
                ["Email Address", selected.email],
                ["Applying For Course", selected.course],
                ["Applied Date", selected.date],
                ["Previous Percentage", `${selected.percentage}%`],
                ["Application Status", selected.status],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-gray-100 pb-3 text-sm"
                >
                  <span className="text-gray-500">{label}</span>
                  <span className="text-right font-semibold text-gray-900">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {selected.status === "Pending" && (
              <div className="mt-6 flex gap-3">
                <button
                  disabled={actionLoading === selected.id}
                  onClick={() =>
                    updateStatus(selected.id, selected.mongoId, "Approved")
                  }
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 cursor-pointer disabled:opacity-50"
                >
                  Approve Application
                </button>
                <button
                  disabled={actionLoading === selected.id}
                  onClick={() =>
                    updateStatus(selected.id, selected.mongoId, "Rejected")
                  }
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
                >
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
