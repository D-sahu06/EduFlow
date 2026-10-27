
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  School,
  Users,
  Pencil,
  Trash2,
  X,
  Layers,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

type SchoolClass = {
  id: number;
  name: string;
  teacher: string;
  sections: string[];
  capacity: number;
  students: number;
};

const initialClasses: SchoolClass[] = [
  {
    id: 1,
    name: "Class 9",
    teacher: "Priya Sharma",
    sections: ["A", "B", "C"],
    capacity: 40,
    students: 108,
  },
  {
    id: 2,
    name: "Class 10",
    teacher: "Amit Verma",
    sections: ["A", "B"],
    capacity: 40,
    students: 76,
  },
  {
    id: 3,
    name: "Class 11",
    teacher: "Neha Jain",
    sections: ["A", "B"],
    capacity: 45,
    students: 68,
  },
  {
    id: 4,
    name: "Class 12",
    teacher: "Rahul Patel",
    sections: ["A", "B", "C"],
    capacity: 45,
    students: 112,
  },
];

const emptyForm = {
  name: "",
  teacher: "",
  sections: "A, B",
  capacity: "40",
  students: "0",
};

export default function ClassesPage() {
  const router = useRouter();

  const [classes, setClasses] =
    useState<SchoolClass[]>(initialClasses);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] =
    useState<SchoolClass | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const filteredClasses = useMemo(
    () =>
      classes.filter((item) =>
        `${item.name} ${item.teacher} ${item.sections.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      ),
    [classes, search]
  );

  const totalStudents = classes.reduce(
    (sum, item) => sum + item.students,
    0
  );

  const totalSections = classes.reduce(
    (sum, item) => sum + item.sections.length,
    0
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: SchoolClass) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      teacher: item.teacher,
      sections: item.sections.join(", "),
      capacity: String(item.capacity),
      students: String(item.students),
    });
    setError("");
    setModalOpen(true);
  }

  function saveClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const teacher = form.teacher.trim();
    const sections = [
      ...new Set(
        form.sections
          .split(",")
          .map((section) => section.trim().toUpperCase())
          .filter(Boolean)
      ),
    ];

    const capacity = Number(form.capacity);
    const students = Number(form.students);

    if (!name || !teacher || sections.length === 0) {
      setError("Please fill all required fields.");
      return;
    }

    if (
      !Number.isFinite(capacity) ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      !Number.isFinite(students) ||
      !Number.isInteger(students) ||
      students < 0
    ) {
      setError("Enter a valid capacity and student count.");
      return;
    }

    if (classes.some(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.id !== editingId
    )) {
      setError("This class already exists.");
      return;
    }

    const updatedClass: SchoolClass = {
      id: editingId ?? Math.max(0, ...classes.map((c) => c.id)) + 1,
      name,
      teacher,
      sections,
      capacity,
      students,
    };

    if (editingId !== null) {
      setClasses((previous) =>
        previous.map((item) =>
          item.id === editingId ? updatedClass : item
        )
      );
    } else {
      setClasses((previous) => [...previous, updatedClass]);
    }

    setModalOpen(false);
    setError("");
  }

  function deleteClass() {
    if (deleteId === null) return;

    setClasses((previous) =>
      previous.filter((item) => item.id !== deleteId)
    );

    if (selectedClass?.id === deleteId) {
      setSelectedClass(null);
    }

    setDeleteId(null);
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50"
            >
              <ArrowLeft size={19} />Back
            </button>

            <div>
              {/* <p className="text-sm font-medium text-amber-700">
                Student Information 
              </p> */}
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Class & Section
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage classes, sections and class teachers.
              </p>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300"
          >
            <Plus size={18} /> Add Class
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Metric
            title="Total Classes"
            value={classes.length}
            icon={<School size={21} />}
          />
          <Metric
            title="Total Sections"
            value={totalSections}
            icon={<Layers size={21} />}
          />
          <Metric
            title="Total Students"
            value={totalStudents}
            icon={<Users size={21} />}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative max-w-lg">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search class, section or teacher..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredClasses.length} of {classes.length} classes
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {filteredClasses.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {item.name}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {item.sections.length} sections
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.name}`}
                    className="rounded-lg border border-slate-200 p-2 hover:bg-amber-50"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    aria-label={`Delete ${item.name}`}
                    className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Students</p>
                  <p className="mt-1 text-xl font-bold">{item.students}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Capacity / Section</p>
                  <p className="mt-1 text-xl font-bold">{item.capacity}</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Sections
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => setSelectedClass(item)}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      Section {section}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-500">Class Teacher</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {item.teacher}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClass(item)}
                  className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900"
                >
                  View details <ChevronDown size={16} />
                </button>
              </div>
            </article>
          ))}
        </section>

        {filteredClasses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <School className="mx-auto text-slate-400" size={32} />
            <p className="mt-3 font-semibold">No classes found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search or add a new class.
            </p>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <form
            onSubmit={saveClass}
            className="my-auto w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId !== null ? "Edit Class" : "Add New Class"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <Field label="Class Name">
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="e.g. Class 8"
                className={inputStyle}
              />
            </Field>

            <Field label="Class Teacher">
              <input
                required
                value={form.teacher}
                onChange={(e) =>
                  setForm({ ...form, teacher: e.target.value })
                }
                placeholder="Teacher's full name"
                className={inputStyle}
              />
            </Field>

            <Field label="Sections (comma separated)">
              <input
                required
                value={form.sections}
                onChange={(e) =>
                  setForm({ ...form, sections: e.target.value })
                }
                placeholder="A, B, C"
                className={inputStyle}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Capacity per section">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  className={inputStyle}
                />
              </Field>
              <Field label="Total students">
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.students}
                  onChange={(e) =>
                    setForm({ ...form, students: e.target.value })
                  }
                  className={inputStyle}
                />
              </Field>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-amber-300"
              >
                Save Class
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedClass.name} Details
              </h2>
              <button
                onClick={() => setSelectedClass(null)}
                aria-label="Close details"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <p>
                <span className="text-slate-500">Class Teacher:</span>{" "}
                <strong>{selectedClass.teacher}</strong>
              </p>
              <p>
                <span className="text-slate-500">Total Students:</span>{" "}
                <strong>{selectedClass.students}</strong>
              </p>
              <p>
                <span className="text-slate-500">Sections:</span>{" "}
                <strong>{selectedClass.sections.join(", ")}</strong>
              </p>
              <div>
                <p className="mb-2 text-slate-500">Section-wise overview</p>
                {selectedClass.sections.map((section, index) => {
                  const count = Math.floor(
                    selectedClass.students / selectedClass.sections.length
                  ) + (index < selectedClass.students % selectedClass.sections.length ? 1 : 0);

                  return (
                    <div
                      key={section}
                      className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 p-3"
                    >
                      <span>Section {section}</span>
                      <span className="font-semibold">{count} students</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setSelectedClass(null)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold">Delete this class?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This removes the class from the current demo list. It does not
              delete student records in a backend.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={deleteClass}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputStyle =
  "w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="rounded-xl bg-amber-100 p-3 text-amber-800">
        {icon}
      </div>
    </div>
  );
}
