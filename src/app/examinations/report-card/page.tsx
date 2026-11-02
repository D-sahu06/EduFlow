"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Printer,
  GraduationCap,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";

type Subject = {
  name: string;
  maxMarks: number;
  obtainedMarks: number;
};

type Student = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  exam: string;
  subjects: Subject[];
};

const students: Student[] = [
  {
    id: "1",
    name: "Aarav Sharma",
    rollNo: "STU001",
    className: "Class 10",
    section: "A",
    exam: "Half Yearly Examination",
    subjects: [
      { name: "English", maxMarks: 100, obtainedMarks: 85 },
      { name: "Mathematics", maxMarks: 100, obtainedMarks: 92 },
      { name: "Science", maxMarks: 100, obtainedMarks: 78 },
      { name: "Social Science", maxMarks: 100, obtainedMarks: 88 },
      { name: "Hindi", maxMarks: 100, obtainedMarks: 81 },
    ],
  },
  {
    id: "2",
    name: "Priya Verma",
    rollNo: "STU002",
    className: "Class 10",
    section: "A",
    exam: "Half Yearly Examination",
    subjects: [
      { name: "English", maxMarks: 100, obtainedMarks: 90 },
      { name: "Mathematics", maxMarks: 100, obtainedMarks: 95 },
      { name: "Science", maxMarks: 100, obtainedMarks: 91 },
      { name: "Social Science", maxMarks: 100, obtainedMarks: 87 },
      { name: "Hindi", maxMarks: 100, obtainedMarks: 89 },
    ],
  },
  {
    id: "3",
    name: "Rahul Patel",
    rollNo: "STU003",
    className: "Class 10",
    section: "B",
    exam: "Half Yearly Examination",
    subjects: [
      { name: "English", maxMarks: 100, obtainedMarks: 42 },
      { name: "Mathematics", maxMarks: 100, obtainedMarks: 35 },
      { name: "Science", maxMarks: 100, obtainedMarks: 48 },
      { name: "Social Science", maxMarks: 100, obtainedMarks: 55 },
      { name: "Hindi", maxMarks: 100, obtainedMarks: 61 },
    ],
  },
];

export default function ReportCardPage() {
  const [selectedStudentId, setSelectedStudentId] = useState("1");
  const [search, setSearch] = useState("");
  const router = useRouter()

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.rollNo.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const totalMarks =
    selectedStudent?.subjects.reduce(
      (sum, subject) => sum + subject.maxMarks,
      0
    ) ?? 0;

  const obtainedMarks =
    selectedStudent?.subjects.reduce(
      (sum, subject) => sum + subject.obtainedMarks,
      0
    ) ?? 0;

  const percentage =
    totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  const isPassed =
    selectedStudent?.subjects.every(
      (subject) => subject.obtainedMarks >= 35
    ) ?? false;

  const grade =
    percentage >= 90
      ? "A+"
      : percentage >= 80
      ? "A"
      : percentage >= 70
      ? "B"
      : percentage >= 60
      ? "C"
      : percentage >= 50
      ? "D"
      : "F";

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
            Report Card
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and print student examination report cards.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          disabled={!selectedStudent}
          className="flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Printer size={18} />
          Print Report Card
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search Student
          </label>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or roll number"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.rollNo})
              </option>
            ))}
          </select>
          {filteredStudents.length === 0 && (
            <p className="mt-1 text-xs text-red-500">
              No students found.
            </p>
          )}
        </div>
      </div>

      {/* Report Card */}
      {selectedStudent ? (
        <div
          id="report-card"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-8"
        >
          {/* Institution Header */}
          <div className="border-b-2 border-slate-800 pb-5 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
              <GraduationCap size={30} className="text-slate-800" />
            </div>

            <h2 className="text-2xl font-extrabold uppercase tracking-wide text-slate-900">
              EduFlow Institution
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Student Academic Performance Report
            </p>
            <h3 className="mt-3 text-lg font-bold text-slate-800">
              {selectedStudent.exam}
            </h3>
          </div>

          {/* Student Details */}
          <div className="my-6 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Student Name</p>
              <p className="font-bold text-slate-800">
                {selectedStudent.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Roll Number</p>
              <p className="font-bold text-slate-800">
                {selectedStudent.rollNo}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Class</p>
              <p className="font-bold text-slate-800">
                {selectedStudent.className}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Section</p>
              <p className="font-bold text-slate-800">
                {selectedStudent.section}
              </p>
            </div>
          </div>

          {/* Subject Marks Table */}
          <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
            <FileText size={18} />
            Subject-wise Performance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full min-w-125 border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Maximum Marks</th>
                  <th className="p-3 text-center">Obtained Marks</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedStudent.subjects.map((subject) => (
                  <tr
                    key={subject.name}
                    className="border-b border-slate-200"
                  >
                    <td className="p-3 font-medium text-slate-700">
                      {subject.name}
                    </td>
                    <td className="p-3 text-center">
                      {subject.maxMarks}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {subject.obtainedMarks}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={
                          subject.obtainedMarks >= 35
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {subject.obtainedMarks >= 35 ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-yellow-50 font-bold text-slate-900">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-center">{totalMarks}</td>
                  <td className="p-3 text-center">{obtainedMarks}</td>
                  <td className="p-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Result Summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Percentage</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {percentage.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Grade</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {grade}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Final Result</p>
              <p
                className={`mt-1 flex items-center gap-2 text-xl font-extrabold ${
                  isPassed ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPassed ? (
                  <CheckCircle size={21} />
                ) : (
                  <XCircle size={21} />
                )}
                {isPassed ? "PASS" : "FAIL"}
              </p>
            </div>
          </div>

          {/* Remarks and Signatures */}
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-800">
              Remarks
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {isPassed
                ? "Congratulations! Keep up the good work."
                : "Needs improvement. Please work harder in the next examination."}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm font-semibold text-slate-700">
            <div>
              <div className="mx-auto mb-2 w-40 border-t border-slate-400" />
              Class Teacher
            </div>
            <div>
              <div className="mx-auto mb-2 w-40 border-t border-slate-400" />
              Principal
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Select a student to view the report card.
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #report-card,
          #report-card * {
            visibility: visible;
          }

          #report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            padding: 20px;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
