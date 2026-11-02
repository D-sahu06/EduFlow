
"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  email: string;
  className: string;
  section: string;
  rollNo: string;
  phone: string;
  status: "Active" | "Inactive";
};

const initialStudents: Student[] = [
  {
    id: "STU001",
    name: "Aarav Sharma",
    email: "aarav@gmail.com",
    className: "Class 5",
    section: "A",
    rollNo: "101",
    phone: "9876543210",
    status: "Active",
  },
  {
    id: "STU002",
    name: "Ananya Verma",
    email: "ananya@gmail.com",
    className: "Class 3",
    section: "B",
    rollNo: "102",
    phone: "9876543211",
    status: "Active",
  },
  {
    id: "STU003",
    name: "Rohan Patel",
    email: "rohan@gmail.com",
    className: "Class 4",
    section: "A",
    rollNo: "103",
    phone: "9876543212",
    status: "Inactive",
  },
  {
    id: "STU004",
    name: "Priya Singh",
    email: "priya@gmail.com",
    className: "Class 2",
    section: "C",
    rollNo: "104",
    phone: "9876543213",
    status: "Active",
  },
  {
    id: "STU005",
    name: "Kabir Khan",
    email: "kabir@gmail.com",
    className: "Class 5",
    section: "B",
    rollNo: "105",
    phone: "9876543214",
    status: "Active",
  },
];

const emptyForm = {
  name: "",
  email: "",
  className: "Class 1",
  section: "A",
  rollNo: "",
  phone: "",
  status: "Active" as "Active" | "Inactive",
};

export default function AllStudentsPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter()

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.id.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        classFilter === "All" || student.className === classFilter;

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, search, classFilter, statusFilter]);

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
      status: student.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingStudent) {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === editingStudent.id
            ? { ...student, ...form }
            : student
        )
      );
    } else {
      const newStudent: Student = {
        id: `STU${String(Date.now()).slice(-6)}`,
        ...form,
      };

      setStudents((prev) => [newStudent, ...prev]);
    }

    setIsModalOpen(false);
    setEditingStudent(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (confirmed) {
      setStudents((prev) =>
        prev.filter((student) => student.id !== id)
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            All Students
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student records and information.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
        >
          <Plus size={18} />
          Add Student
        </button>
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
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, student ID or email..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-yellow-400"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Classes</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={`Class ${i + 1}`}>
                Class {i + 1}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Student Records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Student ID</th>
                <th className="px-5 py-4 font-semibold">Class</th>
                <th className="px-5 py-4 font-semibold">Roll No.</th>
                <th className="px-5 py-4 font-semibold">Phone</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {student.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {student.email}
                    </p>
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-700">
                    {student.id}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.className} - {student.section}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.rollNo}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.phone}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        student.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewStudent(student)}
                        title="View Student"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() => openEditModal(student)}
                        title="Edit Student"
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => handleDelete(student.id)}
                        title="Delete Student"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
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
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                  Enter student information below.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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
                  <select
                    value={form.className}
                    onChange={(e) =>
                      setForm({ ...form, className: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={`Class ${i + 1}`}>
                        Class {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Section *
                  </label>
                  <select
                    value={form.section}
                    onChange={(e) =>
                      setForm({ ...form, section: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                  >
                    {["A", "B", "C", "D"].map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
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
                    Phone Number *
                  </label>
                  <input
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="10-digit mobile number"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
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
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400"
                >
                  {editingStudent ? "Save Changes" : "Add Student"}
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
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {[
                ["Student ID", viewStudent.id],
                ["Name", viewStudent.name],
                ["Email", viewStudent.email],
                ["Class", `${viewStudent.className} - ${viewStudent.section}`],
                ["Roll Number", viewStudent.rollNo],
                ["Phone", viewStudent.phone],
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
        Demo mode: student records are stored in React state only. Refreshing
        the page will reset changes. Backend integration will be added later.
      </p>
    </div>
  );
}
