
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  CalendarDays,
  ClipboardList,
  Pencil,
  Trash2,
  X,
  Clock,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

type Exam = {
  id: number;
  name: string;
  type: string;
  className: string;
  subject: string;
  date: string;
  startTime: string;
  duration: string;
  totalMarks: number;
  status: "Scheduled" | "Completed" | "Draft";
};

const initialExams: Exam[] = [
  {
    id: 1,
    name: "Mid Term Examination",
    type: "Mid Term",
    className: "Class 10",
    subject: "Mathematics",
    date: "2026-11-05",
    startTime: "09:00",
    duration: "3 Hours",
    totalMarks: 100,
    status: "Scheduled",
  },
  {
    id: 2,
    name: "Final Examination",
    type: "Final",
    className: "Class 12",
    subject: "Physics",
    date: "2026-11-10",
    startTime: "10:00",
    duration: "3 Hours",
    totalMarks: 100,
    status: "Scheduled",
  },
  {
    id: 3,
    name: "Unit Test 1",
    type: "Unit Test",
    className: "Class 9",
    subject: "English",
    date: "2026-10-15",
    startTime: "09:30",
    duration: "2 Hours",
    totalMarks: 50,
    status: "Completed",
  },
];

const emptyForm = {
  name: "",
  type: "Mid Term",
  className: "Class 10",
  subject: "",
  date: "",
  startTime: "",
  duration: "3 Hours",
  totalMarks: 100,
  status: "Scheduled" as Exam["status"],
};

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [activeTab, setActiveTab] = useState<"schedule" | "types">("schedule");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const router = useRouter();

  const examTypes = ["Mid Term", "Final", "Unit Test", "Practical", "Internal"];

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        exam.name.toLowerCase().includes(search.toLowerCase()) ||
        exam.subject.toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        classFilter === "All Classes" || exam.className === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [exams, search, classFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingId(exam.id);
    setForm({
      name: exam.name,
      type: exam.type,
      className: exam.className,
      subject: exam.subject,
      date: exam.date,
      startTime: exam.startTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      status: exam.status,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingId !== null) {
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === editingId ? { ...form, id: editingId } : exam
        )
      );
    } else {
      setExams((prev) => [
        ...prev,
        { ...form, id: Date.now() },
      ]);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this examination?")) {
      setExams((prev) => prev.filter((exam) => exam.id !== id));
    }
  };
    

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-7">

      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
             <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center cursor-pointer gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>

          <h1 className="text-2xl font-extrabold text-gray-900">
            Exam Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, manage and schedule institution examinations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400"
        >
          <Plus size={18} />
          Create New Exam
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Total Exams",
            value: exams.length,
            icon: ClipboardList,
          },
          {
            title: "Scheduled",
            value: exams.filter((e) => e.status === "Scheduled").length,
            icon: CalendarDays,
          },
          {
            title: "Completed",
            value: exams.filter((e) => e.status === "Completed").length,
            icon: BookOpen,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">
                  {item.title}
                </p>
                <div className="rounded-xl bg-yellow-100 p-3">
                  <Icon size={21} />
                </div>
              </div>
              <h2 className="mt-3 text-3xl font-extrabold text-gray-900">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            activeTab === "schedule"
              ? "border-yellow-400 text-gray-950"
              : "border-transparent text-gray-500"
          }`}
        >
          <CalendarDays size={16} className="mr-2 inline" />
          Exam Schedule
        </button>

        <button
          onClick={() => setActiveTab("types")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            activeTab === "types"
              ? "border-yellow-400 text-gray-950"
              : "border-transparent text-gray-500"
          }`}
        >
          <ClipboardList size={16} className="mr-2 inline" />
          Exam Types
        </button>
      </div>

      {activeTab === "schedule" ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          {/* Search and Filter */}
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Examination Schedule
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Manage all scheduled examinations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exam or subject..."
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400 sm:w-64"
                />
              </div>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
              >
                <option>All Classes</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i}>Class {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5 text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-4">Examination</th>
                  <th className="px-4 py-4">Class / Subject</th>
                  <th className="px-4 py-4">Date & Time</th>
                  <th className="px-4 py-4">Total Marks</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredExams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="border-b border-gray-50 text-sm last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900">{exam.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{exam.type}</p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800">
                        {exam.className}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {exam.subject}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800">{exam.date}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={13} /> {exam.startTime}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-semibold text-gray-700">
                      {exam.totalMarks}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          exam.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : exam.status === "Draft"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {exam.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(exam)}
                          aria-label="Edit exam"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(exam.id)}
                          aria-label="Delete exam"
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredExams.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-500">
                No examinations found.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Examination Types</h2>
          <p className="mb-5 mt-1 text-xs text-gray-500">
            Available examination categories.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {examTypes.map((type, index) => (
              <div
                key={type}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-4"
              >
                <div className="rounded-xl bg-yellow-100 p-3">
                  <ClipboardList size={21} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{type}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Examination Type {index + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-5 w-full max-w-2xl rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId !== null ? "Edit Examination" : "Create New Exam"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Enter examination details below.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Examination Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter examination name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Exam Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                >
                  {examTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Class
                </label>
                <select
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i}>Class {i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Subject
                </label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Enter subject"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Exam Date
                </label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Start Time
                </label>
                <input
                  required
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Duration
                </label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                >
                  <option>1 Hour</option>
                  <option>2 Hours</option>
                  <option>3 Hours</option>
                  <option>4 Hours</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Total Marks
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.totalMarks}
                  onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Exam["status"] })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                >
                  <option>Scheduled</option>
                  <option>Completed</option>
                  <option>Draft</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-yellow-300 px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-yellow-400"
                >
                  {editingId !== null ? "Update Exam" : "Save Examination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
