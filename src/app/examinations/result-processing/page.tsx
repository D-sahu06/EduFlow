"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  Loader2,
  Save,
  Search,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";

type StudentBase = {
  id: string;
  rollNo: string;
  name: string;
  className: string;
};

type StudentResultRow = StudentBase & {
  marks: number | "";
  maxMarks: number;
  source: "empty" | "saved" | "draft";
};

type ExamOption = {
  id: string;
  name: string;
  className: string;
  subject: string;
  maxMarks: number;
};

type RawSubjectMark = {
  subjectName?: string;
  marksObtained?: number;
  maxMarks?: number;
};

type RawExamResult = {
  _id: string;
  exam?: {
    _id?: string;
    title?: string;
    className?: string;
  } | string;
  student?: {
    _id?: string;
  } | string;
  className?: string;
  subjects?: RawSubjectMark[];
};

type SavedContextState = {
  examinationName: string;
  classNameInput: string;
  subjectName: string;
};

const CONTEXT_STORAGE_PREFIX = "eduflow-result-processing-context";
const DRAFT_STORAGE_PREFIX = "eduflow-result-processing-drafts";

function normalizeText(value: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizeClassKey(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^class\s+/i, "")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ");
}

function formatClassDisplay(value?: string) {
  const clean = String(value || "").trim();
  if (!clean) return "Class 10";
  return /^class\s+/i.test(clean) ? clean : `Class ${clean}`;
}

function getUserScopeKey() {
  if (typeof window === "undefined") return "default";
  try {
    const raw = localStorage.getItem("eduflow-user");
    if (!raw) return "default";
    const parsed = JSON.parse(raw);
    return String(parsed?._id || parsed?.id || parsed?.email || parsed?.role || "default");
  } catch {
    return "default";
  }
}

function buildContextKey(examName: string, className: string, subjectName: string) {
  return `${normalizeText(examName)}|${normalizeClassKey(className)}|${normalizeText(subjectName)}`;
}

function readStoredJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ResultProcessingPage() {
  const router = useRouter();

  const [students, setStudents] = useState<StudentBase[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [savedResults, setSavedResults] = useState<RawExamResult[]>([]);

  // Manually editable Examination, Class, and Subject inputs
  const [examinationName, setExaminationName] = useState<string>("");
  const [classNameInput, setClassNameInput] = useState<string>("");
  const [subjectName, setSubjectName] = useState<string>("");
  const [contextInitialized, setContextInitialized] = useState(false);

  // Unsubmitted edits per (exam, class, subject) context so refreshes never lose typed marks
  const [draftMarksByContext, setDraftMarksByContext] = useState<
    Record<string, Record<string, number | "">>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window === "undefined") return "TEACHER";
    try {
      const userStr = localStorage.getItem("eduflow-user") || localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role) return String(u.role).toUpperCase();
      }
      const storedRole =
        localStorage.getItem("eduflow-role") ||
        localStorage.getItem("eduflow-demo-role") ||
        localStorage.getItem("role");
      if (storedRole) return String(storedRole).toUpperCase();
    } catch {}
    return "TEACHER";
  });
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  const canEnterMarks = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(userRole.toUpperCase());

  const userScopeKey = useMemo(() => getUserScopeKey(), []);
  const contextStorageKey = `${CONTEXT_STORAGE_PREFIX}:${userScopeKey}`;
  const draftStorageKey = `${DRAFT_STORAGE_PREFIX}:${userScopeKey}`;

  const persistDraftsToSession = useCallback(
    (nextDrafts: Record<string, Record<string, number | "">>) => {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.setItem(draftStorageKey, JSON.stringify(nextDrafts));
      } catch {}
    },
    [draftStorageKey]
  );

  const persistContext = useCallback(
    (next: SavedContextState) => {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.setItem(contextStorageKey, JSON.stringify(next));
      } catch {}

      try {
        const params = new URLSearchParams(window.location.search);
        if (next.examinationName.trim()) params.set("exam", next.examinationName);
        else params.delete("exam");

        if (next.classNameInput.trim()) params.set("class", next.classNameInput);
        else params.delete("class");

        if (next.subjectName.trim()) params.set("subject", next.subjectName);
        else params.delete("subject");

        const qs = params.toString();
        const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
        window.history.replaceState(null, "", nextUrl);
      } catch {}
    },
    [contextStorageKey]
  );

  const loadAllData = useCallback(async () => {
    const [examsRes, studentsRes, resultsRes] = await Promise.allSettled([
      api.get("/exams"),
      api.get("/students"),
      api.get("/exams/results"),
    ]);

    let examList: ExamOption[] = [];
    if (examsRes.status === "fulfilled" && examsRes.value?.exams) {
      examList = examsRes.value.exams.map((e: any) => ({
        id: e._id || e.id,
        name: e.title || e.name || "Untitled Exam",
        className: formatClassDisplay(e.className),
        subject:
          e.subjects && e.subjects[0]?.subjectName ? e.subjects[0].subjectName : "General",
        maxMarks: e.subjects && e.subjects[0]?.maxMarks ? e.subjects[0].maxMarks : 100,
      }));
      setExams(examList);
    }

    if (studentsRes.status === "fulfilled" && studentsRes.value?.students) {
      const sList: StudentBase[] = studentsRes.value.students.map((s: any) => ({
        id: String(s._id || s.id),
        rollNo: s.rollNumber || s.studentId || "N/A",
        name: s.name,
        className: formatClassDisplay(s.className),
      }));
      setStudents(sList);
    } else {
      setStudents([]);
    }

    let fetchedResults: RawExamResult[] = [];
    if (resultsRes.status === "fulfilled" && Array.isArray(resultsRes.value?.results)) {
      fetchedResults = resultsRes.value.results;
      setSavedResults(fetchedResults);
    } else {
      setSavedResults([]);
    }

    return { examList, fetchedResults };
  }, []);

  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        setError("");

        try {
          const userStr =
            localStorage.getItem("eduflow-user") ||
            localStorage.getItem("user");
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u.role) setUserRole(String(u.role).toUpperCase());
          } else {
            const storedRole =
              localStorage.getItem("eduflow-role") ||
              localStorage.getItem("eduflow-demo-role") ||
              localStorage.getItem("role");
            if (storedRole) setUserRole(String(storedRole).toUpperCase());
          }
        } catch {}

        if (typeof window !== "undefined") {
          const storedDrafts = readStoredJson<
            Record<string, Record<string, number | "">>
          >(sessionStorage, draftStorageKey, {});
          setDraftMarksByContext(storedDrafts);
        }

        const { examList, fetchedResults } = await loadAllData();

        // Restore active Examination / Class / Subject across page refresh
        let initialExam = "";
        let initialClass = "";
        let initialSubject = "";

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const storedCtx = readStoredJson<Partial<SavedContextState>>(
            sessionStorage,
            contextStorageKey,
            {}
          );

          const hasUrlParams =
            urlParams.has("exam") || urlParams.has("class") || urlParams.has("subject");

          if (hasUrlParams) {
            initialExam = urlParams.get("exam") ?? "";
            initialClass = urlParams.get("class") ?? "";
            initialSubject = urlParams.get("subject") ?? "";
          } else if (
            storedCtx.examinationName ||
            storedCtx.classNameInput ||
            storedCtx.subjectName
          ) {
            initialExam = storedCtx.examinationName || "";
            initialClass = storedCtx.classNameInput || "";
            initialSubject = storedCtx.subjectName || "";
          }
        }

        if (!initialExam && !initialClass && !initialSubject) {
          const firstExam = examList[0];
          const firstSaved = fetchedResults[0];
          const firstSavedExamObj =
            firstSaved && typeof firstSaved.exam === "object" ? firstSaved.exam : null;

          initialExam =
            firstExam?.name || firstSavedExamObj?.title || "";
          initialClass =
            firstExam?.className ||
            (firstSaved?.className ? formatClassDisplay(firstSaved.className) : "");
          initialSubject =
            firstSaved?.subjects?.[0]?.subjectName || firstExam?.subject || "";
        }

        setExaminationName(initialExam);
        setClassNameInput(initialClass);
        setSubjectName(initialSubject);
        setContextInitialized(true);
      } catch (err: any) {
        setError(err.message || "Failed to load examination or student records.");
      } finally {
        setLoading(false);
      }
    }

    void initData();
  }, [contextStorageKey, draftStorageKey, loadAllData]);

  useEffect(() => {
    if (!contextInitialized) return;
    persistContext({
      examinationName,
      classNameInput,
      subjectName,
    });
  }, [classNameInput, contextInitialized, examinationName, persistContext, subjectName]);

  const matchedExam = useMemo(() => {
    const targetName = normalizeText(examinationName);
    const targetClass = normalizeClassKey(classNameInput);
    if (!targetName) return undefined;

    if (targetClass) {
      return exams.find(
        (e) =>
          normalizeText(e.name) === targetName &&
          normalizeClassKey(e.className) === targetClass
      );
    }

    return exams.find((e) => normalizeText(e.name) === targetName);
  }, [classNameInput, examinationName, exams]);

  const uniqueExamNames = useMemo(
    () => Array.from(new Set(exams.map((e) => e.name).filter(Boolean))),
    [exams]
  );

  const uniqueClassNames = useMemo(() => {
    const combined = [
      ...exams.map((e) => e.className),
      ...students.map((s) => s.className),
    ].filter(Boolean);
    return Array.from(new Set(combined));
  }, [exams, students]);

  const currentContextKey = useMemo(
    () => buildContextKey(examinationName, classNameInput, subjectName),
    [classNameInput, examinationName, subjectName]
  );

  const currentDrafts = draftMarksByContext[currentContextKey] || {};
  const hasUnsavedChanges = Object.keys(currentDrafts).length > 0;

  const studentRows: StudentResultRow[] = useMemo(() => {
    const targetExamTitle = normalizeText(examinationName);
    const targetClassKey = normalizeClassKey(classNameInput);
    const targetSubject = normalizeText(subjectName);
    const defaultMax = matchedExam?.maxMarks || 100;

    // Sort students whose normalized class matches the typed Class first
    const orderedStudents = [...students].sort((a, b) => {
      if (!targetClassKey) return 0;
      const aMatch = normalizeClassKey(a.className) === targetClassKey ? 0 : 1;
      const bMatch = normalizeClassKey(b.className) === targetClassKey ? 0 : 1;
      return aMatch - bMatch;
    });

    return orderedStudents.map((student) => {
      // Find matching saved MongoDB record first
      const matchingResult = savedResults.find((r) => {
        const resStudentId =
          typeof r.student === "object" && r.student !== null
            ? String(r.student._id || "")
            : String(r.student || "");
        if (resStudentId !== student.id) return false;

        const resExamObj = typeof r.exam === "object" && r.exam !== null ? r.exam : null;
        const resExamId = resExamObj ? String(resExamObj._id || "") : String(r.exam || "");
        const resExamTitle = normalizeText(resExamObj?.title || "");

        const examMatches =
          (matchedExam && resExamId === matchedExam.id) ||
          (targetExamTitle !== "" && resExamTitle === targetExamTitle);
        if (!examMatches) return false;

        const resClassKey = normalizeClassKey(r.className || resExamObj?.className || "");
        if (targetClassKey && resClassKey && resClassKey !== targetClassKey) {
          return false;
        }

        return true;
      });

      let dbSubjectMatch: RawSubjectMark | undefined;
      if (matchingResult && Array.isArray(matchingResult.subjects)) {
        dbSubjectMatch = matchingResult.subjects.find(
          (sub) => normalizeText(sub.subjectName || "") === targetSubject
        );

        // Compatibility fallback for older single-subject results saved before subject support
        if (
          !dbSubjectMatch &&
          matchingResult.subjects.length === 1 &&
          (targetSubject === "" || targetSubject === "general")
        ) {
          const singleSub = matchingResult.subjects[0];
          const resExamObj =
            typeof matchingResult.exam === "object" && matchingResult.exam !== null
              ? matchingResult.exam
              : null;
          if (normalizeText(singleSub?.subjectName || "") === normalizeText(resExamObj?.title || "")) {
            dbSubjectMatch = singleSub;
          }
        }
      }

      const maxMarks = Number(dbSubjectMatch?.maxMarks || defaultMax || 100);
      const hasDraft = Object.prototype.hasOwnProperty.call(currentDrafts, student.id);

      if (hasDraft) {
        return {
          ...student,
          marks: currentDrafts[student.id],
          maxMarks,
          source: currentDrafts[student.id] === "" ? "empty" : "draft",
        };
      }

      if (dbSubjectMatch && typeof dbSubjectMatch.marksObtained === "number") {
        return {
          ...student,
          marks: dbSubjectMatch.marksObtained,
          maxMarks,
          source: "saved",
        };
      }

      return {
        ...student,
        marks: "",
        maxMarks,
        source: "empty",
      };
    });
  }, [
    classNameInput,
    currentDrafts,
    examinationName,
    matchedExam,
    savedResults,
    students,
    subjectName,
  ]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return studentRows.filter(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        student.rollNo.toLowerCase().includes(q) ||
        student.className.toLowerCase().includes(q)
    );
  }, [studentRows, search]);

  const enteredCount = studentRows.filter((student) => student.marks !== "").length;
  const pendingCount = studentRows.length - enteredCount;

  const averageMarks =
    enteredCount > 0
      ? (
          studentRows.reduce(
            (total, student) =>
              total + (student.marks === "" ? 0 : Number(student.marks)),
            0
          ) / enteredCount
        ).toFixed(1)
      : "0";

  const updateMarks = (id: string, value: string, maxMarks: number) => {
    setSaved(false);
    setSaveMessage("");

    let parsedValue: number | "" = "";
    if (value !== "") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      parsedValue = Math.min(maxMarks, Math.max(0, numeric));
    }

    setDraftMarksByContext((prev) => {
      const nextForCtx = {
        ...(prev[currentContextKey] || {}),
        [id]: parsedValue,
      };
      const nextAll = {
        ...prev,
        [currentContextKey]: nextForCtx,
      };
      persistDraftsToSession(nextAll);
      return nextAll;
    });
  };

  const handleExamNameChange = (value: string) => {
    setExaminationName(value);
    setSaved(false);
    setSaveMessage("");
  };

  const handleClassChange = (value: string) => {
    setClassNameInput(value);
    setSaved(false);
    setSaveMessage("");
  };

  const handleSubjectChange = (value: string) => {
    setSubjectName(value);
    setSaved(false);
    setSaveMessage("");
  };

  const handleSave = async () => {
    if (!canEnterMarks) {
      alert("Only teachers and administrators can enter marks.");
      return;
    }

    const cleanExamName = examinationName.trim();
    const cleanClass = classNameInput.trim();
    const cleanSubject = subjectName.trim() || "";

    if (!cleanExamName) {
      setError("Please enter an examination name before saving marks.");
      return;
    }

    const validEntries = studentRows
      .filter((s) => s.marks !== "")
      .map((s) => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNo,
        className: cleanClass || s.className,
        subjectName: cleanSubject,
        marksObtained: Number(s.marks),
        maxMarks: s.maxMarks,
        status: Number(s.marks) >= Math.round(s.maxMarks * 0.33) ? "Pass" : "Fail",
      }));

    if (validEntries.length === 0) {
      alert("Please enter marks for at least one student before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaveMessage("");

      await api.post("/exams/results", {
        examId: matchedExam?.id || undefined,
        examinationName: cleanExamName,
        className: cleanClass,
        subjectName: cleanSubject,
        results: validEntries,
      });

      // Clear temporary unsubmitted draft for this context once safely committed in MongoDB
      setDraftMarksByContext((prev) => {
        if (!prev[currentContextKey]) return prev;
        const next = { ...prev };
        delete next[currentContextKey];
        persistDraftsToSession(next);
        return next;
      });

      await loadAllData();
      setSaved(true);
      setSaveMessage(
        `Saved marks for ${validEntries.length} student${validEntries.length === 1 ? "" : "s"} under ${cleanExamName}${cleanSubject ? ` (${cleanSubject})` : ""}.`
      );
    } catch (err: any) {
      setError(err.message || "Failed to save examination marks.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-7">
      {/* Header */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center cursor-pointer gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Back
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Result Processing
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter and manage student examination marks.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {saveMessage}
        </div>
      )}

      {/* Exam Selection */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label
              htmlFor="exam-name-input"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Select Examination
            </label>
            <input
              id="exam-name-input"
              type="text"
              list="examination-suggestions"
              value={examinationName}
              onChange={(e) => handleExamNameChange(e.target.value)}
              placeholder="Type examination (e.g. )"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
            />
            <datalist id="examination-suggestions">
              {uniqueExamNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <label
              htmlFor="exam-class-input"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Class
            </label>
            <input
              id="exam-class-input"
              type="text"
              list="class-suggestions"
              value={classNameInput}
              onChange={(e) => handleClassChange(e.target.value)}
              placeholder="Type class (e.g. )"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
            />
            <datalist id="class-suggestions">
              {uniqueClassNames.map((cls) => (
                <option key={cls} value={cls} />
              ))}
            </datalist>
          </div>

          <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
            <label
              htmlFor="exam-subject-input"
              className="block text-xs font-medium text-gray-500"
            >
              Subject
            </label>
            <input
              id="exam-subject-input"
              type="text"
              value={subjectName}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="Type subject (e.g. )"
              className="mt-1 w-full rounded-lg border border-yellow-200 bg-white/80 px-3 py-1.5 text-sm font-bold text-gray-900 outline-none focus:border-yellow-400 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Students", value: studentRows.length, icon: Users },
          { title: "Marks Entered", value: enteredCount, icon: CheckCircle },
          { title: "Pending Entries", value: pendingCount, icon: AlertCircle },
          { title: "Average Marks", value: averageMarks, icon: ClipboardList },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{item.title}</p>
                <div className="rounded-xl bg-yellow-100 p-3">
                  <Icon size={20} />
                </div>
              </div>
              <h2 className="mt-3 text-3xl font-extrabold text-gray-900">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Student Marks Table */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Student Marks Entry
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {examinationName || "Examination"}
              {classNameInput ? ` · ${classNameInput}` : ""}
              {subjectName ? ` · ${subjectName}` : ""}
            </p>
          </div>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-4">Roll No.</th>
                <th className="px-4 py-4">Student Name</th>
                <th className="px-4 py-4">Class</th>
                <th className="px-4 py-4">Maximum Marks</th>
                <th className="px-4 py-4">Obtained Marks</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-yellow-500" />
                    Loading students for marks entry...
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-50 text-sm last:border-0"
                  >
                    <td className="px-4 py-4 font-semibold text-gray-700">
                      {student.rollNo}
                    </td>

                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {student.name}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {student.className}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {student.maxMarks}
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        max={student.maxMarks}
                        disabled={!canEnterMarks}
                        value={student.marks}
                        onChange={(e) =>
                          updateMarks(student.id, e.target.value, student.maxMarks)
                        }
                        placeholder="Enter marks"
                        className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 disabled:bg-gray-100"
                      />
                    </td>

                    <td className="px-4 py-4">
                      {student.marks === "" ? (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          Pending
                        </span>
                      ) : student.source === "draft" ? (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                          Unsaved
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Saved
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && filteredStudents.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">
              No students found in database.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-500">
            {enteredCount} of {studentRows.length} students have marks entered
            {hasUnsavedChanges ? " (unsaved edits preserved — click Save Marks to store in database)." : "."}
          </p>

          {canEnterMarks && (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || enteredCount === 0 || (saved && !hasUnsavedChanges)}
              className="flex items-center justify-center gap-2 rounded-xl bg-yellow-300 px-6 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving
                ? "Saving..."
                : saved && !hasUnsavedChanges
                ? "Marks Saved"
                : "Save Marks"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
