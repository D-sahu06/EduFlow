
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  GraduationCap,
  CheckCircle2,
  ArrowLeft,
  Filter,
} from "lucide-react";

type Assignment = {
  id: number;
  teacherId: number;
  teacherName: string;
  department: string;
  subjects: string[];
  classes: string[];
  academicYear: string;
};

const teachers = [
  { id: 1, name: "Rahul Sharma", department: "Computer Science" },
  { id: 2, name: "Priya Verma", department: "Mathematics" },
  { id: 3, name: "Amit Patel", department: "Physics" },
  { id: 4, name: "Sneha Gupta", department: "English" },
  { id: 5, name: "Vikas Jain", department: "Chemistry" },
];

const subjectOptions = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Computer Science",
  "Data Structures",
  "Database Management",
  "Operating Systems",
];

const classOptions = [
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "B.Tech 1st Year",
  "B.Tech 2nd Year",
  "B.Tech 3rd Year",
  "B.Tech 4th Year",
];

const initialAssignments: Assignment[] = [
  {
    id: 1,
    teacherId: 1,
    teacherName: "Rahul Sharma",
    department: "Computer Science",
    subjects: ["Computer Science", "Data Structures"],
    classes: ["B.Tech 2nd Year", "B.Tech 3rd Year"],
    academicYear: "2026-27",
  },
  {
    id: 2,
    teacherId: 2,
    teacherName: "Priya Verma",
    department: "Mathematics",
    subjects: ["Mathematics"],
    classes: ["Class 11", "Class 12"],
    academicYear: "2026-27",
  },
  {
    id: 3,
    teacherId: 3,
    teacherName: "Amit Patel",
    department: "Physics",
    subjects: ["Physics"],
    classes: ["Class 11", "Class 12"],
    academicYear: "2026-27",
  },
  {
    id: 4,
    teacherId: 4,
    teacherName: "Sneha Gupta",
    department: "English",
    subjects: ["English"],
    classes: ["Class 9", "Class 10"],
    academicYear: "2026-27",
  },
];

export default function AssignSubjectsPage() {
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const emptyForm = {
    teacherId: "",
    subjects: [] as string[],
    classes: [] as string[],
    academicYear: "2026-27",
  };

  const [form, setForm] = useState(emptyForm);

  const selectedTeacher = teachers.find(
    (teacher) => teacher.id === Number(form.teacherId)
  );

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const searchMatch =
        assignment.teacherName.toLowerCase().includes(search.toLowerCase()) ||
        assignment.subjects.some((subject) =>
          subject.toLowerCase().includes(search.toLowerCase())
        ) ||
        assignment.classes.some((cls) =>
          cls.toLowerCase().includes(search.toLowerCase())
        );

      const departmentMatch =
        departmentFilter === "All" ||
        assignment.department === departmentFilter;

      return searchMatch && departmentMatch;
    });
  }, [assignments, search, departmentFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setForm({
      teacherId: String(assignment.teacherId),
      subjects: [...assignment.subjects],
      classes: [...assignment.classes],
      academicYear: assignment.academicYear,
    });
    setError("");
    setModalOpen(true);
  };

  const toggleSelection = (
    value: string,
    field: "subjects" | "classes"
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!selectedTeacher) {
      setError("Please select a teacher.");
      return;
    }

    if (form.subjects.length === 0 || form.classes.length === 0) {
      setError("Please select at least one subject and one class.");
      return;
    }

    const duplicate = assignments.some(
      (assignment) =>
        assignment.teacherId === selectedTeacher.id &&
        assignment.academicYear === form.academicYear &&
        assignment.id !== editingId
    );

    if (duplicate) {
      setError(
        "This teacher already has an assignment for this academic year. Please edit the existing assignment."
      );
      return;
    }

    const newAssignment: Assignment = {
      id: editingId ?? Math.max(0, ...assignments.map((a) => a.id)) + 1,
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      department: selectedTeacher.department,
      subjects: form.subjects,
      classes: form.classes,
      academicYear: form.academicYear,
    };

    if (editingId !== null) {
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === editingId ? newAssignment : assignment
        )
      );
    } else {
      setAssignments((prev) => [newAssignment, ...prev]);
    }

    setModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = () => {
    if (deleteId === null) return;

    setAssignments((prev) =>
      prev.filter((assignment) => assignment.id !== deleteId)
    );

    setDeleteId(null);
  };

  const totalSubjects = new Set(
    assignments.flatMap((assignment) => assignment.subjects)
  ).size;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
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
            Assign Subjects
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Assign subjects and classes to teachers.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400"
        >
          <Plus size={18} />
          New Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Total Assignments",
            value: assignments.length,
            icon: Users,
          },
          {
            title: "Assigned Teachers",
            value: new Set(assignments.map((a) => a.teacherId)).size,
            icon: GraduationCap,
          },
          {
            title: "Unique Subjects",
            value: totalSubjects,
            icon: BookOpen,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </h2>
                </div>
                <div className="rounded-xl bg-yellow-100 p-3 text-yellow-700">
                  <Icon size={23} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-yellow-700" />
          <h2 className="font-semibold text-slate-900">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher, subject or class..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Departments</option>
            {Array.from(
              new Set(teachers.map((teacher) => teacher.department))
            ).map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {filteredAssignments.length} assignments
          </p>
          <button
            onClick={() => {
              setSearch("");
              setDepartmentFilter("All");
            }}
            className="text-xs font-semibold text-yellow-700 hover:text-yellow-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-bold text-slate-900">
            Subject Assignment Records
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage teacher subject allocations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase text-gray-500">
                <th className="px-5 py-4">Teacher</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Assigned Subjects</th>
                <th className="px-5 py-4">Classes</th>
                <th className="px-5 py-4">Academic Year</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="border-t border-gray-100 hover:bg-yellow-50/30"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {assignment.teacherName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      ID: TCH-{String(assignment.teacherId).padStart(3, "0")}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {assignment.department}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex max-w-xs flex-wrap gap-1.5">
                      {assignment.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex max-w-xs flex-wrap gap-1.5">
                      {assignment.classes.map((cls) => (
                        <span
                          key={cls}
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {assignment.academicYear}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        title="Edit Assignment"
                        onClick={() => openEditModal(assignment)}
                        className="rounded-lg p-2 text-yellow-700 hover:bg-yellow-50"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        title="Delete Assignment"
                        onClick={() => setDeleteId(assignment.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <BookOpen
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="font-semibold text-slate-700">
                      No assignments found
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Assignment" : "New Subject Assignment"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Select teacher, subjects and classes.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Teacher
                </label>
                <select
                  required
                  value={form.teacherId}
                  onChange={(e) =>
                    setForm({ ...form, teacherId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                >
                  <option value="">Choose a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} — {teacher.department}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTeacher && (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="text-xs text-gray-500">Selected Teacher</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedTeacher.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedTeacher.department}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Assign Subjects
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {subjectOptions.map((subject) => (
                    <label
                      key={subject}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 p-3 text-sm text-gray-700 hover:bg-yellow-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.subjects.includes(subject)}
                        onChange={() => toggleSelection(subject, "subjects")}
                        className="h-4 w-4 accent-yellow-500"
                      />
                      {subject}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {form.subjects.length} subject(s) selected
                </p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Assign Classes
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {classOptions.map((cls) => (
                    <label
                      key={cls}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 p-3 text-sm text-gray-700 hover:bg-yellow-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.classes.includes(cls)}
                        onChange={() => toggleSelection(cls, "classes")}
                        className="h-4 w-4 accent-yellow-500"
                      />
                      {cls}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {form.classes.length} class(es) selected
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Academic Year
                </label>
                <select
                  value={form.academicYear}
                  onChange={(e) =>
                    setForm({ ...form, academicYear: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                >
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                  <option value="2027-28">2027-28</option>
                </select>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400"
                >
                  <CheckCircle2 size={17} />
                  {editingId ? "Update Assignment" : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2 className="mt-4 text-center text-lg font-bold text-slate-900">
              Delete Assignment?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Are you sure you want to remove this subject assignment?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Notice */}
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Frontend Demo Mode
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Assignment records are managed using React state and sample data.
          Changes will reset after refreshing the page. Backend integration
          is not connected yet.
        </p>
      </div>
    </div>
  );
}
