"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, Users, X, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type Student = {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  className: string;
  section: string;
  status: "Active" | "Inactive";
};

const emptyForm = {
  name: "",
  email: "",
  rollNo: "",
  className: "",
  section: "",
  status: "Active" as Student["status"],
};

export default function AllStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [currentRole, setCurrentRole] = useState<string>("");

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("eduflow-user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u?.role) {
          setCurrentRole(String(u.role).toUpperCase());
          return;
        }
      }
      const fallbackRole =
        localStorage.getItem("eduflow-role") || localStorage.getItem("role") || "";
      if (fallbackRole) {
        setCurrentRole(fallbackRole.toUpperCase());
      }
    } catch {}
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/students");
      if (res && res.students) {
        setStudents(
          res.students.map((s: any) => ({
            id: s._id || s.studentId,
            name: s.name,
            email: s.email || "",
            rollNo: s.rollNumber || s.studentId || "N/A",
            className: s.className || "",
            section: s.section || "A",
            status: s.status === "inactive" ? "Inactive" : "Active",
          }))
        );
      }
    } catch (err: any) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = [
        student.name,
        student.email,
        student.rollNo,
      ].some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      );

      const matchesClass =
        classFilter === "All" || student.className === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  const canAddStudent = currentRole === "PRINCIPAL";

  const canEditStudent =
    currentRole === "SUPER_ADMIN" ||
    currentRole === "ADMIN" ||
    currentRole === "PRINCIPAL";

  const canDeleteStudent =
    currentRole === "SUPER_ADMIN" || currentRole === "ADMIN";

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      email: student.email,
      rollNo: student.rollNo,
      className: student.className,
      section: student.section,
      status: student.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        className: form.className.trim(),
        section: form.section.trim() || "A",
        rollNumber: form.rollNo.trim(),
        status: form.status.toLowerCase(),
      };

      if (editingId !== null) {
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post("/students", payload);
      }

      await loadStudents();
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || "Failed to save student.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      await api.delete(`/students/${id}`);
      await loadStudents();
    } catch (err: any) {
      alert(err.message || "Failed to delete student.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={17} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {currentRole === "STUDENT" ? "My Student Information" : "All Students"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {currentRole === "STUDENT"
              ? "View your registered academic and enrollment details."
              : "Manage student records, classes and enrollment details."}
          </p>
        </div>

        {canAddStudent && (
          <button
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-900 transition hover:bg-amber-500 cursor-pointer"
          >
            <Plus size={19} />
            Add Student
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {currentRole === "STUDENT" ? "Enrolled Student" : "Total Students"}
            </p>
            <Users className="text-amber-500" size={22} />
          </div>
          <h2 className="mt-3 text-3xl font-bold">{students.length}</h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active Students</p>
          <h2 className="mt-3 text-3xl font-bold text-emerald-600">
            {students.filter((s) => s.status === "Active").length}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Inactive Students</p>
          <h2 className="mt-3 text-3xl font-bold text-red-500">
            {students.filter((s) => s.status === "Inactive").length}
          </h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or roll number..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="All">All Classes</option>
          {[...new Set(students.map((s) => s.className))]
            .filter(Boolean)
            .sort()
            .map((className) => (
              <option key={className} value={className}>
                {className.startsWith("Class") ? className : `Class ${className}`}
              </option>
            ))}
        </select>
      </div>

      {/* Student Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">Student Directory</h2>
          <span className="text-sm text-slate-500">
            {filteredStudents.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 className="animate-spin text-amber-500" size={24} />
              <span>Loading student records...</span>
            </div>
          ) : (
            <table className="w-full min-w-187.5 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Roll Number</th>
                  <th className="px-5 py-4">Class / Section</th>
                  <th className="px-5 py-4">Status</th>
                  {(canEditStudent || canDeleteStudent) && (
                    <th className="px-5 py-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="transition hover:bg-amber-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {student.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium">{student.rollNo}</td>

                    <td className="px-5 py-4">
                      {student.className.startsWith("Class") ? student.className : `Class ${student.className}`} - {student.section}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          student.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    {(canEditStudent || canDeleteStudent) && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canEditStudent && (
                            <button
                              onClick={() => openEditForm(student)}
                              title="Edit student"
                              className="rounded-lg p-2 text-slate-500 hover:bg-amber-100 hover:text-amber-700 cursor-pointer"
                            >
                              <Pencil size={17} />
                            </button>
                          )}
                          {canDeleteStudent && (
                            <button
                              onClick={() => deleteStudent(student.id)}
                              title="Delete student"
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={canEditStudent || canDeleteStudent ? 5 : 4}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-6 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId !== null ? "Edit Student" : "Add New Student"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the student details below.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-slate-100 cursor-pointer"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Student Full Name"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="student@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Roll Number *
                  </label>
                  <input
                    required
                    value={form.rollNo}
                    onChange={(e) =>
                      setForm({ ...form, rollNo: e.target.value })
                    }
                    placeholder="e.g. STU001 or CS-101"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Class *
                  </label>
                  <input
                    required
                    value={form.className}
                    onChange={(e) =>
                      setForm({ ...form, className: e.target.value })
                    }
                    placeholder="e.g. Class 10"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Section *
                  </label>
                  <input
                    required
                    value={form.section}
                    onChange={(e) =>
                      setForm({ ...form, section: e.target.value })
                    }
                    placeholder="e.g. A"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as Student["status"],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-amber-500 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingId !== null ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
