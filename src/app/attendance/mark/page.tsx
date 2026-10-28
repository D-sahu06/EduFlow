
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardCheck,
  Save,
  Search,
  Users,
  X,
  ArrowLeft,
} from "lucide-react";

type Status = "Present" | "Absent" | "Late" | "On Leave";

type Student = {
  id: number;
  name: string;
  rollNo: string;
  className: string;
  section: string;
};

const students: Student[] = [
  { id: 1, name: "Aarav Sharma", rollNo: "STU001", className: "Class 10", section: "A" },
  { id: 2, name: "Ananya Verma", rollNo: "STU002", className: "Class 10", section: "A" },
  { id: 3, name: "Rohan Patel", rollNo: "STU003", className: "Class 10", section: "A" },
  { id: 4, name: "Priya Singh", rollNo: "STU004", className: "Class 10", section: "A" },
  { id: 5, name: "Arjun Jain", rollNo: "STU005", className: "Class 10", section: "A" },
  { id: 6, name: "Isha Gupta", rollNo: "STU006", className: "Class 9", section: "A" },
  { id: 7, name: "Kabir Joshi", rollNo: "STU007", className: "Class 9", section: "A" },
  { id: 8, name: "Meera Shah", rollNo: "STU008", className: "Class 9", section: "B" },
  { id: 9, name: "Vivaan Patel", rollNo: "STU009", className: "Class 9", section: "B" },
];

const statuses: Status[] = ["Present", "Absent", "Late", "On Leave"];

const statusStyles: Record<Status, string> = {
  Present: "border-green-200 bg-green-50 text-green-700",
  Absent: "border-red-200 bg-red-50 text-red-700",
  Late: "border-yellow-300 bg-yellow-50 text-yellow-800",
  "On Leave": "border-blue-200 bg-blue-50 text-blue-700",
};

function getToday() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export default function MarkAttendancePage() {
  const [date, setDate] = useState(getToday());
  const [className, setClassName] = useState("Class 10");
  const [section, setSection] = useState("A");
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Record<number, Status>>({});
  const [savedMessage, setSavedMessage] = useState("");
  const [savedRecords, setSavedRecords] = useState<
    { date: string; className: string; section: string; attendance: Record<number, Status> }[]
  >([]);
  const router = useRouter();

  const visibleStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesClass =
        student.className === className && student.section === section;
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase());

      return matchesClass && matchesSearch;
    });
  }, [className, section, search]);

  const counts = {
    present: visibleStudents.filter((s) => attendance[s.id] === "Present").length,
    absent: visibleStudents.filter((s) => attendance[s.id] === "Absent").length,
    late: visibleStudents.filter((s) => attendance[s.id] === "Late").length,
    leave: visibleStudents.filter((s) => attendance[s.id] === "On Leave").length,
    unmarked: visibleStudents.filter((s) => !attendance[s.id]).length,
  };

  function updateStatus(id: number, status: Status) {
    setAttendance((current) => ({ ...current, [id]: status }));
    setSavedMessage("");
  }

  function markAllPresent() {
    setAttendance((current) => {
      const next = { ...current };
      visibleStudents.forEach((student) => {
        next[student.id] = "Present";
      });
      return next;
    });
    setSavedMessage("");
  }

  function saveAttendance() {
    if (visibleStudents.length === 0) {
      setSavedMessage("No students found for the selected class and section.");
      return;
    }

    if (counts.unmarked > 0) {
      setSavedMessage(`Please mark all students first. ${counts.unmarked} remain unmarked.`);
      return;
    }

    const record = { date, className, section, attendance: { ...attendance } };

    setSavedRecords((current) => {
      const withoutDuplicate = current.filter(
        (item) =>
          !(item.date === date &&
            item.className === className &&
            item.section === section)
      );
      return [...withoutDuplicate, record];
    });

    try {
      const key = "eduflow-attendance-demo";
      const existing = JSON.parse(localStorage.getItem(key) || "[]") as typeof savedRecords;
      const withoutDuplicate = existing.filter(
        (item) =>
          !(item.date === date &&
            item.className === className &&
            item.section === section)
      );
      localStorage.setItem(key, JSON.stringify([...withoutDuplicate, record]));
      setSavedMessage("Attendance saved successfully on this device.");
    } catch {
      setSavedMessage("Attendance updated for this page, but browser storage was unavailable.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <button
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back
            </button>
          
          <h1 className="mt-2 text-2xl font-extrabold text-gray-950 md:text-3xl">
            Mark Attendance
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a class and record each student&apos;s daily attendance.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Students", value: visibleStudents.length, icon: Users, color: "text-gray-900", bg: "bg-yellow-100" },
            { label: "Present", value: counts.present, icon: Check, color: "text-green-700", bg: "bg-green-100" },
            { label: "Absent", value: counts.absent, icon: X, color: "text-red-700", bg: "bg-red-100" },
            { label: "Not Marked", value: counts.unmarked, icon: ClipboardCheck, color: "text-yellow-800", bg: "bg-yellow-100" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{item.label}</p>
                  <div className={`rounded-xl p-2.5 ${item.bg}`}>
                    <Icon size={20} className={item.color} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-gray-950">{item.value}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-950">
            Attendance Details
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-gray-700">
              Attendance Date
              <div className="relative mt-2">
                <CalendarDays size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSavedMessage("");
                  }}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 font-normal outline-none focus:border-yellow-400"
                />
              </div>
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Class
              <select
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setSearch("");
                  setSavedMessage("");
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-yellow-400"
              >
                <option>Class 9</option>
                <option>Class 10</option>
              </select>
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Section
              <select
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setSearch("");
                  setSavedMessage("");
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-yellow-400"
              >
                <option>A</option>
                <option>B</option>
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Student Register</h2>
              <p className="mt-1 text-sm text-gray-500">
                {className} · Section {section} · {date || "No date selected"}
              </p>
            </div>
            <button
              onClick={markAllPresent}
              className="flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-100"
            >
              <CheckCheck size={17} />
              Mark All Present
            </button>
          </div>

          <div className="border-b border-gray-100 p-4">
            <div className="relative max-w-sm">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or roll number"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Roll Number</th>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-yellow-50/40">
                    <td className="px-5 py-4 font-semibold text-gray-900">{student.name}</td>
                    <td className="px-5 py-4 text-gray-600">{student.rollNo}</td>
                    <td className="px-5 py-4 text-gray-600">{student.className} - {student.section}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {statuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStatus(student.id, status)}
                            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                              attendance[student.id] === status
                                ? statusStyles[status] + " ring-2 ring-yellow-300 ring-offset-1"
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500">
                      No students found for this class, section or search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 p-5">
            <div className="text-sm text-gray-600">
              Marked: <span className="font-bold text-gray-950">{visibleStudents.length - counts.unmarked}</span> / {visibleStudents.length}
              <p className="mt-1 text-xs text-gray-400">
                Late: {counts.late} · On Leave: {counts.leave}
              </p>
            </div>
            <button
              onClick={saveAttendance}
              disabled={visibleStudents.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-yellow-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={18} />
              Save Attendance
            </button>
          </div>

          {savedMessage && (
            <p role="status" className="border-t border-gray-100 px-5 py-4 text-sm font-medium text-gray-700">
              {savedMessage}
            </p>
          )}
        </section>

        <p className="text-xs text-gray-400">
          Demo implementation: sample students are used. Records are stored in this browser only, not in the ERP backend.
        </p>
      </div>
    </main>
  );
}
