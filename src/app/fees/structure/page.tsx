"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  IndianRupee,
  BookOpen,
  Users,
  Wallet,
  Download,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type FeeStructure = {
  id: string | number;
  className: string;
  department: string;
  tuitionFee: number;
  admissionFee: number;
  examFee: number;
  transportFee: number;
  otherFee: number;
  status: "Active" | "Inactive";
};

const emptyForm = {
  className: "",
  department: "",
  tuitionFee: "",
  admissionFee: "",
  examFee: "",
  transportFee: "",
  otherFee: "",
  status: "Active" as "Active" | "Inactive",
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function FeesStructurePage() {
  const router = useRouter();

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [userRole, setUserRole] = useState<string>("ADMIN");

  const canManage = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"].includes(userRole);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/fees/structures");
      const list = res?.structures || res?.feeStructures || [];
      if (Array.isArray(list)) {
        const mapped: FeeStructure[] = list.map((s: any) => ({
          id: s._id || s.id,
          className: s.className ? (s.className.startsWith("Class") ? s.className : `Class ${s.className}`) : "General Class",
          department: s.department || s.academicYear || "General",
          tuitionFee: Number(s.tuitionFee !== undefined ? s.tuitionFee : (s.amount || 0)),
          admissionFee: Number(s.admissionFee !== undefined ? s.admissionFee : 0),
          examFee: Number(s.examFee !== undefined ? s.examFee : (s.examinationFee !== undefined ? s.examinationFee : 0)),
          transportFee: Number(s.transportFee !== undefined ? s.transportFee : (s.libraryFee !== undefined ? s.libraryFee : 0)),
          otherFee: Number(s.otherFee !== undefined ? s.otherFee : (s.activityFee !== undefined ? s.activityFee : 0)),
          status: s.status || "Active",
        }));
        setStructures(mapped);
      } else {
        setStructures([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load fee structures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role) setUserRole(u.role);
      }
    } catch {}
    fetchStructures();
  }, []);

  const totalOf = (item: FeeStructure) =>
    item.tuitionFee +
    item.admissionFee +
    item.examFee +
    item.transportFee +
    item.otherFee;

  const filteredStructures = structures.filter((item) => {
    const matchesSearch =
      item.className.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      departmentFilter === "All" ||
      item.department === departmentFilter;

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const totalStructures = structures.length;
  const activeStructures = structures.filter(
    (item) => item.status === "Active"
  ).length;
  const averageFee =
    structures.length > 0
      ? Math.round(
          structures.reduce((sum, item) => sum + totalOf(item), 0) /
            structures.length
        )
      : 0;

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(item: FeeStructure) {
    setEditingId(item.id);
    setForm({
      className: item.className.replace(/^Class\s+/i, ""),
      department: item.department,
      tuitionFee: String(item.tuitionFee),
      admissionFee: String(item.admissionFee),
      examFee: String(item.examFee),
      transportFee: String(item.transportFee),
      otherFee: String(item.otherFee),
      status: item.status,
    });
    setError("");
    setModalOpen(true);
  }

  async function saveStructure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage) {
      setError("Only accountants and administrators can manage fee structures.");
      return;
    }

    if (!form.className.trim() || !form.department) {
      setError("Please enter the course/class and select a department.");
      return;
    }

    const numericFields = [
      form.tuitionFee,
      form.admissionFee,
      form.examFee,
      form.transportFee,
      form.otherFee,
    ];

    if (
      numericFields.some(
        (value) => value.trim() === "" || !Number.isFinite(Number(value)) ||
          Number(value) < 0
      )
    ) {
      setError("Enter a valid, non-negative amount for every fee field.");
      return;
    }

    const totalAmount =
      Number(form.tuitionFee) +
      Number(form.admissionFee) +
      Number(form.examFee) +
      Number(form.transportFee) +
      Number(form.otherFee);

    try {
      const payload = {
        className: form.className.trim(),
        department: form.department,
        tuitionFee: Number(form.tuitionFee),
        admissionFee: Number(form.admissionFee),
        examinationFee: Number(form.examFee),
        examFee: Number(form.examFee),
        transportFee: Number(form.transportFee),
        libraryFee: Number(form.transportFee),
        activityFee: Number(form.otherFee),
        otherFee: Number(form.otherFee),
        amount: totalAmount,
        totalAmount,
        academicYear: "2026-2027",
        status: form.status,
      };

      if (editingId !== null) {
        await api.put(`/fees/structures/${editingId}`, payload);
      } else {
        await api.post("/fees/structures", payload);
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      setNotice("Fee structure saved successfully ");
      await fetchStructures();
    } catch (err: any) {
      setError(err.message || "Failed to save fee structure.");
    }
  }

  async function deleteStructure(id: string | number) {
    if (!canManage) {
      alert("Only accountants and administrators can delete fee structures.");
      return;
    }

    const item = structures.find((row) => row.id === id);
    if (!item) return;

    const confirmed = window.confirm(
      `Delete the fee structure  ${item.className}`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/fees/structures/${id}`);
      setNotice("Fee structure deleted.");
      await fetchStructures();
    } catch (err: any) {
      alert(err.message || "Failed to delete fee structure.");
    }
  }

  function exportCSV() {
    const headers = [
      "Class/Course",
      "Department",
      "Tuition Fee",
      "Admission Fee",
      "Exam Fee",
      "Transport Fee",
      "Other Fee",
      "Total Fee",
      "Status",
    ];

    const rows = filteredStructures.map((item) => [
      item.className,
      item.department,
      item.tuitionFee,
      item.admissionFee,
      item.examFee,
      item.transportFee,
      item.otherFee,
      totalOf(item),
      item.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "eduflow-fee-structure.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header and Back Button */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Fees Structure
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage course-wise fee configurations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100"
            >
              <Download size={17} />
              Export CSV
            </button>
            {canManage && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
              >
                <Plus size={18} />
                Add Fees Structure
              </button>
            )}
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Structures"
            value={String(totalStructures)}
            subtitle="Configured courses"
            icon={<BookOpen size={22} />}
          />
          <StatCard
            title="Active Structures"
            value={String(activeStructures)}
            subtitle="Currently in use"
            icon={<Users size={22} />}
          />
          <StatCard
            title="Average Total Fee"
            value={money(averageFee)}
            subtitle="Across all structures"
            icon={<Wallet size={22} />}
          />
        </div>

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by course or department..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Management">Management</option>
              <option value="Commerce">Commerce</option>
              <option value="Science">Science</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </section>

        {/* Fee Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Course Fee Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredStructures.length} structure(s) found
              </p>
            </div>
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              Amounts in INR
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-262.5 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Course / Class</th>
                  <th className="px-4 py-4">Tuition</th>
                  <th className="px-4 py-4">Admission</th>
                  <th className="px-4 py-4">Exam</th>
                  <th className="px-4 py-4">Transport</th>
                  <th className="px-4 py-4">Other</th>
                  <th className="px-4 py-4">Total Fee</th>
                  <th className="px-4 py-4">Status</th>
                  {canManage && <th className="px-5 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={canManage ? 9 : 8} className="px-5 py-12 text-center text-slate-500">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-amber-500" />
                      Loading fee structures...
                    </td>
                  </tr>
                ) : filteredStructures.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {item.className}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.department}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {money(item.tuitionFee)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {money(item.admissionFee)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {money(item.examFee)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {money(item.transportFee)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {money(item.otherFee)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                      {money(totalOf(item))}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit fee structure"
                            aria-label={`Edit ${item.className}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteStructure(item.id)}
                            title="Delete fee structure"
                            aria-label={`Delete ${item.className}`}
                            className="rounded-lg border border-slate-200 p-2 text-red-600 hover:border-red-200 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {!loading && filteredStructures.length === 0 && (
                  <tr>
                    <td
                      colSpan={canManage ? 9 : 8}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No fee structures found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setModalOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="fee-modal-title"
              className="my-6 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
                <div>
                  <h2
                    id="fee-modal-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    {editingId !== null
                      ? "Edit Fee Structure"
                      : "Add Fee Structure"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the fee components for this course.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  aria-label="Close dialog"
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveStructure} className="space-y-5 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Course / Class Name">
                    <input
                      required
                      value={form.className}
                      onChange={(event) =>
                        setForm({ ...form, className: event.target.value })
                      }
                      placeholder="e.g. Class 10"
                      className="form-input"
                    />
                  </Field>

                  <Field label="Department">
                    <select
                      required
                      value={form.department}
                      onChange={(event) =>
                        setForm({ ...form, department: event.target.value })
                      }
                      className="form-input"
                    >
                      <option value="">Select department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Management">Management</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Science">Science</option>
                      <option value="General">General</option>
                    </select>
                  </Field>
                </div>

                <div>
                  <h3 className="mb-3 font-bold text-slate-900">
                    Fee Components
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["tuitionFee", "Tuition Fee"],
                        ["admissionFee", "Admission Fee"],
                        ["examFee", "Examination Fee"],
                        ["transportFee", "Transport Fee"],
                        ["otherFee", "Other Charges"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field key={key} label={label}>
                        <div className="relative">
                          {/* <IndianRupee
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          /> */}
                          <input
                            required
                            type="number"
                            min="0"
                            step="1"
                            value={form[key]}
                            onChange={(event) =>
                              setForm({ ...form, [key]: event.target.value })
                            }
                            placeholder="0"
                            className="form-input pl-9"
                          />
                        </div>
                      </Field>
                    ))}
                  </div>
                </div>

                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as "Active" | "Inactive",
                      })
                    }
                    className="form-input"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Total annual fee
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {money(
                      Number(form.tuitionFee || 0) +
                        Number(form.admissionFee || 0) +
                        Number(form.examFee || 0) +
                        Number(form.transportFee || 0) +
                        Number(form.otherFee || 0)
                    )}
                  </p>
                </div>

                {error && (
                  <p role="alert" className="text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
                  >
                    {editingId !== null ? "Save Changes" : "Add Structure"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500">
          EduFlow ERP .
        </p>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .form-input:focus {
          border-color: #fbbf24;
          box-shadow: 0 0 0 2px rgb(251 191 36 / 20%);
        }
      `}</style>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-amber-100 p-3 text-amber-800">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
