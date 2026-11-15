"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Clock,
  CheckCircle,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type Admission = {
  id: string;
  name: string;
  className: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
};

const statusStyles: Record<string, string> = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function AdmissionReportsPage() {
  const router = useRouter();

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role);
    fetchAdmissions();
  }, []);

  async function fetchAdmissions() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; applications: any[] }>(
        "/admissions/applications"
      );
      if (res?.applications) {
        const mapped: Admission[] = res.applications.map((app: any) => ({
          id: app._id,
          name: app.applicantName || "Unknown Applicant",
          className: app.applyingForClass || "Class 10",
          date: app.createdAt
            ? new Date(app.createdAt).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          status: app.status || "Pending",
        }));
        setAdmissions(mapped);
      }
    } catch {
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  }

  const canManage = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);

  const filteredAdmissions = admissions.filter((admission) => {
    const matchesSearch =
      admission.name.toLowerCase().includes(search.toLowerCase()) ||
      admission.className.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || admission.status === filter;

    return matchesSearch && matchesFilter;
  });

  const approved = admissions.filter((a) => a.status === "Approved").length;
  const pending = admissions.filter((a) => a.status === "Pending").length;
  const rejected = admissions.filter((a) => a.status === "Rejected").length;

  async function handleStatusChange(id: string, newStatus: "Approved" | "Rejected") {
    try {
      await api.put(`/admissions/applications/${id}/status`, {
        status: newStatus,
      });
      setAdmissions((current) =>
        current.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch {
      fetchAdmissions();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              Admission Reports
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage admission records and review application status.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => router.push("/admission/new")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 cursor-pointer"
            >
              <UserPlus size={18} />
              New Admission
            </button>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Total Applications", value: admissions.length, icon: Users, color: "bg-blue-100 text-blue-700" },
            { title: "Approved", value: approved, icon: CheckCircle, color: "bg-green-100 text-green-700" },
            { title: "Pending", value: pending, icon: Clock, color: "bg-amber-100 text-amber-700" },
            { title: "Rejected", value: rejected, icon: X, color: "bg-red-100 text-red-700" },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">{stat.value}</p>
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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or class..."
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="animate-spin text-amber-500" size={28} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student Name</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Application Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmissions.map((admission) => (
                    <tr key={admission.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-4 font-medium text-slate-800">{admission.name}</td>
                      <td className="px-4 py-4 text-slate-600">{admission.className}</td>
                      <td className="px-4 py-4 text-slate-600">{admission.date}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[admission.status] || "bg-slate-100 text-slate-700"}`}>
                          {admission.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {admission.status === "Pending" && canManage ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(admission.id, "Approved")}
                              className="rounded-md bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(admission.id, "Rejected")}
                              className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {admission.status === "Pending" ? "Pending" : "No action"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredAdmissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No admission records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}