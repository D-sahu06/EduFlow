
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Save,
  ClipboardList,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

type StudentResult = {
  id: number;
  rollNo: string;
  name: string;
  className: string;
  marks: number | "";
  maxMarks: number;
};

const initialStudents: StudentResult[] = [
  { id: 1, rollNo: "STU001", name: "Aarav Sharma", className: "Class 10", marks: 85, maxMarks: 100 },
  { id: 2, rollNo: "STU002", name: "Priya Verma", className: "Class 10", marks: 92, maxMarks: 100 },
  { id: 3, rollNo: "STU003", name: "Rahul Patel", className: "Class 10", marks: 76, maxMarks: 100 },
  { id: 4, rollNo: "STU004", name: "Ananya Gupta", className: "Class 10", marks: "", maxMarks: 100 },
  { id: 5, rollNo: "STU005", name: "Rohan Singh", className: "Class 10", marks: 64, maxMarks: 100 },
  { id: 6, rollNo: "STU006", name: "Sneha Jain", className: "Class 10", marks: "", maxMarks: 100 },
];

export default function ResultProcessingPage() {
  const [students, setStudents] = useState(initialStudents);
  const [exam, setExam] = useState("Mid Term Examination");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter()

  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search]);

  const enteredCount = students.filter(
    (student) => student.marks !== ""
  ).length;

  const pendingCount = students.length - enteredCount;

  const averageMarks =
    enteredCount > 0
      ? (
          students.reduce(
            (total, student) =>
              total + (student.marks === "" ? 0 : student.marks),
            0
          ) / enteredCount
        ).toFixed(1)
      : "0";

  const updateMarks = (id: number, value: string) => {
    setSaved(false);

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== id) return student;

        if (value === "") {
          return { ...student, marks: "" };
        }

        const marks = Number(value);

        if (!Number.isFinite(marks)) return student;

        return {
          ...student,
          marks: Math.min(student.maxMarks, Math.max(0, marks)),
        };
      })
    );
  };

  const handleSave = () => {
    if (pendingCount > 0) {
      alert("Please enter marks for all students before saving.");
      return;
    }

    setSaved(true);
    alert("Student marks saved successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-7">

      {/* Header */}
      <div className="mb-7">
         <button
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

      {/* Exam Selection */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Select Examination
            </label>
            <select
              value={exam}
              onChange={(e) => {
                setExam(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
            >
              <option>Mid Term Examination</option>
              <option>Final Examination</option>
              <option>Unit Test 1</option>
              <option>Unit Test 2</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Class
            </label>
            <select
              defaultValue="Class 10"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
            >
              <option>Class 10</option>
              <option>Class 9</option>
              <option>Class 12</option>
            </select>
          </div>

          <div className="rounded-xl bg-yellow-50 p-3">
            <p className="text-xs font-medium text-gray-500">Subject</p>
            <p className="mt-1 font-bold text-gray-900">Mathematics</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Students", value: students.length, icon: Users },
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
            <p className="mt-1 text-xs text-gray-500">{exam}</p>
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
              {filteredStudents.map((student) => (
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
                      value={student.marks}
                      onChange={(e) => updateMarks(student.id, e.target.value)}
                      placeholder="Enter marks"
                      className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                    />
                  </td>

                  <td className="px-4 py-4">
                    {student.marks === "" ? (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Entered
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">
              No students found.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-500">
            {enteredCount} of {students.length} students have marks entered.
          </p>

          <button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-300 px-6 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saved ? "Marks Saved" : "Save Marks"}
          </button>
        </div>
      </div>
    </div>
  );
}
