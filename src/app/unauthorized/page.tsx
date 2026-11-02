
"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX size={34} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Access Denied
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          You dont have permission to access this page.
          Please contact your administrator if you need access.
        </p>

        <Link
          href="/admin"
          className="mt-6 inline-flex rounded-lg bg-yellow-300 px-6 py-3 text-sm font-bold text-black hover:bg-yellow-400"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
