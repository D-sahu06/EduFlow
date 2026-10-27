
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Trophy,
  Download,
  Medal,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

type MeritStatus = "Selected" | "Waitlisted" | "Rejected";

type Applicant = {
  id: string;
  name: string;
  course: string;
  percentage: number;
  passingYear: number;
  status: MeritStatus;
};

const initialApplicants: Applicant[] = [
  {
    id: "APP-1002",
    name: "Priya Verma",
    course: "B.Tech - CSE",
    percentage: 94,
    passingYear: 2026,
    status: "Selected",
  },
  {
    id: "APP-1005",
    name: "Vivek Joshi",
    course: "B.Tech - CSE",
    percentage: 91,
    passingYear: 2026,
    status: "Selected",
  },
  {
    id: "APP-1001",
    name: "Aarav Sharma",
    course: "B.Tech - IT",
    percentage: 88,
    passingYear: 2026,
    status: "Selected",
  },
  {
    id: "APP-1006",
    name: "Neha Gupta",
    course: "B.Tech - IT",
    percentage: 84,
    passingYear: 2026,
    status: "Waitlisted",
  },
  {
    id: "APP-1003",
    name: "Rahul Patel",
    course: "BBA",
    percentage: 76,
    passingYear: 2025,
    status: "Waitlisted",
  },
  {
    id: "APP-1004",
    name: "Ananya Singh",
    course: "B.Tech - IT",
    percentage: 68,
    passingYear: 2026,
    status: "Rejected",
  },
];

function statusClass(status: MeritStatus) {
  if (status === "Selected") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-800";
}

export default function MeritListPage() {
  const router = useRouter();

  const [applicants, setApplicants] =
    useState<Applicant[]>(initialApplicants);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [minPercentage, setMinPercentage] = useState("0");
  const [maxPercentage, setMaxPercentage] = useState("100");

  const rankedApplicants = useMemo(() => {
    const sorted = [...applicants].sort(
      (a, b) =>
        b.percentage - a.percentage ||
        a.name.localeCompare(b.name)
    );

    return sorted.map((applicant, index) => ({
      ...applicant,
      rank: index + 1,
    }));
  }, [applicants]);

  const filteredApplicants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rankedApplicants.filter((applicant) => {
      const matchesSearch =
        applicant.name.toLowerCase().includes(query) ||
        applicant.id.toLowerCase().includes(query);

      const matchesCourse =
        courseFilter === "All" ||
        applicant.course === courseFilter;

      const matchesStatus =
        statusFilter === "All" ||
        applicant.status === statusFilter;

      const matchesPercentage =
        applicant.percentage >= Number(minPercentage) &&
        applicant.percentage <= Number(maxPercentage);

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus &&
        matchesPercentage
      );
    });
  }, [
    rankedApplicants,
    search,
    courseFilter,
    statusFilter,
    minPercentage,
    maxPercentage,
  ]);

  const selectedCount = applicants.filter(
    (item) => item.status === "Selected"
  ).length;

  const waitlistedCount = applicants.filter(
    (item) => item.status === "Waitlisted"
  ).length;

  const rejectedCount = applicants.filter(
    (item) => item.status === "Rejected"
  ).length;

  function updateStatus(id: string, status: MeritStatus) {
    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === id
          ? { ...applicant, status }
          : applicant
      )
    );
  }

  function exportCSV() {
    const header = [
      "Rank",
      "Application ID",
      "Applicant Name",
      "Course",
      "Percentage",
      "Passing Year",
      "Status",
    ];

    const rows = filteredApplicants.map((applicant) => [
      applicant.rank,
      applicant.id,
      applicant.name,
      applicant.course,
      applicant.percentage,
      applicant.passingYear,
      applicant.status,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "admission-merit-list.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const topApplicant = rankedApplicants[0];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          {/* <p className="mb-2 text-sm text-gray-500">
            EduFlow / Admission / Merit List
          </p> */}
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Admission Merit List
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Rank applicants by percentage and manage selection status.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-500"
        >
          <Download size={18} />
          Export Merit List
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Applicants</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {applicants.length}
              </p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Trophy size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Selected</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {selectedCount}
              </p>
            </div>
            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Waitlisted</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {waitlistedCount}
              </p>
            </div>
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {rejectedCount}
              </p>
            </div>
            <div className="rounded-xl bg-red-100 p-3 text-red-700">
              <XCircle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Top ranked applicant */}
      {topApplicant && (
        <section className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-yellow-400 p-3 text-gray-900">
              <Medal size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Highest-scoring applicant in demo data
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">
                {topApplicant.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {topApplicant.course} · {topApplicant.id}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-3xl font-bold text-gray-900">
              {topApplicant.percentage}%
            </p>
            <p className="text-sm text-gray-600">Previous percentage</p>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicant or ID..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-yellow-400"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Courses</option>
            <option value="B.Tech - IT">B.Tech - IT</option>
            <option value="B.Tech - CSE">B.Tech - CSE</option>
            <option value="BBA">BBA</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Statuses</option>
            <option value="Selected">Selected</option>
            <option value="Waitlisted">Waitlisted</option>
            <option value="Rejected">Rejected</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              aria-label="Minimum percentage"
              value={minPercentage}
              onChange={(e) => setMinPercentage(e.target.value)}
              className="w-1/2 min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-yellow-400"
              placeholder="Min %"
            />
            <input
              type="number"
              min="0"
              max="100"
              aria-label="Maximum percentage"
              value={maxPercentage}
              onChange={(e) => setMaxPercentage(e.target.value)}
              className="w-1/2 min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-yellow-400"
              placeholder="Max %"
            />
          </div>
        </div>

        {Number(minPercentage) > Number(maxPercentage) && (
          <p className="mb-4 text-sm text-red-600">
            Minimum percentage cannot exceed maximum percentage.
          </p>
        )}

        <p className="mb-4 text-sm text-gray-500">
          Showing {filteredApplicants.length} of {applicants.length} applicants.
          Ranks are calculated across the full applicant list before filtering.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-4">Rank</th>
                <th className="px-4 py-4">Applicant</th>
                <th className="px-4 py-4">Course</th>
                <th className="px-4 py-4">Percentage</th>
                <th className="px-4 py-4">Passing Year</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Update Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplicants.map((applicant) => (
                <tr
                  key={applicant.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        applicant.rank === 1
                          ? "bg-yellow-300 text-yellow-950"
                          : applicant.rank === 2
                            ? "bg-gray-200 text-gray-800"
                            : applicant.rank === 3
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {applicant.rank}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-900">
                      {applicant.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {applicant.id}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    {applicant.course}
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-bold text-gray-900">
                      {applicant.percentage}%
                    </span>
                    <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{ width: `${applicant.percentage}%` }}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    {applicant.passingYear}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        applicant.status
                      )}`}
                    >
                      {applicant.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      aria-label={`Update status for ${applicant.name}`}
                      value={applicant.status}
                      onChange={(e) =>
                        updateStatus(
                          applicant.id,
                          e.target.value as MeritStatus
                        )
                      }
                      className="rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-yellow-400"
                    >
                      <option value="Selected">Selected</option>
                      <option value="Waitlisted">Waitlisted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}

              {filteredApplicants.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    No applicants match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
