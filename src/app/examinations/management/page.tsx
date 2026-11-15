"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Loader2,
  FileCheck2,
} from "lucide-react";
import { api } from "@/lib/api";

type ExamStatus = "Scheduled" | "Ongoing" | "Completed" | "Results Published" | "Draft";

type Exam = {
  id: string;
  name: string;
  type: string;
  className: string;
  section: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  status: ExamStatus;
};

const emptyForm = {
  name: "",
  type: "",
  className: "",
  section: "",
  subject: "",
  date: "",
  startTime: "",
  endTime: "",
  duration: "",
  totalMarks: 100,
  passingMarks: 33,
  instructions: "",
  status: "Scheduled" as ExamStatus,
};

function computeDuration(startTime: string, endTime: string) {
  const s = startTime.match(/^(\d{1,2}):(\d{2})$/);
  const e = endTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!s || !e) return "";
  const startMins = Number(s[1]) * 60 + Number(s[2]);
  const endMins = Number(e[1]) * 60 + Number(e[2]);
  if (endMins <= startMins) return "";
  const diff = endMins - startMins;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} min`;
  if (hrs > 0) return `${hrs} Hour${hrs > 1 ? "s" : ""}`;
  return `${mins} Minutes`;
}

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [studentClassInfo, setStudentClassInfo] = useState<{ className: string; section: string }>({
    className: "",
    section: "",
  });
  const [examScope, setExamScope] = useState<{
    role?: string;
    scopedBy?: string;
    assignedClass?: string;
    assignedSection?: string;
    missingAssignment?: boolean;
    message?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"schedule" | "types">("schedule");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [sectionFilter, setSectionFilter] = useState("All Sections");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const router = useRouter();

  const canCreate = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(userRole);
  const canEdit = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(userRole);
  const canDelete = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);
  const canShowActions = canEdit || canDelete;
  const isStudent = userRole === "STUDENT" || userRole === "USER";

  const resolveStoredRole = () => {
    const userKeys = ["eduflow-user", "edunexus-user", "currentUser", "user"];
    for (const key of userKeys) {
      try {
        const userStr = localStorage.getItem(key);
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed?.role) return String(parsed.role).toUpperCase();
        }
      } catch {
        // Ignore malformed JSON
      }
    }
    return (
      localStorage.getItem("eduflow-role") ||
      localStorage.getItem("eduflow-demo-role") ||
      localStorage.getItem("role") ||
      ""
    ).toUpperCase();
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<{
        success?: boolean;
        exams?: any[];
        scope?: {
          role?: string;
          scopedBy?: string;
          assignedClass?: string;
          assignedSection?: string;
          missingAssignment?: boolean;
          message?: string;
        };
      }>("/exams");
      setExamScope(res?.scope || null);
      if (res && Array.isArray(res.exams)) {
        const mapped: Exam[] = res.exams.map((e: any) => ({
          id: String(e._id || e.id),
          name: e.title || e.name || "",
          type: e.examType || "",
          className: e.className || "",
          section: e.section || "",
          subject:
            e.subject ||
            (Array.isArray(e.subjects) && e.subjects.length > 0
              ? e.subjects.map((s: any) => s.subjectName).filter(Boolean).join(", ")
              : ""),
          date: e.startDate ? String(e.startDate).slice(0, 10) : "",
          startTime: e.startTime || "",
          endTime: e.endTime || "",
          duration: e.duration || "",
          totalMarks:
            e.totalMarks ??
            (Array.isArray(e.subjects) && e.subjects[0]?.maxMarks ? e.subjects[0].maxMarks : 100),
          passingMarks:
            e.passingMarks ??
            (Array.isArray(e.subjects) && e.subjects[0]?.passingMarks !== undefined
              ? e.subjects[0].passingMarks
              : 33),
          instructions: e.instructions || "",
          status: (e.status as ExamStatus) || "Scheduled",
        }));
        setExams(mapped);
      } else {
        setExams([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load examinations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const syncRole = () => {
      const resolved = resolveStoredRole();
      if (resolved) setUserRole(resolved);
      try {
        const userStr = localStorage.getItem("eduflow-user");
        if (userStr) {
          const parsed = JSON.parse(userStr);
          setStudentClassInfo({
            className: String(parsed?.className || "").trim(),
            section: String(parsed?.section || "").trim(),
          });
        }
      } catch {}
    };

    syncRole();
    fetchExams();

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("eduflow-token");

    if (token) {
      api
        .get<{ user?: { role?: string; className?: string; section?: string } }>("/auth/me")
        .then((res) => {
          const liveRole = res?.user?.role ? String(res.user.role).toUpperCase() : "";
          if (liveRole) setUserRole(liveRole);
          if (res?.user) {
            setStudentClassInfo({
              className: String(res.user.className || "").trim(),
              section: String(res.user.section || "").trim(),
            });
          }
        })
        .catch(() => {});
    }

    const handleUserChange = () => {
      setClassFilter("All Classes");
      setSectionFilter("All Sections");
      syncRole();
      fetchExams();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchExams();
    };

    window.addEventListener("eduflow-user-change", handleUserChange);
    window.addEventListener("eduflow-exams-change", fetchExams);
    window.addEventListener("storage", syncRole);
    window.addEventListener("focus", fetchExams);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("eduflow-user-change", handleUserChange);
      window.removeEventListener("eduflow-exams-change", fetchExams);
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("focus", fetchExams);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const classOptions = useMemo(() => {
    return Array.from(new Set(exams.map((e) => e.className).filter(Boolean)));
  }, [exams]);

  const sectionOptions = useMemo(() => {
    return Array.from(new Set(exams.map((e) => e.section).filter(Boolean)));
  }, [exams]);

  const examTypes = useMemo(() => {
    const counts = new Map<string, number>();
    exams.forEach((e) => {
      const key = e.type.trim();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = search.toLowerCase();
      const matchesSearch =
        exam.name.toLowerCase().includes(q) ||
        exam.type.toLowerCase().includes(q) ||
        exam.subject.toLowerCase().includes(q) ||
        exam.section.toLowerCase().includes(q);

      const matchesClass =
        classFilter === "All Classes" || exam.className === classFilter;

      const matchesSection =
        sectionFilter === "All Sections" || exam.section === sectionFilter;

      return matchesSearch && matchesClass && matchesSection;
    });
  }, [exams, search, classFilter, sectionFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingId(exam.id);
    setForm({
      name: exam.name,
      type: exam.type,
      className: exam.className,
      section: exam.section,
      subject: exam.subject,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      instructions: exam.instructions,
      status: exam.status,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (editingId !== null ? !canEdit : !canCreate) {
      setFormError("You are not authorized to manage exam schedules.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.type.trim() ||
      !form.className.trim() ||
      !form.section.trim() ||
      !form.subject.trim() ||
      !form.date ||
      !form.startTime
    ) {
      setFormError("Please fill all required exam schedule fields.");
      return;
    }

    const computedDur = form.endTime
      ? computeDuration(form.startTime, form.endTime)
      : "";
    if (form.endTime && !computedDur) {
      setFormError("End time must be later than start time.");
      return;
    }

    const finalDuration = form.duration.trim() || computedDur;
    if (!form.endTime && !finalDuration) {
      setFormError("Please enter an End Time or Duration.");
      return;
    }

    if (form.totalMarks <= 0) {
      setFormError("Total Marks must be greater than 0.");
      return;
    }

    if (form.passingMarks < 0 || form.passingMarks > form.totalMarks) {
      setFormError("Passing Marks must be between 0 and Total Marks.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.name.trim(),
        examType: form.type.trim(),
        className: form.className.trim(),
        section: form.section.trim(),
        subject: form.subject.trim(),
        academicYear: "2026-2027",
        startDate: form.date,
        endDate: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        duration: finalDuration,
        totalMarks: Number(form.totalMarks),
        passingMarks: Number(form.passingMarks),
        instructions: form.instructions.trim(),
        status: form.status,
      };

      if (editingId) {
        await api.put(`/exams/${editingId}`, payload);
      } else {
        await api.post("/exams", payload);
      }

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchExams();
      window.dispatchEvent(new Event("eduflow-exams-change"));
    } catch (err: any) {
      setFormError(err.message || "Failed to save examination schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      setError("Only Super Admin, Admin, and Principal can delete examinations.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this examination schedule?")) {
      try {
        await api.delete(`/exams/${id}`);
        await fetchExams();
        window.dispatchEvent(new Event("eduflow-exams-change"));
      } catch (err: any) {
        setError(err.message || "Failed to delete examination schedule.");
      }
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
            {isStudent
              ? studentClassInfo.className
                ? `View published examination schedules for ${studentClassInfo.className}${studentClassInfo.section ? ` (Section ${studentClassInfo.section})` : ""}.`
                : examScope?.message || "View published examination schedules."
              : "Create, manage and schedule institution examinations."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* {!isStudent && (
            <Link
              href="/examinations/result-processing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-950 transition hover:bg-yellow-100"
            >
              <FileCheck2 size={18} />
              Result Processing
            </Link>
          )} */}

          {canCreate && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400"
            >
              <Plus size={18} />
              Create Exam Schedule
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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
            value: exams.filter((e) =>
              ["Scheduled", "Upcoming", "Ongoing"].includes(e.status)
            ).length,
            icon: CalendarDays,
          },
          {
            title: "Completed",
            value: exams.filter((e) =>
              ["Completed", "Results Published"].includes(e.status)
            ).length,
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
                <option value="All Classes">All Classes</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
              >
                <option value="All Sections">All Sections</option>
                {sectionOptions.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
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
                  <th className="px-4 py-4">Marks</th>
                  <th className="px-4 py-4">Status</th>
                  {canShowActions && <th className="px-4 py-4 text-right">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={canShowActions ? 6 : 5} className="px-4 py-12 text-center text-sm text-gray-500">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-yellow-500" />
                      Loading examinations...
                    </td>
                  </tr>
                ) : filteredExams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="border-b border-gray-50 text-sm last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900">{exam.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{exam.type}</p>
                      {exam.instructions && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-400" title={exam.instructions}>
                          {exam.instructions}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800">
                        {exam.className}
                        {exam.section ? ` • Sec ${exam.section}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {exam.subject || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800">{exam.date}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={13} />
                        <span>
                          {exam.startTime || "—"}
                          {exam.endTime ? ` - ${exam.endTime}` : ""}
                          {exam.duration ? ` (${exam.duration})` : ""}
                        </span>
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-700">
                        {exam.totalMarks} Marks
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Pass: {exam.passingMarks}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          exam.status === "Completed" || exam.status === "Results Published"
                            ? "bg-green-100 text-green-700"
                            : exam.status === "Ongoing"
                              ? "bg-blue-100 text-blue-700"
                              : exam.status === "Draft"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {exam.status}
                      </span>
                    </td>

                    {canShowActions && (
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {!isStudent && (
                            <Link
                              href={`/examinations/result-processing?exam=${encodeURIComponent(exam.name)}&class=${encodeURIComponent(exam.className)}&subject=${encodeURIComponent(exam.subject)}`}
                              title="Enter Student Marks"
                              aria-label="Enter marks"
                              className="rounded-lg bg-yellow-50 p-2 text-yellow-800 hover:bg-yellow-100"
                            >
                              <FileCheck2 size={16} />
                            </Link>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => openEditModal(exam)}
                              aria-label="Edit exam"
                              className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                            >
                              <Pencil size={16} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(exam.id)}
                              aria-label="Delete exam"
                              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredExams.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-500">
                {examScope?.missingAssignment && userRole === "STUDENT"
                  ? examScope.message
                  : isStudent && studentClassInfo.className && exams.length === 0
                    ? `No published examinations scheduled for ${studentClassInfo.className}${studentClassInfo.section ? ` (Section ${studentClassInfo.section})` : ""}.`
                    : "No examinations found."}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Examination Types</h2>
          <p className="mb-5 mt-1 text-xs text-gray-500">
            Categories from your scheduled examinations.
          </p>

          {examTypes.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No exam types available yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {examTypes.map(({ type, count }) => (
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
                      {count} {count === 1 ? "Schedule" : "Schedules"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-5 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId !== null ? "Edit Exam Schedule" : "Create Exam Schedule"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Enter examination schedule details below.
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
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 sm:col-span-2">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Exam Name 
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter exam name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Exam Type 
                </label>
                <input
                  type="text"
                  required
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  placeholder="e.g. Mid-Term, Unit Test, Pre-Board"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Class / Department 
                </label>
                <input
                  type="text"
                  required
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  placeholder="e.g. 10th, Class 12, B.Tech"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Section 
                </label>
                <input
                  type="text"
                  required
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="e.g. A, B, All"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Subject 
                </label>
                <input
                  type="text"
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
                  onChange={(e) => {
                    const nextStart = e.target.value;
                    const autoDur = form.endTime ? computeDuration(nextStart, form.endTime) : form.duration;
                    setForm({ ...form, startTime: nextStart, duration: autoDur || form.duration });
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => {
                    const nextEnd = e.target.value;
                    const autoDur = computeDuration(form.startTime, nextEnd);
                    setForm({ ...form, endTime: nextEnd, duration: autoDur || form.duration });
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Duration {!form.endTime ? "*" : ""}
                </label>
                <input
                  type="text"
                  required={!form.endTime}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 3 Hours (auto-calculated from End Time)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ExamStatus })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Results Published">Results Published</option>
                  <option value="Draft">Draft</option>
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
                  Passing Marks 
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max={form.totalMarks || undefined}
                  value={form.passingMarks}
                  onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="Optional examination rules or reporting time..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
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
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingId !== null ? "Update Exam Schedule" : "Save Exam Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
