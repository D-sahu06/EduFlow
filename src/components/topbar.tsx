
"use client";

import {
  Search,
  Bell,
  ChevronDown,
  Sun,
} from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 md:px-8 ">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Welcome to EduFlow
        </h2>
        {/* <p className="text-sm text-gray-500">
          Education management made simple
        </p> */}
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

        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 font-bold text-gray-800">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">
              Admin User
            </p>
            {/* <p className="text-xs text-gray-500">Administrator</p> */}
          </div>

          <ChevronDown size={16} className="hidden text-gray-500 sm:block" />
        </div>
      </div>
    </header>
  );
}
