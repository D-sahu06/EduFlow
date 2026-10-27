
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  TrendingUp,
  Award,
  Search,
  Pencil,
  X,
  Check,
} from "lucide-react";

type StudentResult = {
  id: number;
  name: string;
  className: string;
  math: number;
  science: number;
  english: number;
};

const initialResults: StudentResult[] = [
  { id: 1, name: "Aarav Sharma", className: "Class 10", math: 92, science: 88, english: 85 },
  { id: 2, name: "Priya Verma", className: "Class 10", math: 85, science: 91, english: 90 },
  { id: 3, name: "Rahul Patel", className: "Class 9", math: 72, science: 78, english: 80 },
  { id: 4, name: "Ananya Jain", className: "Class 9", math: 95, science: 94, english: 92 },
  { id: 5, name: "Vivek Singh", className: "Class 10", math: 64, science: 70, english: 68 },
  { id: 6, name: "Sneha Gupta", className: "Class 8", math: 81, science: 86, english: 89 },
];

function getAverage(student: StudentResult) {
  return Math.round((student.math + student.science + student.english) / 3);
}

function getGrade(average: number) {
  if (average >= 90) return "A+";
  if (average >= 80) return "A";
  if (average >= 70) return "B";
  if (average >= 60) return "C";
  if (average >= 40) return "D";
  return "F";
}

export default function AcademicPerformancePage() {
  const router = useRouter();

  const [results, setResults] = useState(initialResults);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [editingStudent, setEditingStudent] = useState<StudentResult | null>(null);
  const [message, setMessage] = useState("");

  const overallAverage =
    results.length > 0
      ? Math.round(
          results.reduce((sum, student) => sum + getAverage(student), 0) /
            results.length
        )
      : 0;

  const passCount = results.filter(
    (student) =>
      student.math >= 35 &&
      student.science >= 35 &&
      student.english >= 35
  ).length;

  const gradeACount = results.filter(
    (student) => getAverage(student) >= 80
  ).length;

  const filteredResults = results.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesClass =
      classFilter === "All" || student.className === classFilter;

    return matchesSearch && matchesClass;
  });

  function saveMarks(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingStudent) return;

    const marks = [
      editingStudent.math,
      editingStudent.science,
      editingStudent.english,
    ];

    if (marks.some((mark) => mark < 0 || mark > 100)) {
      setMessage("Marks must be between 0 and 100.");
      return;
    }

    setResults((current) =>
      current.map((student) =>
        student.id === editingStudent.id ? editingStudent : student
      )
    );

    setEditingStudent(null);
    setMessage("Marks updated successfully in this demo.");
  }

  const stats = [
    {
      title: "Students Assessed",
      value: results.length,
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Overall Average",
      value: `${overallAverage}%`,
      icon: TrendingUp,
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: "Students Passed",
      value: `${passCount}/${results.length}`,
      icon: GraduationCap,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Average 80%+",
      value: gradeACount,
      icon: Award,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  const subjects = [
    {
      name: "Mathematics",
      average: results.length
        ? Math.round(results.reduce((sum, s) => sum + s.math, 0) / results.length)
        : 0,
    },
    {
      name: "Science",
      average: results.length
        ? Math.round(results.reduce((sum, s) => sum + s.science, 0) / results.length)
        : 0,
    },
    {
      name: "English",
      average: results.length
        ? Math.round(results.reduce((sum, s) => sum + s.english, 0) / results.length)
        : 0,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <GraduationCap size={27} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              Academic Performance
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review student marks, subject averages and academic grades.
            </p>
          </div>
        </section>

        {message && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-800">
            Subject-wise Average
          </h2>

          <div className="space-y-5">
            {subjects.map((subject) => (
              <div key={subject.name}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">
                    {subject.name}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {subject.average}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${subject.average}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              Student Results
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search student records and update marks.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="All">All Classes</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Math</th>
                  <th className="px-4 py-3">Science</th>
                  <th className="px-4 py-3">English</th>
                  <th className="px-4 py-3">Average</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((student) => {
                  const average = getAverage(student);
                  const grade = getGrade(average);

                  return (
                    <tr key={student.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-4 font-medium text-slate-800">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {student.className}
                      </td>
                      <td className="px-4 py-4">{student.math}</td>
                      <td className="px-4 py-4">{student.science}</td>
                      <td className="px-4 py-4">{student.english}</td>
                      <td className="px-4 py-4 font-semibold">{average}%</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          {grade}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setMessage("");
                            setEditingStudent({ ...student });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-100 hover:text-amber-800"
                        >
                          <Pencil size={14} />
                          Edit Marks
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredResults.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No student results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Edit Marks
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingStudent.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close edit form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveMarks} className="space-y-4">
                {(
                  [
                    ["math", "Mathematics"],
                    ["science", "Science"],
                    ["english", "English"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {label} (0–100)
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="100"
                      value={editingStudent[key]}
                      onChange={(e) =>
                        setEditingStudent((current) =>
                          current
                            ? { ...current, [key]: Number(e.target.value) }
                            : current
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  <Check size={18} />
                  Save Marks
                </button>
              </form>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm leading-6 text-slate-600">
            <strong className="text-slate-800">Demo data:</strong> These
            student marks are stored in frontend state only. Connect the Python
            backend before using this page for official academic records.
          </p>
        </section>
      </div>
    </main>
  );
}
