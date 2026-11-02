
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Filter,
  Mail,
  ArrowLeft,
  Phone,
  Building2,
} from "lucide-react";

type TeacherStatus = "Active" | "On Leave" | "Inactive";

type Teacher = {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  qualification: string;
  joiningDate: string;
  status: TeacherStatus;
};

type TeacherForm = Omit<Teacher, "id">;

const initialTeachers: Teacher[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@eduflow.com",
    phone: "9876543210",
    department: "Computer Science",
    designation: "Senior Lecturer",
    qualification: "M.Tech",
    joiningDate: "2023-06-15",
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Verma",
    email: "priya@eduflow.com",
    phone: "9876543211",
    department: "Mathematics",
    designation: "Assistant Professor",
    qualification: "M.Sc",
    joiningDate: "2022-08-10",
    status: "Active",
  },
  {
    id: 3,
    name: "Amit Patel",
    email: "amit@eduflow.com",
    phone: "9876543212",
    department: "Physics",
    designation: "Lecturer",
    qualification: "M.Sc",
    joiningDate: "2024-01-20",
    status: "On Leave",
  },
  {
    id: 4,
    name: "Sneha Gupta",
    email: "sneha@eduflow.com",
    phone: "9876543213",
    department: "English",
    designation: "Senior Lecturer",
    qualification: "M.A",
    joiningDate: "2021-07-05",
    status: "Active",
  },
  {
    id: 5,
    name: "Vikas Jain",
    email: "vikas@eduflow.com",
    phone: "9876543214",
    department: "Chemistry",
    designation: "Assistant Professor",
    qualification: "Ph.D",
    joiningDate: "2020-03-12",
    status: "Inactive",
  },
];

const emptyForm: TeacherForm = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  qualification: "",
  joiningDate: "",
  status: "Active",
};

const departments = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Other",
];

export default function AllTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalType, setModalType] = useState<
    "add" | "edit" | "view" | null
  >(null);

  const [selectedTeacher, setSelectedTeacher] =
    useState<Teacher | null>(null);

  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const router = useRouter()

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const searchMatch =
        teacher.name.toLowerCase().includes(search.toLowerCase()) ||
        teacher.email.toLowerCase().includes(search.toLowerCase()) ||
        teacher.phone.includes(search);

      const departmentMatch =
        departmentFilter === "All" ||
        teacher.department === departmentFilter;

      const statusMatch =
        statusFilter === "All" || teacher.status === statusFilter;

      return searchMatch && departmentMatch && statusMatch;
    });
  }, [teachers, search, departmentFilter, statusFilter]);

  const activeCount = teachers.filter(
    (teacher) => teacher.status === "Active"
  ).length;

  const leaveCount = teachers.filter(
    (teacher) => teacher.status === "On Leave"
  ).length;

  const inactiveCount = teachers.filter(
    (teacher) => teacher.status === "Inactive"
  ).length;

  const openAddModal = () => {
    setForm(emptyForm);
    setSelectedTeacher(null);
    setFormError("");
    setModalType("add");
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      designation: teacher.designation,
      qualification: teacher.qualification,
      joiningDate: teacher.joiningDate,
      status: teacher.status,
    });
    setFormError("");
    setModalType("edit");
  };

  const openViewModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setModalType("view");
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const emailExists = teachers.some(
      (teacher) =>
        teacher.email.toLowerCase() === form.email.trim().toLowerCase() &&
        teacher.id !== selectedTeacher?.id
    );

    if (emailExists) {
      setFormError("This email is already registered.");
      return;
    }

    const cleanedForm: TeacherForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    if (modalType === "add") {
      const newTeacher: Teacher = {
        ...cleanedForm,
        id: Math.max(0, ...teachers.map((teacher) => teacher.id)) + 1,
      };

      setTeachers((prev) => [newTeacher, ...prev]);
    } else if (modalType === "edit" && selectedTeacher) {
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === selectedTeacher.id
            ? { ...cleanedForm, id: selectedTeacher.id }
            : teacher
        )
      );
    }

    setModalType(null);
    setSelectedTeacher(null);
    setForm(emptyForm);
  };

  const handleDelete = () => {
    if (deleteId === null) return;

    setTeachers((prev) =>
      prev.filter((teacher) => teacher.id !== deleteId)
    );

    setDeleteId(null);
  };

  const statusStyle = (status: TeacherStatus) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700";
      case "On Leave":
        return "bg-orange-50 text-orange-700";
      case "Inactive":
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
           <button
                  onClick={() => router.back()}
                  className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                  <ArrowLeft size={17} />
                   Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            All Teachers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all registered teachers.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Teachers",
            value: teachers.length,
            icon: Users,
            color: "bg-yellow-100 text-yellow-700",
          },
          {
            title: "Active Teachers",
            value: activeCount,
            icon: UserCheck,
            color: "bg-green-100 text-green-700",
          },
          {
            title: "On Leave",
            value: leaveCount,
            icon: GraduationCap,
            color: "bg-orange-100 text-orange-700",
          },
          {
            title: "Inactive Teachers",
            value: inactiveCount,
            icon: UserX,
            color: "bg-gray-100 text-gray-600",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </h2>
                </div>
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-yellow-700" />
          <h2 className="font-semibold text-slate-900">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            Showing {filteredTeachers.length} of {teachers.length} teachers
          </p>

          <button
            onClick={() => {
              setSearch("");
              setDepartmentFilter("All");
              setStatusFilter("All");
            }}
            className="text-xs font-semibold text-yellow-700 hover:text-yellow-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-bold text-slate-900">Teacher Records</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage teacher information and account status.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase text-gray-500">
                <th className="px-5 py-4 font-semibold">Teacher</th>
                <th className="px-5 py-4 font-semibold">Department</th>
                <th className="px-5 py-4 font-semibold">Designation</th>
                <th className="px-5 py-4 font-semibold">Joining Date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="border-t border-gray-100 transition hover:bg-yellow-50/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-800">
                        {teacher.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {teacher.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {teacher.department}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {teacher.designation}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {teacher.joiningDate}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        teacher.status
                      )}`}
                    >
                      {teacher.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="View Teacher"
                        onClick={() => openViewModal(teacher)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        title="Edit Teacher"
                        onClick={() => openEditModal(teacher)}
                        className="rounded-lg p-2 text-yellow-700 transition hover:bg-yellow-50"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        title="Delete Teacher"
                        onClick={() => setDeleteId(teacher.id)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="font-semibold text-slate-700">
                      No teachers found
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modalType === "add" || modalType === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modalType === "add" ? "Add New Teacher" : "Edit Teacher"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the teachers information below.
                </p>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Full Name">
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Email Address">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="teacher@example.com"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Phone Number">
                  <input
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    title="Enter a 10-digit phone number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="10-digit mobile number"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Department">
                  <select
                    required
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Select Department</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Designation">
                  <input
                    required
                    value={form.designation}
                    onChange={(e) =>
                      setForm({ ...form, designation: e.target.value })
                    }
                    placeholder="e.g. Assistant Professor"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Qualification">
                  <input
                    required
                    value={form.qualification}
                    onChange={(e) =>
                      setForm({ ...form, qualification: e.target.value })
                    }
                    placeholder="e.g. M.Tech, Ph.D"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Joining Date">
                  <input
                    required
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) =>
                      setForm({ ...form, joiningDate: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as TeacherStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </FormField>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-yellow-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400"
                >
                  {modalType === "add" ? "Save Teacher" : "Update Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === "view" && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Teacher Details
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-xl font-bold text-yellow-800">
                  {selectedTeacher.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedTeacher.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedTeacher.designation}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                      selectedTeacher.status
                    )}`}
                  >
                    {selectedTeacher.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={selectedTeacher.email}
                />
                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={selectedTeacher.phone}
                />
                <DetailRow
                  icon={Building2}
                  label="Department"
                  value={selectedTeacher.department}
                />
                <DetailRow
                  icon={GraduationCap}
                  label="Qualification"
                  value={selectedTeacher.qualification}
                />
                <DetailRow
                  icon={Users}
                  label="Joining Date"
                  value={selectedTeacher.joiningDate}
                />
              </div>

              <button
                onClick={() => setModalType(null)}
                className="mt-7 w-full rounded-lg bg-yellow-300 py-2.5 text-sm font-bold text-slate-900 hover:bg-yellow-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-center text-lg font-bold text-slate-900">
              Delete Teacher?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Are you sure you want to delete this teacher? This action cannot
              be undone in this demo.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Notice */}
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Demo Mode – Frontend Only
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Teacher records are stored in React state only. Changes will reset
          when the page is refreshed. Backend integration and persistent
          storage are not connected yet.
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="wrap-break-words text-sm font-medium text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}
