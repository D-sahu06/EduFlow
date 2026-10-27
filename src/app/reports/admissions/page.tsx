
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Clock,
  CheckCircle,
  Search,
  X,
} from "lucide-react";

type Admission = {
  id: number;
  name: string;
  className: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
};

const initialAdmissions: Admission[] = [
  { id: 1, name: "Aarav Sharma", className: "Class 10", date: "2026-10-05", status: "Approved" },
  { id: 2, name: "Priya Verma", className: "Class 9", date: "2026-10-08", status: "Pending" },
  { id: 3, name: "Rahul Patel", className: "Class 12", date: "2026-10-10", status: "Approved" },
  { id: 4, name: "Ananya Jain", className: "Class 8", date: "2026-10-12", status: "Rejected" },
  { id: 5, name: "Vivek Singh", className: "Class 11", date: "2026-10-15", status: "Pending" },
];

const statusStyles = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function AdmissionReportsPage() {
  const router = useRouter();

  const [admissions, setAdmissions] = useState(initialAdmissions);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("Class 10");

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

  function addAdmission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newAdmission: Admission = {
      id: Date.now(),
      name: name.trim(),
      className,
      date: new Date().toISOString().slice(0, 10),
      status: "Pending",
    };

    setAdmissions((current) => [newAdmission, ...current]);
    setName("");
    setClassName("Class 10");
    setShowForm(false);
  }

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

        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              Admission Reports
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage admission records and review application status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
          >
            <UserPlus size={18} />
            New Admission
          </button>
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
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[admission.status]}`}>
                        {admission.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {admission.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setAdmissions((current) =>
                                current.map((a) =>
                                  a.id === admission.id ? { ...a, status: "Approved" } : a
                                )
                              )
                            }
                            className="rounded-md bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setAdmissions((current) =>
                                current.map((a) =>
                                  a.id === admission.id ? { ...a, status: "Rejected" } : a
                                )
                              )
                            }
                            className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No action</span>
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
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">New Admission</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={addAdmission} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Student Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter student name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Class
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
                  >
                    {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Create Application
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
