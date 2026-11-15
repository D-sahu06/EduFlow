"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  // EyeOff,
  Building2,
  ArrowRight,
  UserRound,
} from "lucide-react";

type UserRole = "admin" | "principal" | "student" | "teacher" | "accountant";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<{ name?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("eduflow-token");
      const userStr = localStorage.getItem("eduflow-user");
      if (token && userStr) {
        const u = JSON.parse(userStr);
        setExistingUser(u);
      }
    } catch {
      // ignore parse error
    }
  }, []);

  const getDashboardRoute = (userRole: string) => {
    switch (userRole.toUpperCase()) {
      case "SUPER_ADMIN":
        return "/dashboard/super-admin";
      case "PRINCIPAL":
        return "/dashboard/principal";
      case "TEACHER":
        return "/dashboard/teacher";
      case "STUDENT":
        return "/dashboard/student";
      case "ACCOUNTANT":
        return "/dashboard/accountant";
      case "USER":
        return "/examinations";
      case "ADMIN":
      default:
        return "/admin";
    }
  };

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both username/email and password.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid username or password.");
        setLoading(false);
        return;
      }

      const token = data.token;
      const user = data.user;

      // Real persistent backend authentication
      localStorage.setItem("token", token);
      localStorage.setItem("access_token", token);
      localStorage.setItem("eduflow-token", token);
      localStorage.setItem("eduflow-user", JSON.stringify(user));
      localStorage.setItem("eduflow-role", user.role?.toUpperCase() || "ADMIN");

      // Set cookie for Next.js SSR / route guard
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `auth-token=${token}; path=/; max-age=604800; SameSite=Lax`;

      window.dispatchEvent(new Event("eduflow-user-change"));

      const targetRoute = getDashboardRoute(user.role || "");
      router.replace(targetRoute);
    } catch (err: any) {
      console.error("Login request error:", err);
      setError("Unable to connect to authentication server. Please ensure the backend is running.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcf9] px-4 py-10">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-36 h-110 w-110 rounded-full border-35 border-yellow-100/70" />
        <div className="absolute -left-32 -top-28 h-97.5 w-97.5 rounded-full border-2 border-yellow-200/60" />
        <div className="absolute -bottom-64 -right-36 h-150 w-150 rounded-full border-45 border-yellow-100/70" />
        <div className="absolute -bottom-52 -right-28 h-120 w-120 rounded-full border-2 border-yellow-200/60" />
        <div className="absolute left-1/2 top-1/2 h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />
      </div>

      {/* Login card */}
      <section className="relative z-10 w-full max-w-107.5 rounded-2xl border border-slate-100 bg-white/95 px-7 py-9 shadow-xl shadow-slate-200/30 sm:px-10 sm:py-10">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-slate-900 shadow-sm">
              <Building2 size={29} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                EduFlow<span className="text-yellow-500"> ERP</span>
              </h1>
              <p className="text-[11px] font-medium tracking-[0.18em] text-slate-500">
                MANAGEMENT SYSTEM
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Log in to your EduFlow account
          </p>
        </div>

        {existingUser && (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50/80 p-4 text-center">
            <p className="text-xs text-slate-600">
              You are currently signed in as <strong className="font-semibold text-slate-900">{existingUser.name || "User"}</strong> ({existingUser.role}).
            </p>
            <Link
              href={getDashboardRoute(existingUser.role || "ADMIN")}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-yellow-500"
            >
              Continue to Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {/* Role selector */}
          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Login as
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <select
                id="role"
                name="role"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as UserRole);
                  setError("");
                }}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-10 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              >
                <option value="admin">Admin</option>
                <option value="principal">Principal</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="accountant">Accountant</option>
                {/* <option value="user">User</option> */}
              </select>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {role === "admin"
                ? "Manage users and the ERP system."
                : role === "principal"
                ? "Sign in to view your principal dashboard."
                : role === "student"
                ? "Sign in to view your student dashboard."
                : role === "teacher"
                ? "Sign in to view your teacher dashboard."
                : "Sign in to manage fees and financial records."}
            </p>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
              />

              {/* <button
                type="button"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-900"
              >
                {showPassword ? (
                  <Eye size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button> */}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-lg bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Log In"}
            {!loading && <ArrowRight size={17} />}
          </button>

          {/* <button
            type="button"
            onClick={() =>
              router.push("/forgot-password")
            }
            className="w-full cursor-pointer text-center text-sm text-slate-500 transition hover:text-yellow-400 hover:underline"
          >
            Forgot Password?
          </button> */}
        </form>

        <p className="mt-7 text-center text-xs leading-5 text-slate-400">
          Authorized access only. Contact your administrator if you need
          assistance.
        </p>
      </section>
    </main>
  );
}
