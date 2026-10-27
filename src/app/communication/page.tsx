
"use client";

import { useRouter } from "next/navigation";
import {
  Megaphone,
  Mail,
  BellRing,
  CalendarDays,
  ArrowUpRight,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

const features = [
  {
    title: "Announcements",
    description:
      "Create and manage important notices for students, teachers and staff.",
    icon: Megaphone,
    color: "bg-amber-100 text-amber-700",
    route: "/communication/announcements",
    count: "Manage notices",
  },
  {
    title: "Messages",
    description:
      "Manage communication records and messages from the admin panel.",
    icon: Mail,
    color: "bg-blue-100 text-blue-700",
    route: "/communication/messages",
    count: "View messages",
  },
  {
    title: "Notifications",
    description:
      "Review important alerts and notification records.",
    icon: BellRing,
    color: "bg-emerald-100 text-emerald-700",
    route: "/communication/notifications",
    count: "View alerts",
  },
  {
    title: "Events & Calendar",
    description:
      "Organize school events and keep track of upcoming activities.",
    icon: CalendarDays,
    color: "bg-purple-100 text-purple-700",
    route: "/communication/events",
    count: "Manage events",
  },
];

export default function CommunicationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
      >
        <ArrowLeft size={17} />
        Back 
      </button>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
          <MessageSquare size={26} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            ERP / Communication
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Communication Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage announcements, messages, notifications and events.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Announcements</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
          <p className="mt-2 text-xs text-slate-400">
            Notices created in the system
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Messages</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
          <p className="mt-2 text-xs text-slate-400">
            Communication records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Notifications</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
          <p className="mt-2 text-xs text-slate-400">
            Alerts recorded
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Upcoming Events</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
          <p className="mt-2 text-xs text-slate-400">
            Scheduled activities
          </p>
        </div>
      </div>

      {/* Communication Modules */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Communication Modules
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a module to manage its records.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <button
              key={feature.title}
              type="button"
              onClick={() => router.push(feature.route)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className={`rounded-xl p-3 ${feature.color}`}>
                  <Icon size={25} />
                </div>

                <ArrowUpRight
                  size={20}
                  className="text-slate-400 transition group-hover:text-amber-600"
                />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-2 min-h-15 text-sm leading-6 text-slate-500">
                {feature.description}
              </p>

              <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-amber-700">
                {feature.count} →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
