"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Search,
  GraduationCap,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type SubjectMark = {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
};

type StudentResult = {
  id: string | number;
  name: string;
  rollNo: string;
  className: string;
  percentage: number;
  grade: string;
  status: "Pass" | "Fail";
  subjects: SubjectMark[];
};

export default function ResultDashboardPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [examsList, setExamsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exam, setExam] = useState("All Examinations");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await api.get("/exams");
        if (res && res.exams) {
          setExamsList(res.exams);
        }
      } catch (err) {
        console.error("Failed to load exams list:", err);
      }
    }
    loadExams();
  }, []);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        setError("");
        const query = exam !== "All Examinations" ? `?examId=${exam}` : "";
        const res = await api.get(`/exams/results${query}`);
        if (res && res.results) {
          const mapped: StudentResult[] = res.results.map((r: any) => {
            const rawSubjects: SubjectMark[] =
              Array.isArray(r.subjects) && r.subjects.length > 0
                ? r.subjects.map((sub: any) => ({
                    subjectName: String(sub.subjectName || sub.name || "").trim(),
                    marksObtained: Number(sub.marksObtained ?? sub.marks ?? 0),
                    maxMarks: Number(sub.maxMarks || 100),
                    grade: sub.grade || "",
                  }))
                : r.subject || (r.exam && typeof r.exam === "object" && r.exam.subject)
                ? [
                    {
                      subjectName: String(r.subject || r.exam.subject).trim(),
                      marksObtained: Number(r.totalMarks || r.marksObtained || 0),
                      maxMarks: Number(
                        r.maxMarks ||
                          (r.percentage
                            ? Math.round((Number(r.totalMarks || 0) * 100) / Number(r.percentage))
                            : 100)
                      ),
                      grade: r.overallGrade || r.grade || "",
                    },
                  ]
                : [];

            return {
              id: r._id || r.id,
              name: r.student?.name || r.studentName || "Student",
              rollNo:
                r.student?.rollNumber || r.student?.studentId || r.rollNumber || "N/A",
              className: r.className
                ? r.className.startsWith("Class")
                  ? r.className
                  : `Class ${r.className}`
                : "Class 10",
              percentage: Math.round(Number(r.percentage) || 0),
              grade:
                r.overallGrade ||
                r.grade ||
                (r.percentage >= 90
                  ? "A+"
                  : r.percentage >= 75
                  ? "A"
                  : r.percentage >= 60
                  ? "B"
                  : r.percentage >= 40
                  ? "C"
                  : "F"),
              status: r.status === "Pass" ? "Pass" : "Fail",
              subjects: rawSubjects,
            };
          });
          setResults(mapped);
        } else {
          setResults([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load examination results.");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [exam]);

  const filteredResults = useMemo(() => {
    return results.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [results, search]);

  const totalStudents = filteredResults.length;
  const passed = filteredResults.filter((s) => s.status === "Pass").length;
  const failed = filteredResults.filter((s) => s.status === "Fail").length;

  const passPercentage =
    totalStudents > 0 ? Math.round((passed / totalStudents) * 100) : 0;

  const average =
    totalStudents > 0
      ? (
          filteredResults.reduce((sum, s) => sum + s.percentage, 0) /
          totalStudents
        ).toFixed(1)
      : "0";

  const classPerformance = useMemo(() => {
    const classes = [...new Set(filteredResults.map((s) => s.className))];

    return classes.map((className) => {
      const students = filteredResults.filter(
        (s) => s.className === className
      );

      const passCount = students.filter((s) => s.status === "Pass").length;

      return {
        name: className,
        total: students.length,
        passed: passCount,
        percentage:
          students.length > 0
            ? Math.round((passCount / students.length) * 100)
            : 0,
      };
    });
  }, [filteredResults]);

  const toppers = [...filteredResults]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const subjectPerformance = useMemo(() => {
    const subjectMap = new Map<
      string,
      {
        name: string;
        totalObtained: number;
        totalMax: number;
        studentsCount: number;
      }
    >();

    for (const student of filteredResults) {
      if (Array.isArray(student.subjects) && student.subjects.length > 0) {
        for (const sub of student.subjects) {
          const rawName = String(sub.subjectName || "").trim();
          if (!rawName) continue;
          const key = rawName.toLowerCase();
          const existing = subjectMap.get(key) || {
            name: rawName,
            totalObtained: 0,
            totalMax: 0,
            studentsCount: 0,
          };
          existing.totalObtained += Number(sub.marksObtained || 0);
          existing.totalMax += Number(sub.maxMarks || 100);
          existing.studentsCount += 1;
          subjectMap.set(key, existing);
        }
      }
    }

    return Array.from(subjectMap.values())
      .map((item) => ({
        name: item.name,
        percentage:
          item.totalMax > 0
            ? Math.round((item.totalObtained / item.totalMax) * 100)
            : 0,
        studentsCount: item.studentsCount,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [filteredResults]);

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
            Result Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live student examination results and performance analytics.
          </p>
        </div>

        <select
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-yellow-400"
        >
          <option value="All Examinations">All Examinations</option>
          {examsList.map((e: any) => (
            <option key={e._id || e.id} value={e._id || e.id}>
              {e.title || e.name || "Exam"} ({e.className || "All"})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Students Evaluated",
            value: totalStudents,
            icon: Users,
            color: "bg-blue-100 text-blue-700",
          },
          {
            title: "Overall Pass Percentage",
            value: `${passPercentage}%`,
            icon: Trophy,
            color: "bg-yellow-100 text-yellow-800",
          },
          {
            title: "Students Passed",
            value: passed,
            icon: TrendingUp,
            color: "bg-green-100 text-green-700",
          },
          {
            title: "Students Failed",
            value: failed,
            icon: TrendingDown,
            color: "bg-red-100 text-red-700",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{item.title}</p>
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={21} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-gray-900">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Performance Section */}
      <div className="mb-7 grid grid-cols-1 gap-7 lg:grid-cols-2">
        {/* Pass / Fail Analysis */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Pass / Fail Analysis
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Overall performance ratio
          </p>

          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="flex h-44 w-44 items-center justify-center rounded-full border-12 border-green-500 bg-green-50">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-green-700">
                  {passPercentage}%
                </p>
                <p className="text-xs font-semibold text-gray-500">
                  Pass Rate
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-7 text-center">
              <div>
                <p className="text-sm text-gray-500">Passed</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{passed}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="ml-5 mt-1 text-2xl font-bold text-gray-900">{failed}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Average Percentage</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{average}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Class Performance */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Class-wise Performance
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Pass percentage by class
          </p>

          <div className="mt-7 space-y-6">
            {classPerformance.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-gray-800">{item.name}</span>
                  <span className="font-bold text-gray-900">{item.percentage}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {item.passed} passed out of {item.total} students
                </p>
              </div>
            ))}

            {classPerformance.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">
                No class records available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="mb-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Subject-wise Performance
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Average marks percentage by subject
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-yellow-500" />
            Loading subject performance...
          </div>
        ) : subjectPerformance.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No subject evaluation records found in database.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {subjectPerformance.map((subject) => (
              <div key={subject.name} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700 truncate pr-2">{subject.name}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {subject.studentsCount} {subject.studentsCount === 1 ? "student" : "students"}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-gray-900">
                  {subject.percentage}%
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, subject.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topper List */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Top Performing Students
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Highest scoring students from database
            </p>
          </div>

          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">Roll Number</th>
                <th className="px-4 py-4">Class</th>
                <th className="px-4 py-4">Percentage</th>
                <th className="px-4 py-4">Grade</th>
                <th className="px-4 py-4">Result</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-yellow-500" />
                    Loading result analytics...
                  </td>
                </tr>
              ) : toppers.map((student, index) => (
                <tr key={student.id} className="border-b border-gray-50 text-sm last:border-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100">
                        {index === 0 ? <Trophy size={17} /> : <GraduationCap size={17} />}
                      </div>
                      <span className="font-semibold text-gray-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{student.rollNo}</td>
                  <td className="px-4 py-4 text-gray-600">{student.className}</td>
                  <td className="px-4 py-4 font-bold text-gray-900">{student.percentage}%</td>
                  <td className="px-4 py-4 font-semibold text-gray-700">{student.grade}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      student.status === "Pass"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && toppers.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              No result records found in database.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
