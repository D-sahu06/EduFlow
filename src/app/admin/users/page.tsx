
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Search,
  UserPlus,
  Users,
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  MoreVertical,
  School,
} from "lucide-react";
import { useState } from "react";

const initialUsers = [
  {
    name: "Admin User",
    email: "admin@eduflow.demo",
    role: "Admin",
    department: "Administration",
    status: "Active",
  },
  {
    name: "Rahul Sharma",
    email: "rahul@eduflow.demo",
    role: "Teacher",
    department: "Academics",
    status: "Active",
  },
  {
    name: "Priya Verma",
    email: "priya@eduflow.demo",
    role: "Staff",
    department: "Accounts",
    status: "Active",
  },
  {
    name: "Aman Singh",
    email: "aman@eduflow.demo",
    role: "Student",
    department: "Class 10",
    status: "Inactive",
  },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");

  const filteredUsers = initialUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "All Roles" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const roleIcon = (role: string) => {
    if (role === "Admin") return ShieldCheck;
    if (role === "Teacher") return GraduationCap;
    if (role === "Staff") return BriefcaseBusiness;
    return Users;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-9">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-yellow-400 p-3">
                <School size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  User Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage institution accounts and their roles.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/users/create"
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-500"
          >
            <UserPlus size={19} />
            Create Account
          </Link>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Accounts</p>
            <p className="mt-2 text-3xl font-extrabold">04</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Active Accounts</p>
            <p className="mt-2 text-3xl font-extrabold">03</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Available Roles</p>
            <p className="mt-2 text-3xl font-extrabold">04</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">All Accounts</h2>
              <p className="mt-1 text-sm text-gray-500">
                Showing {filteredUsers.length} sample accounts
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
                <Search size={17} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or email"
                  aria-label="Search users"
                  className="min-w-0 text-sm outline-none sm:w-48"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter by role"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-400"
              >
                <option>All Roles</option>
                <option>Admin</option>
                <option>Teacher</option>
                <option>Staff</option>
                <option>Student</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-187.5 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Department</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const Icon = roleIcon(user.role);

                  return (
                    <tr key={user.email} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-900">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold">
                          <Icon size={14} />
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {user.department}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          title="Actions will be connected later"
                          aria-label={`Actions for ${user.name}`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          onClick={() =>
                            alert(
                              "User actions will be implemented after backend integration."
                            )
                          }
                        >
                          <MoreVertical size={19} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No accounts match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
            Demo data only · User records will come from Django + PostgreSQL.
          </div>
        </section>
      </div>
    </main>
  );
}
