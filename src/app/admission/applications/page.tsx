
"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";

type Status = "Pending" | "Approved" | "Rejected";

type Application = {
  id: string;
  name: string;
  email: string;
  course: string;
  date: string;
  percentage: number;
  status: Status;
};

const initialApplications: Application[] = [
  {
    id: "APP-1001",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    course: "B.Tech - IT",
    date: "2026-10-26",
    percentage: 88,
    status: "Pending",
  },
  {
    id: "APP-1002",
    name: "Priya Verma",
    email: "priya@example.com",
    course: "B.Tech - CSE",
    date: "2026-10-25",
    percentage: 94,
    status: "Approved",
  },
  {
    id: "APP-1003",
    name: "Rahul Patel",
    email: "rahul@example.com",
    course: "BBA",
    date: "2026-10-25",
    percentage: 76,
    status: "Pending",
  },
  {
    id: "APP-1004",
    name: "Ananya Singh",
    email: "ananya@example.com",
    course: "B.Tech - IT",
    date: "2026-10-24",
    percentage: 68,
    status: "Rejected",
  },
  {
    id: "APP-1005",
    name: "Vivek Joshi",
    email: "vivek@example.com",
    course: "B.Tech - CSE",
    date: "2026-10-23",
    percentage: 91,
    status: "Pending",
  },
];

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

  const [applications, setApplications] =
    useState<Application[]>(initialApplications);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [selected, setSelected] = useState<Application | null>(null);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const query = search.toLowerCase();

      const matchesSearch =
        application.name.toLowerCase().includes(query) ||
        application.id.toLowerCase().includes(query) ||
        application.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        application.status === statusFilter;

      const matchesCourse =
        courseFilter === "All" ||
        application.course === courseFilter;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [applications, search, statusFilter, courseFilter]);

  function updateStatus(id: string, status: Status) {
    setApplications((current) =>
      current.map((application) =>
        application.id === id
          ? { ...application, status }
          : application
      )
    );

    setSelected((current) =>
      current?.id === id ? { ...current, status } : current
    );
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
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          {/* <p className="mb-2 text-sm text-gray-500">
            EduFlow / Admission / Applications
          </p> */}
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Applications
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Search, review and manage student admission applications.
          </p>
        </div>

        <Link
          href="/admission/new"
          className="rounded-xl bg-yellow-400 px-5 py-3 text-center text-sm font-semibold text-gray-900 hover:bg-yellow-500"
        >
          + New Application
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Pending",
            count: pendingCount,
            icon: Clock,
            style: "text-yellow-700 bg-yellow-100",
          },
          {
            title: "Approved",
            count: approvedCount,
            icon: CheckCircle2,
            style: "text-green-700 bg-green-100",
          },
          {
            title: "Rejected",
            count: rejectedCount,
            icon: XCircle,
            style: "text-red-700 bg-red-100",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {item.count}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${item.style}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and filters */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, application ID or email..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Courses</option>
            <option value="B.Tech - IT">B.Tech - IT</option>
            <option value="B.Tech - CSE">B.Tech - CSE</option>
            <option value="BBA">BBA</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredApplications.length} of {applications.length} applications
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-4">Applicant</th>
                <th className="px-4 py-4">Course</th>
                <th className="px-4 py-4">Percentage</th>
                <th className="px-4 py-4">Applied Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map((application) => (
                <tr
                  key={application.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-900">
                      {application.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {application.id} · {application.email}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    {application.course}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-gray-800">
                    {application.percentage}%
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    {application.date}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        title="View details"
                        onClick={() => setSelected(application)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
                      >
                        <Eye size={16} />
                      </button>

                      {application.status === "Pending" && (
                        <>
                          <button
                            title="Approve"
                            onClick={() =>
                              updateStatus(application.id, "Approved")
                            }
                            className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          <button
                            title="Reject"
                            onClick={() =>
                              updateStatus(application.id, "Rejected")
                            }
                            className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
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
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    No applications match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <p className="mt-1 text-sm text-gray-500">
                  {selected.id}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {[
                ["Applicant", selected.name],
                ["Email", selected.email],
                ["Course", selected.course],
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
                  onClick={() => updateStatus(selected.id, "Approved")}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(selected.id, "Rejected")}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
