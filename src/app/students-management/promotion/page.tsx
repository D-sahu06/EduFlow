
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  RotateCcw,
  ArrowLeft
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  currentClass: string;
  section: string;
  rollNo: string;
  percentage: number;
  selected: boolean;
};

const initialStudents: Student[] = [
  {
    id: "STU001",
    name: "Aarav Sharma",
    currentClass: "Class 5",
    section: "A",
    rollNo: "101",
    percentage: 85,
    selected: false,
  },
  {
    id: "STU002",
    name: "Ananya Verma",
    currentClass: "Class 5",
    section: "A",
    rollNo: "102",
    percentage: 72,
    selected: false,
  },
  {
    id: "STU003",
    name: "Rohan Patel",
    currentClass: "Class 5",
    section: "B",
    rollNo: "103",
    percentage: 91,
    selected: false,
  },
  {
    id: "STU004",
    name: "Priya Singh",
    currentClass: "Class 5",
    section: "B",
    rollNo: "104",
    percentage: 32,
    selected: false,
  },
  {
    id: "STU005",
    name: "Kabir Khan",
    currentClass: "Class 5",
    section: "A",
    rollNo: "105",
    percentage: 68,
    selected: false,
  },
];

const classOptions = Array.from(
  { length: 12 },
  (_, index) => `Class ${index + 1}`
);

export default function StudentPromotionPage() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [fromClass, setFromClass] = useState("Class 5");
  const [toClass, setToClass] = useState("Class 6");
  const [academicYear, setAcademicYear] = useState("2027-28");
  const [promotionHistory, setPromotionHistory] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const router = useRouter()

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesClass = student.currentClass === fromClass;
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.id.toLowerCase().includes(search.toLowerCase());

      return matchesClass && matchesSearch;
    });
  }, [students, fromClass, search]);

  const selectedStudents = filteredStudents.filter(
    (student) => student.selected
  );

  const eligibleStudents = selectedStudents.filter(
    (student) => student.percentage >= 35
  );

  const toggleStudent = (id: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id
          ? { ...student, selected: !student.selected }
          : student
      )
    );
    setMessage("");
  };

  const toggleAll = () => {
    const allSelected =
      filteredStudents.length > 0 &&
      filteredStudents.every((student) => student.selected);

    const visibleIds = new Set(filteredStudents.map((student) => student.id));

    setStudents((prev) =>
      prev.map((student) =>
        visibleIds.has(student.id)
          ? { ...student, selected: !allSelected }
          : student
      )
    );
    setMessage("");
  };

  const handlePromotion = () => {
    if (selectedStudents.length === 0) {
      setMessage("Please select at least one student.");
      return;
    }

    if (fromClass === "Class 12" || toClass === fromClass) {
      setMessage("Please select a valid next class.");
      return;
    }

    if (classOptions.indexOf(toClass) !== classOptions.indexOf(fromClass) + 1) {
      setMessage("Students can only be promoted to the immediate next class.");
      return;
    }

    if (eligibleStudents.length === 0) {
      setMessage("No selected students are eligible for promotion.");
      return;
    }

    const confirmed = window.confirm(
      `Promote ${eligibleStudents.length} eligible student(s) from ${fromClass} to ${toClass} for academic year ${academicYear}?`
    );

    if (!confirmed) return;

    const promotedIds = new Set(
      eligibleStudents.map((student) => student.id)
    );

    setStudents((prev) =>
      prev.map((student) =>
        promotedIds.has(student.id)
          ? {
              ...student,
              currentClass: toClass,
              selected: false,
            }
          : {
              ...student,
              selected: false,
            }
      )
    );

    setPromotionHistory((prev) => [
      `${eligibleStudents.length} student(s): ${fromClass} → ${toClass} (${academicYear})`,
      ...prev,
    ]);

    setMessage(
      `${eligibleStudents.length} student(s) successfully promoted.`
    );
  };

  const resetSelection = () => {
    setStudents((prev) =>
      prev.map((student) => ({ ...student, selected: false }))
    );
    setMessage("");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
         <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center gap-2 cursor rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>
        <h1 className="text-2xl font-bold text-slate-900">
          Student Promotion
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Promote eligible students to the next academic class.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Students in Selected Class</p>
            <Users className="text-yellow-500" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {filteredStudents.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Selected Students</p>
            <CheckCircle2 className="text-blue-500" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {selectedStudents.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Eligible for Promotion</p>
            <TrendingUp className="text-green-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {eligibleStudents.length}
          </h2>
        </div>
      </div>

      {/* Promotion Settings */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Promotion Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select the source class, destination class and academic year.
        </p>

        <div className="mt-5 grid grid-cols-1 items-end gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Promote From
            </label>
            <select
              value={fromClass}
              onChange={(e) => {
                const nextFrom = e.target.value;
                const index = classOptions.indexOf(nextFrom);
                setFromClass(nextFrom);
                setToClass(classOptions[index + 1] || nextFrom);
                setMessage("");
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center pb-2">
            <ArrowRight className="text-yellow-500" size={24} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Promote To
            </label>
            <select
              value={toClass}
              onChange={(e) => {
                setToClass(e.target.value);
                setMessage("");
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Academic Year
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
            >
              <option value="2026-27">2026-27</option>
              <option value="2027-28">2027-28</option>
              <option value="2028-29">2028-29</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              Select Students for Promotion
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Students with at least 35% marks are eligible in this demo.
            </p>
          </div>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-yellow-400 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 &&
                      filteredStudents.every((student) => student.selected)
                    }
                    onChange={toggleAll}
                    aria-label="Select all visible students"
                    className="h-4 w-4 accent-yellow-500"
                  />
                </th>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Student ID</th>
                <th className="px-5 py-4 font-semibold">Current Class</th>
                <th className="px-5 py-4 font-semibold">Roll No.</th>
                <th className="px-5 py-4 font-semibold">Percentage</th>
                <th className="px-5 py-4 font-semibold">Eligibility</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const eligible = student.percentage >= 35;

                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={student.selected}
                        onChange={() => toggleStudent(student.id)}
                        aria-label={`Select ${student.name}`}
                        className="h-4 w-4 accent-yellow-500"
                      />
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {student.name}
                      <p className="mt-1 text-xs font-normal text-slate-500">
                        Section {student.section}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.id}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.currentClass}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.rollNo}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {student.percentage}%
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          eligible
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {eligible ? "Eligible" : "Not Eligible"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No students found in {fromClass}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Promotion Footer */}
        <div className="flex flex-col justify-between gap-4 border-t border-slate-200 p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            {selectedStudents.length} selected · {eligibleStudents.length} eligible
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetSelection}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Reset Selection
            </button>

            <button
              onClick={handlePromotion}
              disabled={eligibleStudents.length === 0}
              className="flex items-center gap-2 rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GraduationCap size={18} />
              Promote Students
            </button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            message.includes("successfully")
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Promotion History */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Recent Promotion Activity</h2>
        <p className="mt-1 text-sm text-slate-500">
          Promotion actions performed during this demo session.
        </p>

        <div className="mt-4 space-y-3">
          {promotionHistory.length > 0 ? (
            promotionHistory.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
              >
                <CheckCircle2 size={18} className="shrink-0 text-green-600" />
                {item}
              </div>
            ))
          ) : (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              No promotion activity yet.
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Demo mode: promotion updates React state only. Data resets on refresh.
        The 35% eligibility rule is illustrative and should be confirmed with
        the institution before backend integration.
      </p>
    </div>
  );
}
