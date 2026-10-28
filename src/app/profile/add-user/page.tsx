"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import Image from "next/image";
import {
  X,
  UserRound,
  BriefcaseBusiness,
  FileText,
  Camera,
  Save,
  CalendarDays,
  
  Phone,
  Building2,
  GraduationCap,
  MapPin,
  // ShieldCheck,
  // Upload,
} from "lucide-react";

type Tab = "personal" | "employment" | "documents";

type Profile = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  birthDate: string;
  phone: string;
  gender: string;
  status:string,
  emergencyContact: string;
  emergencyRelation: string;
  emergencyName: string;
  address: string;
  joiningDate: string;
  department: string;
  designation: string;
  manager:string,
  employeeId: string;
  employmentType: string;
  institution: string;
  qualification: string;
  documentName: string;
  documentNumber: string;
  profileImage: string;
  panNumber: string,
aadhaarNumber: string;
bankName: string;
ifscCode: string;
accountHolderName: string;
bankAccountNumber: string;
};

const defaultProfile: Profile = {
  firstName: "Dewansh",
  lastName: "Sahu",
  username: "dewansh.sahu",
  email: "dewanshsahu89@gmail.com",
  birthDate: "2005-07-09",
  phone: "7869135957",
  gender: "Male",
  manager:"",
  status:"Unmarried",
  emergencyContact: "",
  emergencyRelation: "",
  emergencyName: "",
  address: "",
  joiningDate: "2026-10-19",
  department: "",
  designation: "",
  employeeId: "",
  employmentType: "",
  institution: "",
  qualification: "",
  documentName: "",
  documentNumber: "",
  profileImage: "",
  panNumber:"",
  aadhaarNumber: "",
  bankName:"",
  ifscCode: "",
  accountHolderName: "",
  bankAccountNumber: "",
};

const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
  { id: "personal", label: "Personal", icon: UserRound },
  { id: "employment", label: "Employment", icon: BriefcaseBusiness },
  { id: "documents", label: "Documents", icon: FileText },
];

export default function EditProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [form, setForm] = useState<Profile>(defaultProfile);
  const [ready, setReady] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
  let cancelled = false;

  async function loadProfile() {
    let loadedProfile = defaultProfile;

    try {
      const saved = localStorage.getItem("eduflow-profile");

      if (saved) {
        loadedProfile = {
          ...defaultProfile,
          ...JSON.parse(saved),
        };
      }
    } catch {
      loadedProfile = defaultProfile;
    }

    if (!cancelled) {
      setForm(loadedProfile);
      setReady(true);
    }
  }

  loadProfile();

  return () => {
    cancelled = true;
  };
}, []);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSavedMessage("");
  }

  function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSavedMessage("Please select an image file.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setSavedMessage("Please choose an image smaller than 1 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        profileImage: String(reader.result),
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      localStorage.setItem("eduflow-profile", JSON.stringify(form));
      router.push("/profile");
    } catch {
      setSavedMessage(
        "Could not save changes. Try using a smaller profile image."
      );
    }
  }

  const fullName =
    `${form.firstName} ${form.lastName}`.trim() || "Admin User";

    return (
  <div className="min-h-screen bg-slate-50">
    <Sidebar />
    <div className="min-w-0 md:ml-64">
      <Topbar />
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Edit Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal information and employment details.
          </p>
        </div>

        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-3 sm:p-6">
          <section className="flex max-h-[94vh] w-130 max-w-212.50 flex-col overflow-hidden rounded-xl border-r-4 border-r-green-600 bg-white shadow-2xl">
          
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Edit Profile
                </h2>
               
              </div>

              <button
                type="button"
                aria-label="Close edit profile"
                onClick={() => router.push("/profile")}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="px-5 pb-5 pt-4 sm:px-7">
                <div className="flex flex-col items-center">
                  <label
                    htmlFor="profileImage"
                    className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100"
                  >
                    {form.profileImage ? (
                      <Image
                          src={form.profileImage}
                          alt="Profile"
                          width={112}
                          height={112}
                          unoptimized
                          className="h-full w-full object-cover"
                          />
                          ) : (
                      <span className="text-3xl font-bold text-slate-600">
                        {form.firstName[0]}
                        {form.lastName[0]}
                      </span>
                    )}

                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                      <Camera size={24} />
                    </span>
                  </label>

                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto}
                    className="sr-only"
                  />

                  <label
                    htmlFor="profileImage"
                    className="mt-2 cursor-pointer text-sm text-slate-500 hover:text-green-700"
                  >
                    Click to upload profile image
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Image size up to 1 MB
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const selected = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-2 rounded-lg px-10 py-3 text-sm font-medium transition  ${
                          selected
                            ? "bg-white text-yellow-400 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Icon size={17} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {!ready ? (
                  <div className="py-12 text-center text-sm text-slate-500">
                    Loading profile...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 py-2 sm:grid-cols-2">
                    {activeTab === "personal" && (
                      <>
                        <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
                        <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
                        <Field label="Username" name="username" value={form.username} onChange={handleChange} required />
                        <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
                        <Field label="Date of Birth" name="birthDate" type="date" value={form.birthDate} onChange={handleChange} icon={<CalendarDays size={16} />} />
                        <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} icon={<Phone size={16} />} />
                        <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
                        <Field label="Emergency Contact" name="emergencyContact" type="tel" value={form.emergencyContact} onChange={handleChange} />
                        <Field label="Emergency Person Relation" name="emergencyRelation" value={form.emergencyRelation} onChange={handleChange} />
                        <Field label="Emergency Person Name" name="emergencyName" value={form.emergencyName} onChange={handleChange} />
                        <SelectField label="Maritial Status" name="status" value={form.status} onChange={handleChange} options={["Married", "Unmarried"]} />
                        <Field label="Address" name="address" value={form.address} onChange={handleChange} />
                        <div className="sm:col-span-2">
                          <Field label="Current Address" name="address" value={form.address} onChange={handleChange} icon={<MapPin size={16} />} />
                        </div>
                        
                      </>
                    )}

                    {activeTab === "employment" && (
                      <>
                        
                        <Field label="Date of Joining" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} icon={<CalendarDays size={16} />} />
                        { <Field label="Department" name="department" value={form.department} onChange={handleChange} icon={<Building2 size={16} />} /> }
                        <Field label="Designation" name="designation" value={form.designation} onChange={handleChange} icon={<BriefcaseBusiness size={16} />} />
                        <SelectField label="Employment Type" name="employmentType" value={form.employmentType} onChange={handleChange} options={["Full Time", "Part Time", "Contract", "Intern"]} />
                        <Field label="Institution" name="institution" value={form.institution} onChange={handleChange} icon={<GraduationCap size={16} />} />
                         { <SelectField label="Employment Type" name="employmentType" value={form.employmentType} onChange={handleChange} options={["Full Time", "Part Time", "Contract", "Intern"]} /> }
                        <Field label="Manager" name="manager" value={form.manager} onChange={handleChange} /> */
                        <div className="sm:col-span-2">
                          <Field label="Qualification" name="qualification" value={form.qualification} onChange={handleChange} />
                         </div> 
                      </>
                    )} 

                    {activeTab === "documents" && (
                      <>
                      
  <Field
  label="PAN Number"
  name="panNumber"
  value={form.panNumber}
  onChange={handleChange}
  
/>

<Field
  label="Aadhaar Number"
  name="aadhaarNumber"
  value={form.aadhaarNumber}
  onChange={handleChange}
 
/>

<Field
  label="Bank Name"
  name="bankName"
  value={form.bankName}
  onChange={handleChange}
  
/>

<Field
  label="IFSC Code"
  name="ifscCode"
  value={form.ifscCode}
  onChange={handleChange}
  />
 

<Field
  label="Account Holder Name"
  name="accountHolderName"
  value={form.accountHolderName}
  onChange={handleChange}
 
/>

<Field
  label="Bank Account Number"
  name="bankAccountNumber"
  value={form.bankAccountNumber}
  onChange={handleChange}

 /> 
                        
                      </>
                    )}
                  </div>
                )}

                {savedMessage && (
                  <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {savedMessage}
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                <button
                  type="submit"
                  disabled={!ready}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 w-full"
                >
                  <Save size={17} />
                  Update Account
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
      </div>
      </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  icon,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-800"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="flex items-center rounded-lg border border-green-300 bg-white transition focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100">
        {icon && <span className="ml-3 text-slate-400">{icon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full min-w-0 rounded-lg bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-800"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-green-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}