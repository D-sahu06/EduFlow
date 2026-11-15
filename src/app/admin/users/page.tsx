"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Search,
  Users,
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  MoreVertical,
  School,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { hasFeatureAccess } from "@/lib/permissions";
import { getPasswordRequirements, validatePasswordStrength } from "@/lib/password";
import type { Role } from "@/types/permission";

type DbUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  rawRole: string;
  department: string;
  status: string;
};

function formatRoleLabel(rawRole: string) {
  const upper = String(rawRole || "").toUpperCase();
  if (upper === "SUPER_ADMIN") return "Super Admin";
  if (upper === "HOD") return "HOD";
  if (!upper) return "User";
  return upper.charAt(0) + upper.slice(1).toLowerCase();
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState<Role | "">("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [notice, setNotice] = useState("");
  const [errorBanner, setErrorBanner] = useState("");

  // Reset Password modal state
  const [resetTarget, setResetTarget] = useState<DbUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?._id || parsed?.id) {
          setCurrentUserId(String(parsed._id || parsed.id));
        }
        if (parsed?.role) setCurrentRole(String(parsed.role).toUpperCase() as Role);
      } else {
        const savedRole = localStorage.getItem("eduflow-role") || localStorage.getItem("role") || "";
        if (savedRole) setCurrentRole(savedRole.toUpperCase() as Role);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-user-actions-menu]")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeMenuId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setErrorBanner("");
      const res = await api.get("/users");
      if (res && res.users) {
        setUsers(
          res.users.map((u: any) => ({
            _id: u._id,
            name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
            email: u.email,
            rawRole: String(u.role || "").toUpperCase(),
            role: formatRoleLabel(u.role),
            department: u.department || "General",
            status: u.status === "inactive" ? "Inactive" : "Active",
          }))
        );
      }
    } catch (err: any) {
      console.error("Failed to load users :", err);
      setErrorBanner(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "All Roles" ||
      user.role.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const roleIcon = (userRole: string) => {
    const r = userRole.toLowerCase();
    if (r.includes("admin")) return ShieldCheck;
    if (r.includes("teacher")) return GraduationCap;
    if (r.includes("student")) return Users;
    return BriefcaseBusiness;
  };

  const activeCount = users.filter((u) => u.status === "Active").length;
  const uniqueRolesCount = new Set(users.map((u) => u.role)).size;

  const hasHierarchyPermission = (target: DbUser) => {
    if (currentRole === "SUPER_ADMIN") return true;
    if (currentRole === "ADMIN") return target.rawRole !== "SUPER_ADMIN";
    if (currentRole === "PRINCIPAL") {
      return !["SUPER_ADMIN", "ADMIN"].includes(target.rawRole);
    }
    return false;
  };

  const canResetAny = Boolean(
    currentRole && hasFeatureAccess(currentRole, "roleManagement", "resetPassword", "edit")
  );

  const canResetTarget = (target: DbUser) =>
    canResetAny && hasHierarchyPermission(target);

  const canDeleteAny = Boolean(
    currentRole &&
      ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(currentRole) &&
      hasFeatureAccess(currentRole, "roleManagement", "userRoleAssignment", "delete")
  );

  const canDeleteTarget = (target: DbUser) =>
    canDeleteAny &&
    target._id !== currentUserId &&
    hasHierarchyPermission(target);

  const dashboardHref =
    currentRole === "SUPER_ADMIN"
      ? "/dashboard/super-admin"
      : currentRole === "PRINCIPAL"
      ? "/dashboard/principal"
      : "/admin";

  const openResetModal = (target: DbUser) => {
    setActiveMenuId(null);
    setResetTarget(target);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetError("");
    setNotice("");
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError("");

    const strengthError = validatePasswordStrength(newPassword, confirmPassword);
    if (strengthError) {
      setResetError(strengthError);
      return;
    }

    setResetting(true);
    try {
      const res = await api.put<{ success?: boolean; message?: string }>(
        `/users/${resetTarget._id}/reset-password`,
        {
          newPassword,
          confirmPassword,
        }
      );

      setNotice(
        res?.message || `Password for ${resetTarget.name} reset successfully.`
      );
      setResetTarget(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async (target: DbUser) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${target.name}" (${target.role})? Deleted accounts cannot log in again.`
      )
    ) {
      return;
    }
    try {
      setErrorBanner("");
      setNotice("");
      await api.delete(`/users/${target._id}`);
      setActiveMenuId(null);
      setNotice(`Account "${target.name}" deleted successfully and can no longer log in.`);
      await loadUsers();
    } catch (err: any) {
      setActiveMenuId(null);
      setErrorBanner(err?.message || "Failed to delete user from database.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-9">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back
            </button>

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

          {/* <Link
            href="/admin/users/create"
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-500 cursor-pointer"
          >
            <UserPlus size={19} />
            Create Account
          </Link> */}
        </header>

        {notice && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-5 py-3.5 text-sm font-semibold text-green-800"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="rounded-lg p-1 text-green-700 hover:bg-green-100 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {errorBanner && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-700"
          >
            {errorBanner}
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Accounts</p>
            <p className="mt-2 text-3xl font-extrabold">
              {String(users.length).padStart(2, "0")}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Active Accounts</p>
            <p className="mt-2 text-3xl font-extrabold text-green-600">
              {String(activeCount).padStart(2, "0")}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Available Roles</p>
            <p className="mt-2 text-3xl font-extrabold text-blue-600">
              {String(uniqueRolesCount || 6).padStart(2, "0")}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">All Accounts</h2>
              <p className="mt-1 text-sm text-gray-500">
                Showing {filteredUsers.length} accounts 
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
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-400 cursor-pointer"
              >
                <option>All Roles</option>
                <option>Super Admin</option>
                <option>Admin</option>
                <option>Principal</option>
                <option>Teacher</option>
                <option>Accountant</option>
                <option>Student</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
                <Loader2 className="animate-spin text-yellow-500" size={24} />
                <span>Loading accounts...</span>
              </div>
            ) : (
              <table className="w-full min-w-187.5 text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Department</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const Icon = roleIcon(user.role);

                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-900">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-800">
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

                        <td className="px-5 py-4 text-right">
                          {(canResetTarget(user) || canDeleteTarget(user)) ? (
                            <div
                              className="relative inline-block text-left"
                              data-user-actions-menu
                            >
                              <button
                                type="button"
                                aria-label={`Actions for ${user.name}`}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
                                onClick={() =>
                                  setActiveMenuId(
                                    activeMenuId === user._id ? null : user._id
                                  )
                                }
                              >
                                <MoreVertical size={19} />
                              </button>

                              {activeMenuId === user._id && (
                                <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                                  {canResetTarget(user) && (
                                    <button
                                      type="button"
                                      onClick={() => openResetModal(user)}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-gray-800 hover:bg-yellow-50 cursor-pointer"
                                    >
                                      <KeyRound size={14} className="text-yellow-600" />
                                      Reset Password
                                    </button>
                                  )}
                                  {canDeleteTarget(user) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user)}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Restricted</span>
                          )}
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
            )}
          </div>

          {/* <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
            Live MongoDB Data · Connected to Node.js / Express authentication backend.
          </div> */}
        </section>
      </div>

      {/* Role-Based Password Reset Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-yellow-100 p-2.5 text-yellow-800">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Reset Password</h2>
                  <p className="text-xs text-gray-500">
                    Set a new encrypted password for this account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label="Close reset password dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <p className="text-sm font-bold text-gray-900">{resetTarget.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {resetTarget.email} · <span className="font-semibold text-gray-700">{resetTarget.role}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              {resetError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700"
                >
                  {resetError}
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-reset-new-password"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  New Password *
                </label>
                <div className="relative">
                  <input
                    id="admin-reset-new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetError("");
                    }}
                    placeholder="Enter strong new password"
                    required
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-yellow-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-gray-100 bg-gray-50 p-3">
                {getPasswordRequirements(newPassword).map((req) => (
                  <p
                    key={req.label}
                    className={`text-xs ${
                      req.met ? "font-semibold text-green-700" : "text-gray-500"
                    }`}
                  >
                    {req.met ? "✓" : "•"} {req.label}
                  </p>
                ))}
              </div>

              <div>
                <label
                  htmlFor="admin-reset-confirm-password"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    id="admin-reset-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setResetError("");
                    }}
                    placeholder="Confirm new password"
                    required
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-yellow-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-bold text-gray-950 transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      Save New Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
