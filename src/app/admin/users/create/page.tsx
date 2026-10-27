
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  UserPlus,
School,
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

export default function CreateAccountPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Teacher");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    // Frontend preview only. No account is saved yet.
    setMessage(
      "Form validated successfully. Connect Django backend to create the account."
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-9">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <Link
            href="/admin/users"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to User Management
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-400 p-3">
              <UserPlus size={25} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                Create New Account
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Add a user to your institution.
              </p>
            </div>
          </div>
        </header>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <ShieldCheck className="mt-0.5 shrink-0 text-yellow-800" size={22} />
          <div>
            <p className="text-sm font-bold text-gray-900">
              Administrator access
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              This form is currently a frontend preview. Django backend
              authentication and administrator permissions must be connected
              before accounts can actually be created securely.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 p-5 sm:p-7">
            <h2 className="font-bold">Personal Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the users basic details.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full Name *
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <UserRound size={18} className="text-gray-400" />
                  <input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email Address *
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Mail size={18} className="text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@institution.edu"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Phone Number
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Phone size={18} className="text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-semibold"
                >
                  Department / Class
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <BriefcaseBusiness size={18} className="text-gray-400" />
                  <input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 p-5 sm:p-7">
            <h2 className="font-bold">Account Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose the role and initial password.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-semibold"
                >
                  Account Role *
                </label>
                <select
                  id="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Staff">Staff</option>
                  <option value="Student">Student</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Admin role assignment will be controlled securely by the
                  backend.
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold"
                >
                  Initial Password *
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <LockKeyhole size={18} className="text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full py-3 text-sm outline-none"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div
              role="status"
              className="mx-5 mt-5 flex items-start gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-800 sm:mx-7"
            >
              <CheckCircle2 size={19} className="shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 bg-gray-50 p-5 sm:p-7">
            <Link
              href="/admin/users"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-500"
            >
              <UserPlus size={18} />
              Validate Form
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-gray-400">
          EduFlow ERP · Account creation preview
        </p>
      </div>
    </main>
  );
}
