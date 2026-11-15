"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Search,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type ReportStudent = {
  id: string | number;
  name: string;
  rollNo: string;
  className: string;
  exam: string;
  obtainedMarks: number;
  totalMarks: number;
};

const PASS_MARKS = 35;

export default function ExamReportsPage() {
  const [reportData, setReportData] = useState<ReportStudent[]>([]);
  const [examsList, setExamsList] = useState<string[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState("All Exams");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [resultFilter, setResultFilter] = useState("All");
  const router = useRouter();

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [resultsRes, examsRes] = await Promise.allSettled([
          api.get("/exams/results"),
          api.get("/exams"),
        ]);

        let mapped: ReportStudent[] = [];
        if (resultsRes.status === "fulfilled" && resultsRes.value?.results) {
          mapped = resultsRes.value.results.map((r: any) => {
            const total = r.subjects && r.subjects.length > 0
              ? r.subjects.reduce((sum: number, s: any) => sum + (s.maxMarks || 100), 0)
              : 100;
            const obtained = r.totalMarks ?? (r.subjects && r.subjects.length > 0
              ? r.subjects.reduce((sum: number, s: any) => sum + (s.marksObtained || 0), 0)
              : 0);

            return {
              id: r._id || r.id,
              name: r.student?.name || r.studentName || "Student",
              rollNo: r.student?.rollNumber || r.rollNumber || "N/A",
              className: r.className ? (r.className.startsWith("Class") ? r.className : `Class ${r.className}`) : "Class 10",
              exam: r.exam?.title || r.exam?.name || "Examination",
              obtainedMarks: obtained,
              totalMarks: total,
            };
          });
          setReportData(mapped);

          // Unique classes
          const classes = Array.from(new Set(mapped.map((m) => m.className))).filter(Boolean);
          setClassList(classes);
        }

        if (examsRes.status === "fulfilled" && examsRes.value?.exams) {
          const exams = examsRes.value.exams.map((e: any) => e.title || e.name).filter(Boolean);
          setExamsList(Array.from(new Set(exams)));
        }
      } catch (err) {
        console.error("Failed to load exam reports:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const filteredData = useMemo(() => {
    return reportData.filter((student) => {
      const percentage =
        student.totalMarks > 0 ? (student.obtainedMarks / student.totalMarks) * 100 : 0;

      const passed = percentage >= PASS_MARKS;

      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase());

      const matchesExam =
        selectedExam === "All Exams" || student.exam === selectedExam;

      const matchesClass =
        selectedClass === "All Classes" ||
        student.className === selectedClass;

      const matchesResult =
        resultFilter === "All" ||
        (resultFilter === "Pass" && passed) ||
        (resultFilter === "Fail" && !passed);

      return (
        matchesSearch &&
        matchesExam &&
        matchesClass &&
        matchesResult
      );
    });
  }, [reportData, search, selectedExam, selectedClass, resultFilter]);

  const totalStudents = filteredData.length;

  const passedStudents = filteredData.filter(
    (student) =>
      student.totalMarks > 0 &&
      (student.obtainedMarks / student.totalMarks) * 100 >= PASS_MARKS
  ).length;

  const failedStudents = totalStudents - passedStudents;

  const passPercentage =
    totalStudents > 0
      ? (passedStudents / totalStudents) * 100
      : 0;

  const averagePercentage =
    totalStudents > 0
      ? filteredData.reduce(
          (sum, student) =>
            sum + (student.totalMarks > 0 ? (student.obtainedMarks / student.totalMarks) * 100 : 0),
          0
        ) / totalStudents
      : 0;

  const downloadCSV = () => {
    const headers = [
      "Student Name",
      "Roll Number",
      "Class",
      "Exam",
      "Obtained Marks",
      "Total Marks",
      "Percentage",
      "Result",
    ];

    const rows = filteredData.map((student) => {
      const percentage =
        student.totalMarks > 0 ? (student.obtainedMarks / student.totalMarks) * 100 : 0;

      return [
        student.name,
        student.rollNo,
        student.className,
        student.exam,
        student.obtainedMarks,
        student.totalMarks,
        percentage.toFixed(2) + "%",
        percentage >= PASS_MARKS ? "Pass" : "Fail",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "exam-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center cursor-pointer gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            Exam Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze examination results and student performance.
          </p>
        </div>

        <button
          onClick={downloadCSV}
          disabled={filteredData.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search Student
          </label>
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or roll number"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Examination
          </label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option>All Exams</option>
            {examsList.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option>All Classes</option>
            {classList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Result Status
          </label>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option>All</option>
            <option>Pass</option>
            <option>Fail</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Students"
          value={loading ? "..." : totalStudents}
          icon={<Users size={21} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Students Passed"
          value={loading ? "..." : passedStudents}
          icon={<CheckCircle size={21} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Students Failed"
          value={loading ? "..." : failedStudents}
          icon={<XCircle size={21} />}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="Pass Percentage"
          value={loading ? "..." : `${passPercentage.toFixed(1)}%`}
          icon={<TrendingUp size={21} />}
          color="bg-yellow-50 text-yellow-700"
        />
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">
            Overall Performance
          </h2>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Average Percentage
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {averagePercentage.toFixed(1)}%
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <TrendingUp size={28} className="text-yellow-700" />
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, averagePercentage))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Average marks percentage of filtered students
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">
            Pass / Fail Distribution
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-600">Passed</span>
                <span className="font-bold text-green-600">
                  {passedStudents} students
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{
                    width: `${
                      totalStudents
                        ? (passedStudents / totalStudents) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-600">Failed</span>
                <span className="font-bold text-red-600">
                  {failedStudents} students
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{
                    width: `${
                      totalStudents
                        ? (failedStudents / totalStudents) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-800">
              <FileText size={19} />
              Student Performance Report
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredData.length} records found
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-187.5 text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Roll Number</th>
                <th className="p-4">Class</th>
                <th className="p-4">Exam</th>
                <th className="p-4">Marks</th>
                <th className="p-4">Percentage</th>
                <th className="p-4">Result</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <Loader2 className="mr-2 inline animate-spin text-yellow-500" size={18} />
                    Loading exam reports...
                  </td>
                </tr>
              ) : filteredData.map((student) => {
                const percentage =
                  student.totalMarks > 0
                    ? (student.obtainedMarks / student.totalMarks) * 100
                    : 0;

                const passed = percentage >= PASS_MARKS;

                return (
                  <tr
                    key={student.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4 font-semibold text-slate-800">
                      {student.name}
                    </td>
                    <td className="p-4 text-slate-600">
                      {student.rollNo}
                    </td>
                    <td className="p-4 text-slate-600">
                      {student.className}
                    </td>
                    <td className="p-4 text-slate-600">
                      {student.exam}
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {student.obtainedMarks}/{student.totalMarks}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {percentage.toFixed(1)}%
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-slate-500"
                  >
                    No examination records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      </div>
      <p className="mt-4 text-2xl font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}