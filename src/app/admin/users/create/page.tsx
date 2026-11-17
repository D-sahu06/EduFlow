"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cake,
  MapPin,
  Hash,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";

export default function CreateAccountPage() {
  const router = useRouter();

  // Personal & Profile Information states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Unmarried");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("");

  // Account Information states
  const [role, setRole] = useState("Teacher");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & session states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eduflow-user");
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
      }
    } catch (err) {
      console.error("Failed to read user from localStorage:", err);
    }
  }, []);

  const isPrincipal =
    currentUser?.role?.toUpperCase() === "PRINCIPAL" ||
    currentUser?.role === "Principal";

  const isUpdatingSelf = Boolean(
    currentUser &&
      email.trim() &&
      (email.trim().toLowerCase() === currentUser.email?.toLowerCase() ||
        email.trim().split("@")[0].toLowerCase() ===
          currentUser.username?.toLowerCase())
  );

  const fillPrincipalProfile = async () => {
    setError("");
    setMessage("");
    try {
      // First try live profile from API
      let u = currentUser;
      try {
        const res = await api.get<{ success?: boolean; user?: any }>("/users/profile");
        if (res?.user) {
          u = res.user;
          setCurrentUser(u);
        }
      } catch {
        // Use stored currentUser
      }

      if (u) {
        setFullName(u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim());
        setEmail(u.email || "");
        setPhone(u.phone || "");

        const rawDob = u.dob || u.birthDate;
        if (rawDob) {
          setDob(String(rawDob).slice(0, 10));
        }

        if (u.gender) setGender(u.gender);
        if (u.maritalStatus) setMaritalStatus(u.maritalStatus);
        if (u.emergencyContact || u.parentPhone)
          setEmergencyContact(u.emergencyContact || u.parentPhone || "");
        if (u.emergencyName || u.parentName)
          setEmergencyName(u.emergencyName || u.parentName || "");
        if (u.emergencyRelation) setEmergencyRelation(u.emergencyRelation);
        if (u.address) setAddress(u.address);
        if (u.department) setDepartment(u.department);
        if (u.className) setClassName(u.className);
        if (u.section) setSection(u.section);
        if (u.rollNumber || u.employeeId) setRollNumber(u.rollNumber || u.employeeId || "");
        setRole("Principal");
        setMessage("Loaded your Principal profile details. Modify any fields and submit to update.");
      }
    } catch (err: any) {
      console.error("Failed to fill profile:", err);
      setError("Unable to auto-fill your profile details.");
    }
  };

  const getRoleEnum = (selectedRole: string) => {
    switch (selectedRole) {
      case "Super Admin":
        return "SUPER_ADMIN";
      case "Admin":
        return "ADMIN";
      case "Principal":
        return "PRINCIPAL";
      case "Teacher":
        return "TEACHER";
      case "Accountant":
      case "Staff":
        return "ACCOUNTANT";
      case "Student":
        return "STUDENT";
      case "User":
        return "USER";
      default:
        return "TEACHER";
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!fullName.trim() || !email.trim()) {
      setError("Please fill in all required fields (Full Name and Email Address).");
      return;
    }

    if (!isUpdatingSelf && !password) {
      setError("Please enter an initial password for the new account.");
      return;
    }

    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName =
        nameParts.slice(1).join(" ") ||
        (isUpdatingSelf ? currentUser?.lastName || "" : "User");
      const username = email
        .trim()
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const roleEnum = getRoleEnum(role);

      const payload: Record<string, any> = {
        name: fullName.trim(),
        firstName,
        lastName,
        username,
        email: email.trim().toLowerCase(),
        role: roleEnum,
        department: department.trim() || "General",
        className: className.trim() || department.trim(),
        section: section.trim(),
        rollNumber: rollNumber.trim(),
        phone: phone.trim(),
        dob: dob || undefined,
        birthDate: dob || undefined,
        gender: gender || "",
        maritalStatus: maritalStatus || "Unmarried",
        emergencyContact: emergencyContact.trim(),
        emergencyName: emergencyName.trim(),
        emergencyRelation: emergencyRelation.trim(),
        address: address.trim(),
      };

      if (password) {
        payload.password = password;
      }

      const res: any = await api.post("/users", payload);

      const returnedUser = res?.user || {};
      const wasUpdated = Boolean(res?.isUpdated || isUpdatingSelf);

      if (isUpdatingSelf) {
        // Synchronize local storage cache so My Profile, Topbar, and Sidebar immediately reflect the updates
        const mergedUser = {
          ...currentUser,
          ...returnedUser,
          name: fullName.trim(),
          firstName,
          lastName,
          phone: phone.trim(),
          gender,
          dob: dob || undefined,
          birthDate: dob || undefined,
          maritalStatus,
          emergencyContact: emergencyContact.trim(),
          emergencyName: emergencyName.trim(),
          emergencyRelation: emergencyRelation.trim(),
          address: address.trim(),
          department: department.trim() || currentUser?.department,
          className: className.trim() || department.trim() || currentUser?.className,
          section: section.trim() || currentUser?.section,
          rollNumber: rollNumber.trim() || currentUser?.rollNumber,
        };

        localStorage.setItem("eduflow-user", JSON.stringify(mergedUser));
        localStorage.setItem(
          "eduflow-profile",
          JSON.stringify({
            ...mergedUser,
            fullName: fullName.trim(),
          })
        );

        window.dispatchEvent(new Event("eduflow-user-change"));

        setMessage("Profile updated successfully! Updating your My Profile section...");
        setTimeout(() => {
          router.push("/profile");
        }, 1200);
      } else {
        setMessage(
          `Account ${wasUpdated ? "updated" : "created"} successfully for ${fullName} (${role})!`
        );
        setTimeout(() => {
          router.push("/admin/users");
        }, 1200);
      }
    } catch (err: any) {
      console.error("Account creation/update error:", err);
      setError(err.message || "Failed to process user account.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      if (isPrincipal) {
        router.push("/dashboard/principal");
      } else if (currentUser?.role?.toUpperCase() === "SUPER_ADMIN") {
        router.push("/dashboard/super-admin");
      } else {
        router.push("/admin/users");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 text-gray-900">
      <div className="w-full space-y-6">
        {/* Header - Full Size Like Attendance Dashboard */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-yellow-400 p-3 text-gray-950 shadow-sm">
                <UserPlus size={18} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-2xl">
                  Create New Account
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Add a user to your institution or fill details to update your profile.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Principal Profile Autofill */}
          {/* {isPrincipal && (
            <button
              type="button"
              onClick={fillPrincipalProfile}
              title="Click to populate form with your Principal profile information"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm font-semibold text-yellow-900 shadow-xs transition hover:bg-yellow-100 sm:self-auto cursor-pointer"
            >
              <UserRound size={16} className="text-yellow-700" />
              <span>Load My Principal Profile</span>
            </button>
          )} */}
        </div>

        {/* Main Form Container */}
        <form
          onSubmit={handleSubmit}
          className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Section 1: Personal & Profile Information */}
          <div className="border-b border-gray-100 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the user&apos;s basic details and profile information.
                </p>
              </div>
              {isUpdatingSelf && (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                  Updating Your Profile
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-semibold">
                  Full Name *
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <UserRound size={18} className="text-gray-400 shrink-0" />
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

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                  Email Address *
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Mail size={18} className="text-gray-400 shrink-0" />
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

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
                  Phone Number
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Phone size={18} className="text-gray-400 shrink-0" />
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

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="mb-2 block text-sm font-semibold">
                  Date of Birth
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Cake size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full py-3 text-sm outline-none text-gray-700"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="mb-2 block text-sm font-semibold">
                  Gender
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <UserRound size={18} className="text-gray-400 shrink-0" />
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-transparent py-3 text-sm outline-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Marital Status */}
              <div>
                <label htmlFor="maritalStatus" className="mb-2 block text-sm font-semibold">
                  Marital Status
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <UserRound size={18} className="text-gray-400 shrink-0" />
                  <select
                    id="maritalStatus"
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full bg-transparent py-3 text-sm outline-none cursor-pointer"
                  >
                    <option value="Unmarried">Unmarried</option>
                    <option value="Married">Married</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label htmlFor="emergencyContact" className="mb-2 block text-sm font-semibold">
                  Emergency Contact
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Phone size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="emergencyContact"
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Enter emergency contact number"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Emergency Person Name */}
              <div>
                <label htmlFor="emergencyName" className="mb-2 block text-sm font-semibold">
                  Emergency Person Name
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <UserRound size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="emergencyName"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Ramesh Sahu"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Emergency Person Relation */}
              <div>
                <label htmlFor="emergencyRelation" className="mb-2 block text-sm font-semibold">
                  Emergency Person Relation
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <UserRound size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="emergencyRelation"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="e.g. Father, Mother, Spouse"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Department / Class */}
              <div>
                <label htmlFor="department" className="mb-2 block text-sm font-semibold">
                  Department / Class
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <BriefcaseBusiness size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="department"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      if (!className) setClassName(e.target.value);
                    }}
                    placeholder="e.g. Computer Science or Class 10"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Section */}
              <div>
                <label htmlFor="section" className="mb-2 block text-sm font-semibold">
                  Section
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Layers size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A, B, or Section 1"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Roll Number */}
              <div>
                <label htmlFor="rollNumber" className="mb-2 block text-sm font-semibold">
                  Roll Number
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <Hash size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. STU101 or 25"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Current Address */}
              <div className="sm:col-span-2">
                <label htmlFor="address" className="mb-2 block text-sm font-semibold">
                  Current Address
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <MapPin size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full residential address"
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Account Information - Preserved Unchanged */}
          <div className="border-b border-gray-100 p-5 sm:p-7">
            <h2 className="font-bold">Account Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose the role and initial password.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-semibold">
                  Account Role *
                </label>
                <select
                  id="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400 cursor-pointer"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Student">Student</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Principal">Principal</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  User accounts will be saved securely into database with verified access permissions.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold">
                  {isUpdatingSelf ? "Change Password (optional)" : "Initial Password *"}
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-yellow-400">
                  <LockKeyhole size={18} className="text-gray-400 shrink-0" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required={!isUpdatingSelf}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isUpdatingSelf
                        ? "Leave blank to keep existing password"
                        : "Minimum 6 characters"
                    }
                    className="w-full py-3 text-sm outline-none"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div
              role="alert"
              className="mx-5 mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800 sm:mx-7"
            >
              <AlertCircle size={19} className="shrink-0 text-red-600" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mx-5 mt-5 flex items-start gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-800 sm:mx-7"
            >
              <CheckCircle2 size={19} className="shrink-0 text-green-600" />
              <p>{message}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap justify-end gap-3 bg-gray-50 p-5 sm:p-7">
            <Link
              href="/admin/users"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-500 disabled:opacity-50 cursor-pointer shadow-sm transition"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isUpdatingSelf ? "Updating Profile..." : "Creating Account..."}</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>{isUpdatingSelf ? "Update Profile" : "Create Account"}</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-gray-400">
          EduFlow ERP · User Account &amp; Profile Management
        </p>
      </div>
    </div>
  );
}
