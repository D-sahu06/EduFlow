"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Users, X } from "lucide-react";

type Student = {
  id: number;
  name: string;
  email: string;
  rollNo: string;
  className: string;
  section: string;
  status: "Active" | "Inactive";
};

const initialStudents: Student[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    email: "aarav@example.com",
    rollNo: "STU001",
    className: "10",
    section: "A",
    status: "Active",
  },
  {
    id: 2,
    name: "Ananya Verma",
    email: "ananya@example.com",
    rollNo: "STU002",
    className: "9",
    section: "B",
    status: "Active",
  },
  {
    id: 3,
    name: "Rahul Patel",
    email: "rahul@example.com",
    rollNo: "STU003",
    className: "10",
    section: "A",
    status: "Inactive",
  },
];

const emptyForm = {
  name: "",
  email: "",
  rollNo: "",
  className: "",
  section: "",
  status: "Active" as Student["status"],
};

export default function AllStudentsPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingId !== null) {
      setStudents((current) =>
        current.map((student) =>
          student.id === editingId ? { ...student, ...form } : student
        )
      );
    } else {
      const newStudent: Student = {
        id: Date.now(),
        ...form,
      };

      setStudents((current) => [newStudent, ...current]);
    }

    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const deleteStudent = (id: number) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setStudents((current) =>
        current.filter((student) => student.id !== id)
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm text-slate-500">
            Student Information / All Students
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            All Students
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage student records, classes and enrollment details.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-900 transition hover:bg-amber-500"
        >
          <Plus size={19} />
          Add Student
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Students</p>
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
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-400"
        >
          <option value="All">All Classes</option>
          {[...new Set(students.map((s) => s.className))]
            .sort((a, b) => Number(a) - Number(b))
            .map((className) => (
              <option key={className} value={className}>
                Class {className}
              </option>
            ))}
        </select>
      </div>

      {/* Student Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">Student Directory</h2>
          <span className="text-sm text-slate-500">
            {filteredStudents.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Roll Number</th>
                <th className="px-5 py-4">Class / Section</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
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
                    Class {student.className} - {student.section}
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

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditForm(student)}
                        title="Edit student"
                        className="rounded-lg p-2 text-slate-500 hover:bg-amber-100 hover:text-amber-700"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        title="Delete student"
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No students found. Try another search or add a student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Student Name
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email Address
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
                  <label className="mb-1.5 block text-sm font-medium">
                    Roll Number
                  </label>
                  <input
                    required
                    value={form.rollNo}
                    onChange={(e) =>
                      setForm({ ...form, rollNo: e.target.value })
                    }
                    placeholder="e.g. STU004"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Class
                  </label>
                  <input
                    required
                    value={form.className}
                    onChange={(e) =>
                      setForm({ ...form, className: e.target.value })
                    }
                    placeholder="e.g. 10"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Section
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
                  <label className="mb-1.5 block text-sm font-medium">
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-amber-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-amber-500"
                >
                  {editingId !== null ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}