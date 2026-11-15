"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  GraduationCap,
  Users,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export default function NewAdmissionPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignedAppNo, setAssignedAppNo] = useState("");
  const [apiError, setApiError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    parentName: "",
    parentPhone: "",
    parentRelation: "Father",
    parentEmail: "",
    course: "",
    previousSchool: "",
    percentage: "",
    passingYear: "",
    qualification: "",
    applicationDate: new Date().toISOString().slice(0, 10),
    documents: [] as File[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(field: string, value: string | File[]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitted(false);
    setApiError("");
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";

    if (!form.dob) {
      nextErrors.dob = "Date of birth is required.";
    } else if (new Date(form.dob) > new Date()) {
      nextErrors.dob = "Date of birth cannot be in the future.";
    }

    if (!form.gender) nextErrors.gender = "Please select gender.";

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!form.address.trim()) nextErrors.address = "Address is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.state.trim()) nextErrors.state = "State is required.";

    if (!form.parentName.trim()) {
      nextErrors.parentName = "Parent/Guardian name is required.";
    }

    if (!/^[6-9]\d{9}$/.test(form.parentPhone)) {
      nextErrors.parentPhone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!form.course.trim()) nextErrors.course = "Course applied for is required.";
    if (!form.qualification.trim()) {
      nextErrors.qualification = "Previous qualification is required.";
    }

    const percentage = Number(form.percentage);
    if (!form.percentage || Number.isNaN(percentage)) {
      nextErrors.percentage = "Percentage is required.";
    } else if (percentage < 0 || percentage > 100) {
      nextErrors.percentage = "Percentage must be between 0 and 100.";
    }

    const passingYear = Number(form.passingYear);
    const currentYear = new Date().getFullYear();
    if (!form.passingYear || Number.isNaN(passingYear)) {
      nextErrors.passingYear = "Passing year is required.";
    } else if (passingYear < 1950 || passingYear > currentYear) {
      nextErrors.passingYear = `Enter a year between 1950 and ${currentYear}.`;
    }

    if (!form.applicationDate) {
      nextErrors.applicationDate = "Application date is required.";
    } else if (new Date(form.applicationDate) > new Date()) {
      nextErrors.applicationDate = "Application date cannot be in the future.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setApiError("");

    try {
      const payload = {
        applicantName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        applyingForClass: form.course.trim(),
        previousQualification: form.qualification.trim(),
        previousSchool: form.previousSchool.trim() || "Not specified",
        previousPercentage: Number(form.percentage) || 0,
        guardianName: form.parentName.trim(),
        guardianPhone: form.parentPhone.trim(),
      };

      const res = await api.post("/admissions/apply", payload);

      if (res && res.success) {
        setAssignedAppNo(res.application?.applicationNumber || "APP-" + Date.now().toString().slice(-4));
        setSubmitted(true);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to submit application ");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm({
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      parentName: "",
      parentPhone: "",
      parentRelation: "Father",
      parentEmail: "",
      course: "",
      previousSchool: "",
      percentage: "",
      passingYear: "",
      qualification: "",
      applicationDate: new Date().toISOString().slice(0, 10),
      documents: [],
    });
    setErrors({});
    setSubmitted(false);
    setApiError("");
    setAssignedAppNo("");
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100";

  const errorText = (field: string) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
    ) : null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          New Admission Form
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter applicant details and submit the application.
        </p>
      </div>

      {submitted && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 text-green-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-green-900">
                Application Submitted Successfully!
              </p>
              <p className="mt-1 text-sm text-green-700">
                Application number: <strong>{assignedAppNo}</strong>. Saved to erp
              </p>
            </div>
          </div>
        </div>
      )}

      {apiError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-red-600 shrink-0" size={22} />
            <p className="text-sm font-medium text-red-700">{apiError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
              <UserRound size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Personal Details
              </h2>
              <p className="text-sm text-gray-500">
                Basic information about the student applicant
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                className={inputClass}
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Enter first name"
              />
              {errorText("firstName")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                className={inputClass}
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Enter last name"
              />
              {errorText("lastName")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className={inputClass}
                value={form.dob}
                onChange={(e) => updateField("dob", e.target.value)}
              />
              {errorText("dob")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errorText("gender")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="student@example.com"
              />
              {errorText("email")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Mobile Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                className={inputClass}
                value={form.phone}
                onChange={(e) =>
                  updateField("phone", e.target.value.replace(/\D/g, ""))
                }
                placeholder="10-digit mobile number"
              />
              {errorText("phone")}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-gray-700">
                Full Address *
              </label>
              <textarea
                rows={3}
                className={inputClass}
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="House number, street, area..."
              />
              {errorText("address")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City"
              />
              {errorText("city")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                State *
              </label>
              <input
                className={inputClass}
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State"
              />
              {errorText("state")}
            </div>
          </div>
        </section>

        {/* Parent information */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Parent / Guardian Details
              </h2>
              <p className="text-sm text-gray-500">
                Contact information for the parent or guardian
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Parent / Guardian Name *
              </label>
              <input
                className={inputClass}
                value={form.parentName}
                onChange={(e) => updateField("parentName", e.target.value)}
                placeholder="Enter parent name"
              />
              {errorText("parentName")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Parent Mobile Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                className={inputClass}
                value={form.parentPhone}
                onChange={(e) =>
                  updateField(
                    "parentPhone",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="10-digit mobile number"
              />
              {errorText("parentPhone")}
            </div>
          </div>
        </section>

        {/* Academic information */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Academic Information
              </h2>
              <p className="text-sm text-gray-500">
                Previous qualification and applied course
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Course Applied For *
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.course}
                onChange={(e) => updateField("course", e.target.value)}
                placeholder="e.g. B.Tech - IT, Class 10, BCA"
              />
              {errorText("course")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Previous Qualification *
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.qualification}
                onChange={(e) => updateField("qualification", e.target.value)}
                placeholder="e.g. 10th, 12th, Diploma, Graduation"
              />
              {errorText("qualification")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Previous School / College
              </label>
              <input
                className={inputClass}
                value={form.previousSchool}
                onChange={(e) => updateField("previousSchool", e.target.value)}
                placeholder="Institution name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Percentage / Marks * (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                className={inputClass}
                value={form.percentage}
                onChange={(e) => updateField("percentage", e.target.value)}
                placeholder="e.g. 85.5"
              />
              {errorText("percentage")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Passing Year *
              </label>
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                className={inputClass}
                value={form.passingYear}
                onChange={(e) => updateField("passingYear", e.target.value)}
                placeholder="e.g. 2025"
              />
              {errorText("passingYear")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Application Date *
              </label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className={inputClass}
                value={form.applicationDate}
                onChange={(e) =>
                  updateField("applicationDate", e.target.value)
                }
              />
              {errorText("applicationDate")}
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Supporting Documents
              </h2>
              <p className="text-sm text-gray-500">
                Select the documents provided by the applicant
              </p>
            </div>
          </div>

          <label className="block rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition hover:border-yellow-400 cursor-pointer">
            <FileText className="mx-auto mb-3 text-gray-400" size={30} />
            <span className="font-semibold text-gray-800">
              Choose supporting documents
            </span>
            <p className="mt-2 text-xs text-gray-500">
              PDF, JPG or PNG; maximum 5 MB per file
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-4 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-100 file:px-4 file:py-2 file:font-semibold file:text-gray-800 cursor-pointer"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                const valid = files.filter(
                  (file) =>
                    file.size <= 5 * 1024 * 1024 &&
                    /\.(pdf|jpe?g|png)$/i.test(file.name)
                );

                updateField("documents", valid);

                if (valid.length !== files.length) {
                  setErrors((current) => ({
                    ...current,
                    documents: "Some files were skipped. Use PDF/JPG/PNG files up to 5 MB each.",
                  }));
                }
              }}
            />
          </label>

          {form.documents.length > 0 && (
            <ul className="mt-4 space-y-2">
              {form.documents.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "documents",
                        form.documents.filter((_, i) => i !== index)
                      )
                    }
                    className="shrink-0 text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {errorText("documents")}
        </section>

        {/* Form actions */}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Saving Application...</span>
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
