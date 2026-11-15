"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Filter,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

type Assignment = {
  id: string;
  teacherId: string;
  teacherName: string;
  department: string;
  subjects: string[];
  classes: string[];
  academicYear: string;
};

type TeacherOption = {
  id: string;
  name: string;
  department: string;
  academicYear: string;
};

type AssignmentForm = {
  teacherName: string;
  department: string;
  subjectsText: string;
  classesText: string;
  academicYear: string;
};

function parseCommaList(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

const emptyForm: AssignmentForm = {
  teacherName: "",
  department: "",
  subjectsText: "",
  classesText: "",
  academicYear: "2026-27",
};

export default function AssignSubjectsPage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AssignmentForm>(emptyForm);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role) setUserRole(String(u.role).toUpperCase());
      } else {
        const role = localStorage.getItem("role") || "";
        setUserRole(role.toUpperCase());
      }
    } catch {
      const role = localStorage.getItem("role") || "";
      setUserRole(role.toUpperCase());
    }
    void fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; teachers: any[] }>("/teachers");
      if (res?.teachers) {
        const tOptions: TeacherOption[] = res.teachers.map((t: any) => ({
          id: t._id,
          name: t.name,
          department: t.department || "General",
          academicYear: t.academicYear || "2026-27",
        }));
        setTeachers(tOptions);

        const loadedAssignments: Assignment[] = res.teachers.map((t: any) => {
          let subjects: string[] = [];
          if (Array.isArray(t.assignedSubjects) && t.assignedSubjects.length > 0) {
            subjects = t.assignedSubjects.map((s: any) =>
              typeof s === "string" ? s : s.subjectName || s.name || "Subject"
            );
          } else if (Array.isArray(t.subjects) && t.subjects.length > 0) {
            subjects = t.subjects;
          } else if (t.specialization) {
            subjects = [t.specialization];
          }

          let classes: string[] = [];
          if (Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0) {
            classes = t.assignedClasses.map((c: any) =>
              typeof c === "string" ? c : c.className || c.name || ""
            );
          } else if (Array.isArray(t.assignedSubjects)) {
            classes = t.assignedSubjects
              .map((s: any) => (typeof s === "object" ? s.className : null))
              .filter(Boolean);
          }

          return {
            id: t._id,
            teacherId: t._id,
            teacherName: t.name,
            department: t.department || "General",
            subjects: Array.from(new Set(subjects)),
            classes: Array.from(new Set(classes)),
            academicYear: t.academicYear || "2026-27",
          };
        });

        setAssignments(loadedAssignments);
      }
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }

  const canManage = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);

  const selectedTeacher = useMemo(() => {
    if (editingId) {
      return teachers.find((t) => t.id === editingId) || null;
    }
    const clean = form.teacherName.trim().toLowerCase();
    if (!clean) return null;
    return teachers.find((t) => t.name.trim().toLowerCase() === clean) || null;
  }, [editingId, form.teacherName, teachers]);

  const parsedSubjects = useMemo(
    () => parseCommaList(form.subjectsText),
    [form.subjectsText]
  );

  const parsedClasses = useMemo(
    () => parseCommaList(form.classesText),
    [form.classesText]
  );

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const q = search.toLowerCase();
      const searchMatch =
        assignment.teacherName.toLowerCase().includes(q) ||
        assignment.subjects.some((subject) => subject.toLowerCase().includes(q)) ||
        assignment.classes.some((cls) => cls.toLowerCase().includes(q));

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
      teacherName: assignment.teacherName,
      department: assignment.department,
      subjectsText: assignment.subjects.join(", "),
      classesText: assignment.classes.join(", "),
      academicYear: assignment.academicYear,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const cleanTeacherName = form.teacherName.trim();
    const cleanAcademicYear = form.academicYear.trim() || "2026-27";

    if (!cleanTeacherName) {
      setError("Please enter a teacher name.");
      return;
    }

    if (parsedSubjects.length === 0) {
      setError("Please enter at least one subject.");
      return;
    }

    if (parsedClasses.length === 0) {
      setError("Please enter at least one class.");
      return;
    }

    try {
      setSaving(true);
      const assignedSubjectsList = parsedSubjects.flatMap((sub) =>
        parsedClasses.map((cls) => ({
          subjectName: sub,
          className: cls,
          section: "A",
        }))
      );

      const endpoint = selectedTeacher
        ? `/teachers/${selectedTeacher.id}/assign-subjects`
        : "/teachers/assign-subjects";

      await api.post(endpoint, {
        teacherId: selectedTeacher?.id,
        teacherName: cleanTeacherName,
        department: selectedTeacher
          ? form.department.trim() || selectedTeacher.department
          : form.department.trim() || "General",
        academicYear: cleanAcademicYear,
        assignedSubjects: assignedSubjectsList,
        assignedClasses: parsedClasses,
      });

      await fetchData();
      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      setError(err?.message || "Failed to save assignment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      await api.post(`/teachers/${deleteId}/assign-subjects`, {
        assignedSubjects: [],
        assignedClasses: [],
      });
      setAssignments((prev) =>
        prev.filter((assignment) => assignment.id !== deleteId)
      );
      setDeleteId(null);
    } catch {
      alert("Failed to delete assignment from database.");
    }
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
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
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

        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 cursor-pointer"
          >
            <Plus size={18} />
            New Assignment
          </button>
        )}
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
            type="button"
            onClick={() => {
              setSearch("");
              setDepartmentFilter("All");
            }}
            className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 cursor-pointer"
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

        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        ) : (
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
                        ID: {assignment.teacherId.slice(-6).toUpperCase()}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {assignment.department}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {assignment.subjects.length > 0 ? (
                          assignment.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                            >
                              {subject}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None assigned</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {assignment.classes.length > 0 ? (
                          assignment.classes.map((cls) => (
                            <span
                              key={cls}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                            >
                              {cls}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {assignment.academicYear}
                    </td>

                    <td className="px-5 py-4">
                      {canManage ? (
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            title="Edit Assignment"
                            onClick={() => openEditModal(assignment)}
                            className="rounded-lg p-2 text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete Assignment"
                            onClick={() => setDeleteId(assignment.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
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
        )}
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
                  Enter teacher, subjects, classes and academic year.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="assign-teacher-input"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Select Teacher
                </label>
                <input
                  id="assign-teacher-input"
                  type="text"
                  list="teacher-name-suggestions"
                  required
                  value={form.teacherName}
                  onChange={(e) => {
                    const value = e.target.value;
                    const match = teachers.find(
                      (t) => t.name.trim().toLowerCase() === value.trim().toLowerCase()
                    );
                    setForm((prev) => ({
                      ...prev,
                      teacherName: value,
                      department: match ? match.department : prev.department,
                    }));
                  }}
                  placeholder="Type teacher name..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
                <datalist id="teacher-name-suggestions">
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.name} />
                  ))}
                </datalist>
              </div>

              {selectedTeacher ? (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="text-xs text-gray-500">Matched Teacher</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedTeacher.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedTeacher.department}
                  </p>
                </div>
              ) : (
                form.teacherName.trim() !== "" && (
                  <div>
                    <label
                      htmlFor="assign-department-input"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Department
                    </label>
                    <input
                      id="assign-department-input"
                      type="text"
                      value={form.department}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, department: e.target.value }))
                      }
                      placeholder="Type department (e.g. Science, Computer Science)"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                    />
                  </div>
                )
              )}

              <div>
                <label
                  htmlFor="assign-subjects-input"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Assign Subjects
                </label>
                <input
                  id="assign-subjects-input"
                  type="text"
                  value={form.subjectsText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subjectsText: e.target.value }))
                  }
                  placeholder="Type subject(s) separated by commas (e.g. Mathematics, Physics)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {parsedSubjects.length} subject(s) entered
                </p>
                {parsedSubjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parsedSubjects.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="assign-classes-input"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Assign Classes
                </label>
                <input
                  id="assign-classes-input"
                  type="text"
                  value={form.classesText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, classesText: e.target.value }))
                  }
                  placeholder="Type class(es) separated by commas (e.g. Class 9, Class 10)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {parsedClasses.length} class(es) entered
                </p>
                {parsedClasses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parsedClasses.map((cls) => (
                      <span
                        key={cls}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="assign-year-input"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Academic Year
                </label>
                <input
                  id="assign-year-input"
                  type="text"
                  value={form.academicYear}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, academicYear: e.target.value }))
                  }
                  placeholder="Type academic year (e.g. 2026-27)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
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
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 disabled:opacity-60 cursor-pointer"
                >
                  <CheckCircle2 size={17} />
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Assignment"
                    : "Save Assignment"}
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
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
