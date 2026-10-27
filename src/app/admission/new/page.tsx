
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
} from "lucide-react";

export default function NewAdmissionPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

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
    course: "",
    previousSchool: "",
    qualification: "",
    percentage: "",
    passingYear: "",
    applicationDate: new Date().toISOString().slice(0, 10),
    documents: [] as File[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(
    field: string,
    value: string | File[]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitted(false);
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";

    if (!form.dob) {
      nextErrors.dob = "Date of birth is required.";
    } else if (form.dob > new Date().toISOString().slice(0, 10)) {
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
      nextErrors.parentName = "Parent/guardian name is required.";
    }

    if (!/^[6-9]\d{9}$/.test(form.parentPhone)) {
      nextErrors.parentPhone = "Enter a valid 10-digit mobile number.";
    }

    if (!form.course) nextErrors.course = "Please select a course.";
    if (!form.qualification) {
      nextErrors.qualification = "Select the previous qualification.";
    }

    if (form.percentage === "") {
      nextErrors.percentage = "Percentage is required.";
    } else if (
      !Number.isFinite(Number(form.percentage)) ||
      Number(form.percentage) < 0 ||
      Number(form.percentage) > 100
    ) {
      nextErrors.percentage = "Percentage must be between 0 and 100.";
    }

    if (
      !/^\d{4}$/.test(form.passingYear) ||
      Number(form.passingYear) > new Date().getFullYear()
    ) {
      nextErrors.passingYear = "Enter a valid passing year.";
    }

    if (!form.applicationDate) {
      nextErrors.applicationDate = "Application date is required.";
    } else if (form.applicationDate > new Date().toISOString().slice(0, 10)) {
      nextErrors.applicationDate = "Application date cannot be in the future.";
    }

    if (form.documents.length === 0) {
      nextErrors.documents = "Upload at least one supporting document.";
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    // Demo only: records are not yet connected to a database.
    setSubmitted(true);
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
      course: "",
      previousSchool: "",
      qualification: "",
      percentage: "",
      passingYear: "",
      applicationDate: new Date().toISOString().slice(0, 10),
      documents: [],
    });
    setErrors({});
    setSubmitted(false);
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";

  function errorText(field: string) {
    return errors[field] ? (
      <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
    ) : null;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-7">
        <p className="mb-2 text-sm text-gray-500">
          EduFlow / Admission / New Admission
        </p>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          New Admission
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter applicant information to create a new admission application.
        </p>
      </div>

      {submitted && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 text-green-700" size={22} />
          <div>
            <p className="font-semibold text-green-800">
              Form validation successful!
            </p>
            <p className="mt-1 text-sm text-green-700">
              The form is valid, but this demo has not saved the application
              to a database. Connect the backend to create a real application.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-800">
              <UserRound size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Personal Information
              </h2>
              <p className="text-sm text-gray-500">
                Applicant basic details
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
                <option value="Prefer not to say">Prefer not to say</option>
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
              <select
                className={inputClass}
                value={form.course}
                onChange={(e) => updateField("course", e.target.value)}
              >
                <option value="">Select course</option>
                <option value="B.Tech - IT">B.Tech - IT</option>
                <option value="B.Tech - CSE">B.Tech - CSE</option>
                <option value="B.Tech - Mechanical">B.Tech - Mechanical</option>
                <option value="BBA">BBA</option>
                <option value="BCA">BCA</option>
                <option value="MBA">MBA</option>
                <option value="MCA">MCA</option>
              </select>
              {errorText("course")}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Previous Qualification *
              </label>
              <select
                className={inputClass}
                value={form.qualification}
                onChange={(e) => updateField("qualification", e.target.value)}
              >
                <option value="">Select qualification</option>
                <option value="10th">10th</option>
                <option value="12th">12th</option>
                <option value="Diploma">Diploma</option>
                <option value="Graduation">Graduation</option>
                <option value="Post Graduation">Post Graduation</option>
              </select>
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

          <label className="block rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition hover:border-yellow-400">
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
              className="mt-4 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-100 file:px-4 file:py-2 file:font-semibold file:text-gray-800"
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
                    className="shrink-0 text-red-600 hover:text-red-700"
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
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Reset Form
          </button>

          <button
            type="submit"
            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-500"
          >
            Validate Application
          </button>
        </div>
      </form>
    </main>
  );
}
