
// "use client";

// import {
//   Search,
//   Bell,
//   ChevronDown,
//   Sun,
// } from "lucide-react";

// export default function Topbar() {
//   return (
//     <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 md:px-8 ">
//       <div>
//         <h2 className="text-lg font-bold text-gray-900">
//           Welcome to EduFlow
//         </h2>
//         <p className="text-sm text-gray-500">
//           Education management made simple
//         </p>
//       </div>

//       <div className="flex items-center gap-3">
//         <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex">
//           <Search size={18} className="text-gray-400" />
//           <input
//             type="search"
//             placeholder="Search anything..."
//             className="w-40 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 md:w-52"
//           />
//           <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400">
//             /
//           </kbd>
//         </div>

//         <button
//           type="button"
//           aria-label="Light theme"
//           className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-yellow-50"
//         >
//           <Sun size={19} />
//         </button>

//         <button
//           type="button"
//           aria-label="Notifications"
//           className="relative rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-yellow-50"
//         >
//           <Bell size={19} />
//           <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400 ring-2 ring-white" />
//         </button>

//         <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 font-bold text-gray-800">
//             A
//           </div>

//           <div className="hidden sm:block">
//             <p className="text-sm font-semibold text-gray-900">
//               Admin User
//             </p>
//             {/* <p className="text-xs text-gray-500">Administrator</p> */}
//           </div>

//           <ChevronDown size={16} className="hidden text-gray-500 sm:block" />
//         </div>
//       </div>
//     </header>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Bell,
  ChevronDown,
  Sun,
  X,
  UserRound,
  LogOut,
  ChevronRight,
} from "lucide-react";

type User = {
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: string;
  profileImage?: string;
  avatar?: string;
};

export default function Topbar() {
  const router = useRouter();

  const [user, setUser] = useState<User>({
    name: "Admin User",
    role: "Admin",
  });

  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    // Read the currently logged-in user's saved data.
    const loadUser = () => {
      try {
        const savedUser =
          localStorage.getItem("edunexus-user") ||
          localStorage.getItem("eduflow-user") ||
          localStorage.getItem("currentUser") ||
          localStorage.getItem("user");

        if (savedUser) {
          const parsed = JSON.parse(savedUser) as User;
          setUser(parsed);
        }
      } catch (error) {
        console.error("Unable to load user details:", error);
      }
    };

    loadUser();
  }, []);

  const displayName =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    "User";

  const role = user.role || "User";
  const profileImage = user.profileImage || user.avatar;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleManageAccount = () => {
    setAccountOpen(false);
    router.push("/profile");
  };

  const handleLogout = () => {
    // Clear demo authentication data.
    [
      "edunexus-user",
      "eduflow-user",
      "currentUser",
      "user",
      "token",
      "access_token",
    ].forEach((key) => localStorage.removeItem(key));

    setAccountOpen(false);
    router.push("/");
  };

  return (
    <>
      <header className="relative z-30 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 md:px-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Welcome to EduFlow
          </h2>
          <p className="text-sm text-gray-500">
            Education management made simple
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex">
            <Search size={18} className="text-gray-400" />

            <input
              type="search"
              placeholder="Search anything..."
              className="w-40 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 md:w-52"
            />

            <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400">
              /
            </kbd>
          </div>

          <button
            type="button"
            aria-label="Light theme"
            className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-yellow-50"
          >
            <Sun size={19} />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-yellow-50"
          >
            <Bell size={19} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400 ring-2 ring-white" />
          </button>

          {/* Logged-in user */}
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-label="Open account panel"
            aria-expanded={accountOpen}
            className="flex items-center gap-2 border-l border-gray-200 pl-3 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-200 bg-yellow-100 font-bold text-gray-800">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || "U"
              )}
            </div>

            <div className="hidden sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-gray-900">
                {displayName}
              </p>
              <p className="text-xs capitalize text-gray-500">
                {role}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-gray-500 sm:block"
            />
          </button>
        </div>
      </header>

      {/* Dark backdrop */}
      {accountOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70"
          onClick={() => setAccountOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Right-side Account Panel */}
      <aside
  aria-label="Account panel"
  aria-hidden={!accountOpen}
  className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
    accountOpen ? "translate-x-0" : "translate-x-full"
  }`}
>

        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Account
          </h2>

          <button
            type="button"
            onClick={() => setAccountOpen(false)}
            aria-label="Close account panel"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={21} />
          </button>
        </div>

        {/* User details */}
        <div className="flex flex-col items-center px-6 pb-7 pt-8">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-green-50 bg-yellow-100 text-3xl font-bold text-gray-800">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={displayName}
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              initials || "U"
            )}
          </div>

          <h3 className="mt-4 max-w-full wrap-break-words text-center text-xl font-semibold text-gray-900">
            {displayName}
          </h3>

          <p className="mt-1 capitalize text-gray-500">
            {role}
          </p>

          {user.email && (
            <p className="mt-2 max-w-full break-all text-sm text-gray-500">
              {user.email}
            </p>
          )}
        </div>

        <div className="mx-6 border-t border-gray-200" />

        {/* Manage Account */}
        <div className="flex-1 px-6 py-7">
          <button
            type="button"
            onClick={handleManageAccount}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-green-300 hover:bg-green-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
              <UserRound size={22} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-gray-900">
                Manage Account
              </span>
              <span className="mt-0.5 block text-sm text-gray-500">
                View and edit your profile
              </span>
            </span>

            <ChevronRight size={21} className="text-gray-500" />
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 border-t border-gray-200 p-6">
          <button
            type="button"
            onClick={() => setAccountOpen(false)}
            className="flex-1 rounded-lg border border-green-500 px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-green-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            <LogOut size={17} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
