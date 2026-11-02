
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Search,
//   Award,
  GraduationCap,
  ArrowLeft
} from "lucide-react";

const initialResults = [
  { id: 1, name: "Aarav Sharma", rollNo: "STU001", className: "Class 10", percentage: 95, grade: "A+", status: "Pass" },
  { id: 2, name: "Priya Verma", rollNo: "STU002", className: "Class 10", percentage: 92, grade: "A+", status: "Pass" },
  { id: 3, name: "Rahul Patel", rollNo: "STU003", className: "Class 10", percentage: 78, grade: "B+", status: "Pass" },
  { id: 4, name: "Ananya Gupta", rollNo: "STU004", className: "Class 10", percentage: 45, grade: "C", status: "Pass" },
  { id: 5, name: "Rohan Singh", rollNo: "STU005", className: "Class 10", percentage: 32, grade: "F", status: "Fail" },
  { id: 6, name: "Sneha Jain", rollNo: "STU006", className: "Class 10", percentage: 88, grade: "A", status: "Pass" },
  { id: 7, name: "Karan Mehta", rollNo: "STU007", className: "Class 12", percentage: 91, grade: "A+", status: "Pass" },
  { id: 8, name: "Ishita Rao", rollNo: "STU008", className: "Class 12", percentage: 85, grade: "A", status: "Pass" },
  { id: 9, name: "Vivek Joshi", rollNo: "STU009", className: "Class 12", percentage: 28, grade: "F", status: "Fail" },
  { id: 10, name: "Meera Shah", rollNo: "STU010", className: "Class 12", percentage: 76, grade: "B+", status: "Pass" },
];

const subjectPerformance = [
  { name: "Mathematics", percentage: 82 },
  { name: "Science", percentage: 88 },
  { name: "English", percentage: 91 },
  { name: "Social Science", percentage: 76 },
  { name: "Computer", percentage: 94 },
];

export default function ResultDashboardPage() {
  const [exam, setExam] = useState("All Examinations");
  const [search, setSearch] = useState("");
  const router = useRouter()

  const filteredResults = useMemo(() => {
    return initialResults.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [search]);

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
            Analyze examination results and student academic performance.
          </p>
        </div>

        <select
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-yellow-400"
        >
          <option>All Examinations</option>
          <option>Mid Term Examination</option>
          <option>Final Examination</option>
          <option>Unit Test 1</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[
          { title: "Total Students", value: totalStudents, icon: Users, color: "bg-yellow-100" },
          { title: "Students Passed", value: passed, icon: TrendingUp, color: "bg-green-100" },
          { title: "Students Failed", value: failed, icon: TrendingDown, color: "bg-red-100" },
          { title: "Pass Percentage", value: `${passPercentage}%`, icon: Trophy, color: "bg-blue-100" },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{item.title}</p>
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={21} />
                </div>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                {item.value}
              </h2>
              <p className="mt-2 text-xs text-gray-500">
                Current result overview
              </p>
            </div>
          );
        })}

      </div>

      {/* Performance Overview */}
      <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Pass Fail Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Pass / Fail Overview
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Student result distribution
          </p>

          <div className="mt-7 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">

            <div
              className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#16a34a 0% ${passPercentage}%, #ef4444 ${passPercentage}% 100%)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-extrabold text-gray-900">
                  {passPercentage}%
                </span>
                <span className="text-xs text-gray-500">Pass Rate</span>
              </div>
            </div>

            <div className="w-full space-y-5 sm:w-auto">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-600" />
                  <span className="text-sm text-gray-600">Passed</span>
                </div>
                <p className="ml-5 mt-1 text-2xl font-bold text-gray-900">{passed}</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Failed</span>
                </div>
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

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {subjectPerformance.map((subject) => (
            <div key={subject.name} className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">{subject.name}</p>
              <p className="mt-3 text-2xl font-extrabold text-gray-900">
                {subject.percentage}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${subject.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topper List */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Top Performing Students
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Highest scoring students
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
              {toppers.map((student, index) => (
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

          {toppers.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              No students found.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
