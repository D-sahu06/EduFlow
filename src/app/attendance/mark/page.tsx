"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ClipboardCheck,
  Edit3,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { hasFeatureAccess } from "@/lib/permissions";
import type { Role } from "@/types/permission";

type Status = "Present" | "Absent" | "Late" | "On Leave";

type ManualStudentEntry = {
  localId: string;
  studentName: string;
  rollNumber: string;
  status: Status;
};

type SavedAttendanceRecord = {
  id: string;
  studentName: string;
  rollNumber: string;
  className: string;
  section: string;
  date: string;
  status: Status;
  remarks: string;
};

const statuses: Status[] = ["Present", "Absent", "Late", "On Leave"];

const statusStyles: Record<Status, string> = {
  Present: "border-green-500 bg-green-100 text-green-800 ring-2 ring-green-500/30",
  Absent: "border-red-500 bg-red-100 text-red-800 ring-2 ring-red-500/30",
  Late: "border-yellow-500 bg-yellow-100 text-yellow-900 ring-2 ring-yellow-500/30",
  "On Leave": "border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-500/30",
};

const statusBadgeStyles: Record<Status, string> = {
  Present: "border border-green-200 bg-green-50 text-green-700",
  Absent: "border border-red-200 bg-red-50 text-red-700",
  Late: "border border-yellow-300 bg-yellow-50 text-yellow-800",
  "On Leave": "border border-blue-200 bg-blue-50 text-blue-700",
};

function getToday() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function normalizeClassValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^class\s+/i, "")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ");
}

function cleanSectionInput(value: string) {
  const trimmed = value.trim().replace(/^section\s+/i, "").trim();
  return trimmed.length === 1 ? trimmed.toUpperCase() : trimmed;
}

function normalizeSectionValue(value: string) {
  return cleanSectionInput(value).toLowerCase();
}

function normalizeRollValue(value: string) {
  return value.trim().toLowerCase();
}

function isValidStatus(value: string): value is Status {
  return statuses.includes(value as Status);
}

/** Formats student metadata fields without inventing missing values. */
function formatMetaLine(rollNumber: string, className: string, section: string) {
  return [
    rollNumber ? `Roll: ${rollNumber}` : "",
    [className, section].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function MarkAttendancePage() {
  const router = useRouter();

  // Shared Date / Class / Section / Search filters
  const [date, setDate] = useState(getToday());
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [search, setSearch] = useState("");

  // Real saved attendance records from MongoDB
  const [savedRecords, setSavedRecords] = useState<SavedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [editingSavedStatus, setEditingSavedStatus] = useState<Status>("Present");
  const [updatingSavedId, setUpdatingSavedId] = useState<string | null>(null);

  // Inline Manual Student Attendance Form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [entryName, setEntryName] = useState("");
  const [entryRoll, setEntryRoll] = useState("");
  const [entryStatus, setEntryStatus] = useState<Status | "">("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [manualEntries, setManualEntries] = useState<ManualStudentEntry[]>([]);
  const [formError, setFormError] = useState("");

  // Top-level save/feedback state
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isErrorFeedback, setIsErrorFeedback] = useState(false);
  const [userRole, setUserRole] = useState<Role | "">("");

  useEffect(() => {
    let resolvedRole = "";
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?.role) resolvedRole = String(parsed.role).toUpperCase();
      }
    } catch {}
    if (!resolvedRole) {
      resolvedRole = (localStorage.getItem("eduflow-role") || localStorage.getItem("role") || "").toUpperCase();
    }
    setUserRole(resolvedRole as Role | "");
  }, []);

  const canEditSaved =
    !userRole || hasFeatureAccess(userRole, "attendance", "markAttendance", "edit");
  const canDeleteSaved = Boolean(
    userRole && hasFeatureAccess(userRole, "attendance", "markAttendance", "delete")
  );

  const fetchSavedAttendance = useCallback(
    async (targetDate: string, targetClass: string, targetSection: string) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (targetDate) params.set("date", targetDate);
        if (targetClass.trim()) params.set("className", targetClass.trim());
        if (targetSection.trim()) params.set("section", cleanSectionInput(targetSection));

        const res = await api.get<{ success?: boolean; records?: any[] }>(
          `/attendance${params.toString() ? `?${params.toString()}` : ""}`
        );

        if (res && Array.isArray(res.records)) {
          const mapped: SavedAttendanceRecord[] = res.records
            .map((rec: any) => {
              const stuName = String(rec.studentName || rec.student?.name || "").trim();
              const stuRoll = String(
                rec.rollNumber || rec.student?.rollNumber || rec.student?.studentId || ""
              ).trim();
              const recClass = String(rec.className || rec.student?.className || "").trim();
              const recSection = String(rec.section || rec.student?.section || "").trim();
              const recStatus = isValidStatus(rec.status) ? rec.status : null;

              if (!rec._id || !recStatus) return null;
              return {
                id: String(rec._id),
                studentName: stuName,
                rollNumber: stuRoll,
                className: recClass,
                section: recSection,
                date: rec.date ? String(rec.date).slice(0, 10) : targetDate,
                status: recStatus,
                remarks: String(rec.remarks || ""),
              };
            })
            .filter((item): item is SavedAttendanceRecord => item !== null);

          setSavedRecords(mapped);
        } else {
          setSavedRecords([]);
        }
      } catch (err: any) {
        setSavedRecords([]);
        setIsErrorFeedback(true);
        setFeedbackMessage(err.message || "Failed to load saved attendance from database.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSavedAttendance(date, className, section);
    }, 200);

    return () => clearTimeout(timer);
  }, [date, className, section, fetchSavedAttendance]);

  const visibleSavedRecords = useMemo(() => {
    const enteredClass = normalizeClassValue(className);
    const enteredSection = normalizeSectionValue(section);
    const searchTerm = search.trim().toLowerCase();

    return savedRecords.filter((rec) => {
      const matchesClass =
        !enteredClass || normalizeClassValue(rec.className) === enteredClass;
      const matchesSection =
        !enteredSection || normalizeSectionValue(rec.section) === enteredSection;
      const matchesSearch =
        !searchTerm ||
        rec.studentName.toLowerCase().includes(searchTerm) ||
        rec.rollNumber.toLowerCase().includes(searchTerm);

      return matchesClass && matchesSection && matchesSearch;
    });
  }, [savedRecords, className, section, search]);

  const counts = useMemo(() => {
    const sourceStatuses: Status[] = [
      ...visibleSavedRecords.map((r) => r.status),
      ...manualEntries.map((e) => e.status),
    ];

    return {
      present: sourceStatuses.filter((s) => s === "Present").length,
      absent: sourceStatuses.filter((s) => s === "Absent").length,
      late: sourceStatuses.filter((s) => s === "Late").length,
      leave: sourceStatuses.filter((s) => s === "On Leave").length,
    };
  }, [visibleSavedRecords, manualEntries]);

  function openManualAttendanceForm() {
    setShowManualForm(true);
    setFormError("");
    setFeedbackMessage("");
    setIsErrorFeedback(false);
  }

  function resetStudentInputs() {
    setEntryName("");
    setEntryRoll("");
    setEntryStatus("");
    setEditingEntryId(null);
  }

  function hasDuplicateForCurrentContext(roll: string, ignoreLocalId: string | null) {
    const rollKey = normalizeRollValue(roll);
    const dupInQueue = manualEntries.some(
      (entry) =>
        entry.localId !== ignoreLocalId && normalizeRollValue(entry.rollNumber) === rollKey
    );
    if (dupInQueue) {
      return `Roll Number "${roll.trim()}" is already added in the pending list.`;
    }

    const targetClassKey = normalizeClassValue(className);
    const targetSectionKey = normalizeSectionValue(section);
    const dupInSaved = savedRecords.some(
      (rec) =>
        rec.date === date &&
        normalizeRollValue(rec.rollNumber) === rollKey &&
        (!targetClassKey || normalizeClassValue(rec.className) === targetClassKey) &&
        (!targetSectionKey || normalizeSectionValue(rec.section) === targetSectionKey)
    );
    if (dupInSaved) {
      return `Attendance already exists in MongoDB for Roll Number "${roll.trim()}" on ${date}.`;
    }

    return "";
  }

  function handleAddOrUpdateStudent(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmedClass = className.trim();
    const cleanedSection = cleanSectionInput(section);
    const trimmedName = entryName.trim();
    const trimmedRoll = entryRoll.trim();

    if (!date) {
      setFormError("Please select an Attendance Date.");
      return;
    }
    if (!trimmedClass) {
      setFormError("Please enter a Class.");
      return;
    }
    if (!cleanedSection) {
      setFormError("Please enter a Section.");
      return;
    }
    if (!trimmedName) {
      setFormError("Please enter Student Name.");
      return;
    }
    if (!trimmedRoll) {
      setFormError("Please enter Roll Number.");
      return;
    }
    if (!entryStatus) {
      setFormError("Please select an attendance status (Present, Absent, Late, or On Leave).");
      return;
    }

    const dupMessage = hasDuplicateForCurrentContext(trimmedRoll, editingEntryId);
    if (dupMessage) {
      setFormError(dupMessage);
      return;
    }

    if (editingEntryId) {
      setManualEntries((current) =>
        current.map((item) =>
          item.localId === editingEntryId
            ? {
                ...item,
                studentName: trimmedName,
                rollNumber: trimmedRoll,
                status: entryStatus,
              }
            : item
        )
      );
    } else {
      const localId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setManualEntries((current) => [
        ...current,
        {
          localId,
          studentName: trimmedName,
          rollNumber: trimmedRoll,
          status: entryStatus,
        },
      ]);
    }

    resetStudentInputs();
  }

  function handleEditQueuedEntry(entry: ManualStudentEntry) {
    setShowManualForm(true);
    setEntryName(entry.studentName);
    setEntryRoll(entry.rollNumber);
    setEntryStatus(entry.status);
    setEditingEntryId(entry.localId);
    setFormError("");
  }

  function handleRemoveQueuedEntry(localId: string) {
    setManualEntries((current) => current.filter((item) => item.localId !== localId));
    if (editingEntryId === localId) {
      resetStudentInputs();
    }
    setFormError("");
  }

  function handleQueuedEntryStatusChange(localId: string, status: Status) {
    setManualEntries((current) =>
      current.map((item) => (item.localId === localId ? { ...item, status } : item))
    );
    setFormError("");
  }

  function markAllPresent() {
    if (manualEntries.length === 0) {
      setShowManualForm(true);
      setIsErrorFeedback(true);
      setFeedbackMessage("Add student entries in the attendance form first before marking all Present.");
      return;
    }

    setManualEntries((current) =>
      current.map((entry) => ({
        ...entry,
        status: "Present",
      }))
    );
    setFeedbackMessage("");
    setIsErrorFeedback(false);
  }

  async function saveAttendance() {
    setFormError("");
    setFeedbackMessage("");
    setIsErrorFeedback(false);

    const trimmedClass = className.trim();
    const cleanedSection = cleanSectionInput(section);

    if (!showManualForm) {
      setShowManualForm(true);
    }

    if (!date) {
      setIsErrorFeedback(true);
      setFeedbackMessage("Please select an Attendance Date before saving.");
      return;
    }

    if (!trimmedClass || !cleanedSection) {
      setIsErrorFeedback(true);
      setFeedbackMessage("Please enter both Class and Section manually before saving.");
      return;
    }

    if (manualEntries.length === 0) {
      setIsErrorFeedback(true);
      setFeedbackMessage("Please add at least one student using 'Add Student' before saving.");
      return;
    }

    const seenRolls = new Set<string>();
    for (const entry of manualEntries) {
      const key = normalizeRollValue(entry.rollNumber);
      if (seenRolls.has(key)) {
        setIsErrorFeedback(true);
        setFeedbackMessage(`Duplicate Roll Number "${entry.rollNumber}" found in list.`);
        return;
      }
      seenRolls.add(key);
    }

    setSaving(true);
    try {
      const payload = {
        date,
        className: trimmedClass,
        section: cleanedSection,
        rejectDuplicates: true,
        records: manualEntries.map((entry) => ({
          studentName: entry.studentName.trim(),
          rollNumber: entry.rollNumber.trim(),
          className: trimmedClass,
          section: cleanedSection,
          status: entry.status,
        })),
      };

      const res = await api.post<{ success?: boolean; message?: string }>(
        "/attendance/mark",
        payload
      );

      const savedCount = manualEntries.length;
      setManualEntries([]);
      resetStudentInputs();
      await fetchSavedAttendance(date, trimmedClass, cleanedSection);

      setIsErrorFeedback(false);
      setFeedbackMessage(
        res?.message ||
          `Attendance saved successfully for ${savedCount} student${savedCount === 1 ? "" : "s"}!`
      );
    } catch (err: any) {
      setIsErrorFeedback(true);
      setFeedbackMessage(err.message || "Failed to save attendance records.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveExistingStatus(rec: SavedAttendanceRecord) {
    try {
      setUpdatingSavedId(rec.id);
      setFeedbackMessage("");
      setIsErrorFeedback(false);

      await api.put(`/attendance/${rec.id}`, {
        status: editingSavedStatus,
      });

      setEditingSavedId(null);
      await fetchSavedAttendance(date, className, section);
      setIsErrorFeedback(false);
      setFeedbackMessage(`Updated attendance for ${rec.studentName} to ${editingSavedStatus}.`);
    } catch (err: any) {
      setIsErrorFeedback(true);
      setFeedbackMessage(err.message || "Failed to update saved attendance record.");
    } finally {
      setUpdatingSavedId(null);
    }
  }

  async function handleDeleteSavedRecord(rec: SavedAttendanceRecord) {
    try {
      setUpdatingSavedId(rec.id);
      setFeedbackMessage("");
      setIsErrorFeedback(false);

      await api.delete(`/attendance/${rec.id}`);
      await fetchSavedAttendance(date, className, section);
      setIsErrorFeedback(false);
      setFeedbackMessage(`Removed attendance record for ${rec.studentName}.`);
    } catch (err: any) {
      setIsErrorFeedback(true);
      setFeedbackMessage(err.message || "Failed to delete attendance record.");
    } finally {
      setUpdatingSavedId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="mt-2 text-2xl font-extrabold text-gray-950 md:text-3xl">
                Mark Attendance
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Record daily attendance for students by class and section.
              </p>
            </div>

            <button
              type="button"
              onClick={saveAttendance}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div
            role="status"
            className={`rounded-2xl p-4 text-sm font-semibold ${
              !isErrorFeedback
                ? "border border-green-200 bg-green-50 text-green-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        {/* Filter bar */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Class / Department
              </label>
              <input
                type="text"
                autoComplete="off"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Section
              </label>
              <input
                type="text"
                autoComplete="off"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Enter section"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Search Student
              </label>
              <div className="relative">
                <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or roll number"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats & Quick Actions */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-green-50 px-3.5 py-1.5 text-xs font-bold text-green-700">
              Present: {counts.present}
            </span>
            <span className="rounded-xl bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700">
              Absent: {counts.absent}
            </span>
            <span className="rounded-xl bg-yellow-50 px-3.5 py-1.5 text-xs font-bold text-yellow-800">
              Late: {counts.late}
            </span>
            <span className="rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
              On Leave: {counts.leave}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openManualAttendanceForm}
              className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-gray-950 transition hover:bg-yellow-300 cursor-pointer"
            >
              <ClipboardCheck size={16} />
              Mark Attendance
            </button>

            <button
              type="button"
              onClick={markAllPresent}
              className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-xs font-bold text-green-800 transition hover:bg-green-100 cursor-pointer"
            >
              <CheckCheck size={16} />
              Mark All Present
            </button>
          </div>
        </section>

        {/* Inline Manual Student Attendance Entry Form */}
        {showManualForm && (
          <section className="rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Manual Student Attendance Form
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Enter Date, Class, and Section, add each student with their Roll Number and status, then click Save Attendance at the top right.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label="Close manual attendance form"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddOrUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Attendance Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setFormError("");
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Class / Department *
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      setFormError("");
                    }}
                    placeholder="Enter class"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Section *
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={section}
                    onChange={(e) => {
                      setSection(e.target.value);
                      setFormError("");
                    }}
                    placeholder="Enter section"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={entryName}
                    onChange={(e) => {
                      setEntryName(e.target.value);
                      setFormError("");
                    }}
                    placeholder="Enter student name"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={entryRoll}
                    onChange={(e) => {
                      setEntryRoll(e.target.value);
                      setFormError("");
                    }}
                    placeholder="Enter roll number"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 sm:flex-row sm:items-center">
                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Attendance Status *
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {statuses.map((s) => {
                      const isSelected = entryStatus === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setEntryStatus(s);
                            setFormError("");
                          }}
                          aria-pressed={isSelected}
                          className={`inline-flex items-center gap-1.5 rounded-xl border bg-white px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? statusStyles[s]
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {isSelected && <Check size={13} />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={resetStudentInputs}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-gray-950 transition hover:bg-yellow-300 cursor-pointer"
                  >
                    <Plus size={16} />
                    {editingEntryId ? "Update Student" : "Add Student"}
                  </button>
                </div>
              </div>
            </form>

            {/* Staged Manual Entries List / Table */}
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Added Students Ready to Save ({manualEntries.length})
                </h3>
                {manualEntries.length > 0 && (
                  <span className="text-xs font-medium text-amber-700">
                    Click &quot;Save Attendance&quot; at top right to save to MongoDB
                  </span>
                )}
              </div>

              {manualEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                  No students added yet. Enter a student&apos;s name, roll number, and status above, then click &quot;Add Student&quot;.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">Student Name</th>
                        <th className="px-4 py-3 font-semibold">Roll Number</th>
                        <th className="px-4 py-3 font-semibold">Class - Section</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {manualEntries.map((entry, idx) => (
                        <tr key={entry.localId} className="hover:bg-gray-50/70">
                          <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {entry.studentName}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{entry.rollNumber}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {[className.trim(), cleanSectionInput(section)]
                              .filter(Boolean)
                              .join(" - ") || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {statuses.map((s) => {
                                const isSelected = entry.status === s;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() =>
                                      handleQueuedEntryStatusChange(entry.localId, s)
                                    }
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                                      isSelected
                                        ? statusStyles[s]
                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditQueuedEntry(entry)}
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                                title="Edit student entry"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveQueuedEntry(entry.localId)}
                                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Remove student entry"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Saved Attendance Records from MongoDB */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Saved Attendance Records
              </h2>
              <p className="text-xs text-gray-500">
                Real attendance entries stored 
                {date ? ` for ${date}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-gray-800">
              {visibleSavedRecords.length} record{visibleSavedRecords.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Loader2 className="animate-spin text-yellow-500" size={20} />
              Loading attendance records...
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleSavedRecords.map((rec) => {
                const isEditingThis = editingSavedId === rec.id;
                const isBusy = updatingSavedId === rec.id;

                return (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center hover:bg-gray-50/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-900">
                        {(rec.studentName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {rec.studentName || "Unnamed Student"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatMetaLine(rec.rollNumber, rec.className, rec.section)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isEditingThis ? (
                        <>
                          {statuses.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditingSavedStatus(s)}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                                editingSavedStatus === s
                                  ? statusStyles[s]
                                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSaveExistingStatus(rec)}
                            className="rounded-xl bg-yellow-400 px-3 py-1.5 text-xs font-bold text-gray-950 hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
                          >
                            {isBusy ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSavedId(null)}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold ${statusBadgeStyles[rec.status]}`}
                          >
                            {rec.status}
                          </span>
                          {canEditSaved && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setEditingSavedId(rec.id);
                                setEditingSavedStatus(rec.status);
                              }}
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                              title="Edit saved attendance"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {canDeleteSaved && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteSavedRecord(rec)}
                              className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                              title="Delete saved attendance"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleSavedRecords.length === 0 && (
                <div className="p-12 text-center text-sm text-gray-500">
                  {search.trim()
                    ? "No matching attendance records found."
                    : "No saved attendance records found for this date, class, and section. Click \"Mark Attendance\" to add students."}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
