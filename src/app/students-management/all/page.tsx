"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { api } from "@/lib/api";

type Student = {
  id: string;
  mongoId: string;
  name: string;
  email: string;
  className: string;
  section: string;
  rollNo: string;
  phone: string;
  gender?: string;
  status: "Active" | "Inactive";
};

const emptyForm = {
  name: "",
  email: "",
  className: "Class 1",
  section: "A",
  rollNo: "",
  phone: "",
  gender: "Male",
  status: "Active" as "Active" | "Inactive",
};

export default function AllStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>("ADMIN");
  const router = useRouter();

  // Filters & sorting
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "id" | "rollNo" | "class">("name");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);

  const canManage = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/students");
      if (res && res.students) {
        setStudents(
          res.students.map((s: any) => ({
            id: s.studentId || s._id,
            mongoId: s._id,
            name: s.name,
            email: s.email || "",
            className: s.className || "Class 1",
            section: s.section || "A",
            rollNo: s.rollNumber || s.studentId || "N/A",
            phone: s.guardianPhone || s.phone || "",
            gender: s.gender || "Not specified",
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
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role) setUserRole(u.role);
      }
    } catch {}
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const list = students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.id.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        classFilter === "All" || student.className === classFilter;

      const matchesSection =
        sectionFilter === "All" || student.section === sectionFilter;

      const matchesGender =
        genderFilter === "All" ||
        (student.gender && student.gender.toLowerCase() === genderFilter.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesClass && matchesSection && matchesGender && matchesStatus;
    });

    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "id") return a.id.localeCompare(b.id);
      if (sortBy === "rollNo") return a.rollNo.localeCompare(b.rollNo);
      if (sortBy === "class") return a.className.localeCompare(b.className);
      return 0;
    });

    return list;
  }, [students, search, classFilter, sectionFilter, genderFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCount = students.filter(
    (student) => student.status === "Active"
  ).length;

  const inactiveCount = students.filter(
    (student) => student.status === "Inactive"
  ).length;

  const openAddModal = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setForm({
      name: student.name,
      email: student.email,
      className: student.className,
      section: student.section,
      rollNo: student.rollNo,
      phone: student.phone,
      gender: student.gender || "Male",
      status: student.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManage) {
      alert("Only administrators and principals can add or modify students.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        className: form.className.trim(),
        section: form.section.trim() || "A",
        rollNumber: form.rollNo.trim(),
        guardianPhone: form.phone.trim(),
        gender: form.gender,
        status: form.status.toLowerCase(),
      };

      if (editingStudent) {
        await api.put(`/students/${editingStudent.mongoId}`, payload);
      } else {
        await api.post("/students", payload);
      }

      await loadStudents();
      setIsModalOpen(false);
      setEditingStudent(null);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err.message || "Failed to save student to database.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!canManage) {
      alert("Only administrators and principals can delete students.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name} `
    );

    if (confirmed) {
      try {
        await api.delete(`/students/${student.mongoId}`);
        await loadStudents();
      } catch (err: any) {
        alert(err.message || "Failed to delete student ");
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={17} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            All Students
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student records and information in MongoDB.
          </p>
        </div>

        {/* {canManage && (
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400 cursor-pointer"
          >
            <Plus size={18} />
            Add Student
          </button>
        )} */}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Students",
            value: students.length,
            icon: Users,
          },
          {
            title: "Active Students",
            value: activeCount,
            icon: UserCheck,
          },
          {
            title: "Inactive Students",
            value: inactiveCount,
            icon: UserX,
          },
          {
            title: "Classes",
            value: new Set(students.map((s) => s.className)).size,
            icon: GraduationCap,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{item.title}</p>
                <div className="rounded-lg bg-yellow-100 p-2.5">
                  <Icon size={21} className="text-slate-800" />
                </div>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative min-w-50 flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search students by name, ID or roll..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-yellow-400"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
        >
          <option value="All">All Classes</option>
          {Array.from(new Set(students.map((s) => s.className)))
            .filter(Boolean)
            .sort()
            .map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => {
            setSectionFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
        >
          <option value="All">All Sections</option>
          {Array.from(new Set(students.map((s) => s.section)))
            .filter(Boolean)
            .sort()
            .map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => {
            setGenderFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
        >
          <option value="All">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
        >
          <option value="name">Sort by Name</option>
          <option value="id">Sort by Student ID</option>
          <option value="rollNo">Sort by Roll Number</option>
          <option value="class">Sort by Class</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="font-bold text-slate-900">Students List</h2>
          <span className="text-sm text-slate-500">
            {filteredStudents.length} records in MongoDB
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 className="animate-spin text-yellow-400" size={24} />
              <span>Fetching student records from MongoDB...</span>
            </div>
          ) : (
            <table className="w-full min-w-187.5 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Student ID</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Class & Section</th>
                  <th className="px-5 py-3.5">Roll No</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((student) => (
                  <tr key={student.mongoId} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {student.id}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {student.name}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.className} - {student.section}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.rollNo}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.email}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          student.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setViewStudent(student)}
                          title="View Details"
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Eye size={17} />
                        </button>

                        {canManage && (
                          <>
                            <button
                              onClick={() => openEditModal(student)}
                              title="Edit Student"
                              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => handleDelete(student)}
                              title="Delete Student"
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No students found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredStudents.length)} of{" "}
              {filteredStudents.length} entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="px-2 text-xs font-bold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingStudent ? "Edit Student" : "Add New Student"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Saves directly into MongoDB database.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Student Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="student@example.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
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
                    placeholder="e.g. A, B, 1"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
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
                    placeholder="Enter roll number"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Mobile number"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gender: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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
                        status: e.target.value as "Active" | "Inactive",
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingStudent ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold text-slate-900">
                Student Details
              </h2>
              <button
                onClick={() => setViewStudent(null)}
                className="rounded-lg p-2 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {[
                ["Student ID", viewStudent.id],
                ["Database ID", viewStudent.mongoId],
                ["Name", viewStudent.name],
                ["Email", viewStudent.email],
                ["Class", `${viewStudent.className} - ${viewStudent.section}`],
                ["Roll Number", viewStudent.rollNo],
                ["Phone", viewStudent.phone || "Not provided"],
                ["Gender", viewStudent.gender || "Not specified"],
                ["Status", viewStudent.status],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-slate-900">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Connected to MongoDB Database. Student records are persisted live.
      </p>
    </div>
  );
}