"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { getPasswordRequirements, validatePasswordStrength } from "@/lib/password";

type RecoveryStep = "request" | "verify" | "done";

export default function ForgotPasswordPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [emailRecoveryEnabled, setEmailRecoveryEnabled] = useState(false);

  const [step, setStep] = useState<RecoveryStep>("request");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const checkRecoveryAvailability = useCallback(async () => {
    try {
      setCheckingStatus(true);
      const res = await fetch(`${apiUrl}/auth/recovery-status`);
      const data = await res.json().catch(() => ({}));
      setEmailRecoveryEnabled(Boolean(data?.emailRecoveryEnabled));
    } catch {
      setEmailRecoveryEnabled(false);
    } finally {
      setCheckingStatus(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    checkRecoveryAvailability();
  }, [checkRecoveryAvailability]);

  async function handleRequestOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!identifier.trim()) {
      setError("Please enter your registered email address or username.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        if (data?.recoveryMode === "ADMIN_ASSISTED") {
          setEmailRecoveryEnabled(false);
        }
        setError(
          data.message ||
            "Unable to initiate password recovery. Contact your administrator."
        );
        return;
      }

      setInfoMessage(
        data.message ||
          "Verification OTP sent to your registered email address."
      );
      setStep("verify");
    } catch {
      setError("Unable to connect to authentication server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetWithOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit verification OTP sent to your email.");
      return;
    }

    const strengthError = validatePasswordStrength(newPassword, confirmPassword);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to reset password.");
        return;
      }

      setStep("done");
    } catch {
      setError("Unable to connect to authentication server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const passwordChecks = getPasswordRequirements(newPassword);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcf9] px-4 py-10">
      {/* Decorative background matching EduFlow login */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-36 h-110 w-110 rounded-full border-35 border-yellow-100/70" />
        <div className="absolute -left-32 -top-28 h-97.5 w-97.5 rounded-full border-2 border-yellow-200/60" />
        <div className="absolute -bottom-64 -right-36 h-150 w-150 rounded-full border-45 border-yellow-100/70" />
        <div className="absolute -bottom-52 -right-28 h-120 w-120 rounded-full border-2 border-yellow-200/60" />
        <div className="absolute left-1/2 top-1/2 h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />
      </div>

      <section className="relative z-10 w-full max-w-107.5 rounded-2xl border border-slate-100 bg-white/95 px-7 py-9 shadow-xl shadow-slate-200/30 sm:px-10 sm:py-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
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
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Recover access to your EduFlow account
          </p>
        </div>

        {checkingStatus ? (
          <div className="mt-8 flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="animate-spin text-yellow-500" size={20} />
            Checking recovery options...
          </div>
        ) : !emailRecoveryEnabled ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-yellow-200 bg-yellow-50/80 p-5 text-left">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 shrink-0 text-yellow-700" size={20} />
                <div className="space-y-2 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Administrator Password Reset Required
                  </p>
                  <p className="text-xs leading-5 text-slate-600">
                    Self-service email OTP delivery is currently disabled because SMTP email transport is not configured on the backend server.
                  </p>
                  <p className="text-xs leading-5 text-slate-600">
                    For account security, passwords cannot be reset without verified out-of-band authentication. Please contact your{" "}
                    <strong className="font-semibold text-slate-900">
                      Super Admin, Admin, or Principal
                    </strong>{" "}
                    to reset your password in{" "}
                    <strong className="font-semibold text-slate-900">
                      User Management
                    </strong>.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500"
            >
              <ArrowLeft size={17} />
              Back to Log In
            </Link>
          </div>
        ) : step === "done" ? (
          <div className="mt-8 space-y-5 text-center">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <CheckCircle2 className="mx-auto mb-2 text-green-600" size={30} />
              <p className="text-sm font-bold text-green-900">
                Password Reset Successfully
              </p>
              <p className="mt-1 text-xs text-green-700">
                Your password has been updated securely. Please sign in with your new password.
              </p>
            </div>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500"
            >
              Return to Log In
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : step === "request" ? (
          <form onSubmit={handleRequestOtp} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Registered Email or Username
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                />
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
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-lg bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Sending OTP..." : "Send Verification OTP"}
              {!submitting && <ArrowRight size={17} />}
            </button>

            <Link
              href="/login"
              className="block w-full text-center text-sm text-slate-500 transition hover:text-yellow-500 hover:underline"
            >
              Back to Log In
            </Link>
          </form>
        ) : (
          <form onSubmit={handleResetWithOtp} className="mt-8 space-y-4">
            {infoMessage && (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-medium text-green-800">
                {infoMessage}
              </p>
            )}

            <div>
              <label
                htmlFor="otp"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Verification OTP (6 digits)
              </label>
              <div className="relative">
                <KeyRound
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm tracking-widest text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-3">
              {passwordChecks.map((req) => (
                <p
                  key={req.label}
                  className={`text-xs ${
                    req.met ? "font-semibold text-green-700" : "text-slate-500"
                  }`}
                >
                  {req.met ? "✓" : "•"} {req.label}
                </p>
              ))}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-lg bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("request");
                setError("");
                setOtp("");
              }}
              className="w-full cursor-pointer text-center text-sm text-slate-500 transition hover:text-yellow-500 hover:underline"
            >
              Request another OTP
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-xs leading-5 text-slate-400">
          Authorized access only. Contact your administrator if you need
          assistance.
        </p>
      </section>
    </main>
  );
}
