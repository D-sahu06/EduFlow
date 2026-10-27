
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Eye,
//   EyeOff,
//   Building2,
//   ShieldCheck,
//   ArrowRight,
// } from "lucide-react";

// export default function LoginPage() {
//   const router = useRouter();

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   function handleLogin(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setError("");
//     setLoading(true);

//     // Demo-only credentials. Replace with a real backend login API.
//     if (username.trim() === "admin" && password === "Admin@123") {
//   localStorage.setItem("eduflow-demo-auth", "true");
//   router.replace("/admin");
//   return;
// }

//     setError("Invalid username or password. Please try again.");
//     setLoading(false);
//   }

//   return (
//     <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcf9] px-4 py-10">
//       {/* Decorative background */}
//       <div className="pointer-events-none absolute inset-0 overflow-hidden">
//         <div className="absolute -left-40 -top-36 h-110 w-110 rounded-full border-35 border-yellow-100/70" />
//         <div className="absolute -left-32 -top-28 h-97.5 w-97.5 rounded-full border-2 border-yellow-200/60" />
//         <div className="absolute -bottom-64 -right-36 h-150 w-150 rounded-full border-45 border-yellow-100/70" />
//         <div className="absolute -bottom-52 -right-28 h-120 w-120 rounded-full border-2 border-yellow-200/60" />
//         <div className="absolute left-1/2 top-1/2 h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />
//       </div>

//       {/* Login card */}
//       <section className="relative z-10 w-full max-w-107.5 rounded-2xl border border-slate-100 bg-white/95 px-7 py-9 shadow-xl shadow-slate-200/30 sm:px-10 sm:py-10">
//         {/* Logo */}
//         <div className="mb-10 flex justify-center">
//           <div className="flex items-center gap-3">
//             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-slate-900 shadow-sm">
//               <Building2 size={29} strokeWidth={2.2} />
//             </div>
//             <div>
//               <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
//                 EduFlow<span className="text-yellow-500"> ERP</span>
//               </h1>
//               <p className="text-[11px] font-medium tracking-[0.18em] text-slate-500">
//                 MANAGEMENT SYSTEM
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="text-center">
//           <h2 className="text-2xl font-bold tracking-tight text-slate-900">
//             Welcome back!
//           </h2>
          
//         </div>

//         <form onSubmit={handleLogin} className="mt-8 space-y-5">
//           <div>
//             <label
//               htmlFor="username"
//               className="mb-2 block text-sm font-semibold text-slate-800"
//             >
//               Username
//             </label>
//             <input
//               id="username"
//               name="username"
//               type="text"
//               autoComplete="username"
//               placeholder="Enter your username"
//               value={username}
//               onChange={(event) => setUsername(event.target.value)}
//               required
//               className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="mb-2 block text-sm font-semibold text-slate-800"
//             >
//               Password
//             </label>
//             <div className="relative">
//               <input
//                 id="password"
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="current-password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(event) => setPassword(event.target.value)}
//                 required
//                 className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
//               />
//               <button
//                 type="button"
//                 aria-label={showPassword ? "Hide password" : "Show password"}
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-900"
//               >
//                 {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
//               </button>
//             </div>
//           </div>

//           {error && (
//             <p
//               role="alert"
//               className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700"
//             >
//               {error}
//             </p>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70"
//           >
//             {loading ? "Signing in..." : "Login In"}
//             {!loading && <ArrowRight size={17} />}
//           </button>

//           <p className="text-center hover:underline hover:text-yellow-400 cursor-pointer">Forget Password</p>
//         </form>

//         {/* Demo credentials */}
//         <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
//           <div className="flex items-center gap-2">
//             <ShieldCheck size={19} className="text-yellow-700" />
//             <p className="text-sm font-bold text-slate-800">
//               Demo Admin Login
//             </p>
//           </div>
//           <div className="mt-3 space-y-2 text-sm text-slate-600">
//             <p>
//               Username:{" "}
//               <span className="font-semibold text-slate-900">admin</span>
//             </p>
//             <p>
//               Password:{" "}
//               <span className="font-semibold text-slate-900">Admin@123</span>
//             </p>
//           </div>
//           <button
//             type="button"
//             onClick={() => {
//               setUsername("admin");
//               setPassword("Admin@123");
//               setError("");
//             }}
//             className="mt-3 text-sm font-bold text-yellow-800 underline decoration-yellow-400 underline-offset-4 hover:text-slate-900"
//           >
//             Use demo credentials
//           </button>
//         </div>

//         <p className="mt-7 text-center text-xs leading-5 text-slate-400">
//           Authorized access only. Contact your administrator if you need
//           assistance.
//         </p>
//       </section>
//     </main>
//   );
// }


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  ArrowRight,
  UserRound,
} from "lucide-react";

type UserRole = "admin" | "student" | "teacher";

type SavedUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const enteredUsername = username.trim().toLowerCase();

      // Admin demo login
      if (role === "admin") {
        if (
          enteredUsername === "admin" &&
          password === "Admin@123"
        ) {
          const adminUser = {
            username: "admin",
            fullName: "Administrator",
            role: "admin",
          };

          localStorage.setItem("eduflow-demo-auth", "true");
          localStorage.setItem(
            "eduflow-user",
            JSON.stringify(adminUser)
          );

          router.replace("/admin");
          return;
        }

        setError("Invalid admin username or password.");
        setLoading(false);
        return;
      }

      // Student and teacher login:
      // These accounts must already exist in eduflow-users.
      const savedUsers = localStorage.getItem("eduflow-users");
      const users: SavedUser[] = savedUsers
        ? JSON.parse(savedUsers)
        : [];

      const matchedUser = users.find((user) => {
        const userRole = String(user.role ?? "").toLowerCase();

        const matchesRole = userRole === role;
        const matchesUsername =
          String(user.username ?? "").trim().toLowerCase() ===
            enteredUsername ||
          String(user.email ?? "").trim().toLowerCase() ===
            enteredUsername;

        const matchesPassword = user.password === password;
        const isActive =
          !user.status ||
          ["active", "approved"].includes(
            String(user.status).toLowerCase()
          );

        return (
          matchesRole &&
          matchesUsername &&
          matchesPassword &&
          isActive
        );
      });

      if (!matchedUser) {
        setError(
          `Invalid ${role} credentials, or this account has not been created by the admin.`
        );
        setLoading(false);
        return;
      }

      const loggedInUser = {
        ...matchedUser,
        role,
      };

      // Save the logged-in user's details for the UI.
      localStorage.setItem(
        "eduflow-user",
        JSON.stringify(loggedInUser)
      );

      localStorage.setItem("eduflow-demo-auth", "true");

      // Send users to their respective dashboards.
      if (role === "student") {
        router.replace("/student");
      } else {
        router.replace("/teacher");
      }
    } catch {
      setError(
        "Unable to sign in. Please check your saved account data."
      );
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
            Sign in to your EduFlow account
          </p>
        </div>

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
                <option value="admin">Administrator</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {role === "admin"
                ? "Manage users and the ERP system."
                : role === "student"
                ? "Sign in to view your student dashboard."
                : "Sign in to view your teacher dashboard."}
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

              <button
                type="button"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-900"
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
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
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Log In"}
            {!loading && <ArrowRight size={17} />}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/forgot-password")
            }
            className="w-full cursor-pointer text-center text-sm text-slate-500 transition hover:text-yellow-600 hover:underline"
          >
            Forgot Password?
          </button>
        </form>

        {/* Demo credentials: admin only */}
        {role === "admin" && (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={19} className="text-yellow-700" />
              <p className="text-sm font-bold text-slate-800">
                Demo Admin Login
              </p>
            </div>

            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                Username:{" "}
                <span className="font-semibold text-slate-900">
                  admin
                </span>
              </p>
              <p>
                Password:{" "}
                <span className="font-semibold text-slate-900">
                  Admin@123
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUsername("admin");
                setPassword("Admin@123");
                setError("");
              }}
              className="mt-3 text-sm font-bold text-yellow-800 underline decoration-yellow-400 underline-offset-4 hover:text-slate-900"
            >
              Use demo credentials
            </button>
          </div>
        )}

        <p className="mt-7 text-center text-xs leading-5 text-slate-400">
          Authorized access only. Contact your administrator if you need
          assistance.
        </p>
      </section>
    </main>
  );
}

