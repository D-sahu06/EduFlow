
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Mail,
  Send,
  Trash2,
  X,
  MessageSquare,
  Eye,
} from "lucide-react";

type Message = {
  id: number;
  recipient: string;
  email: string;
  subject: string;
  content: string;
  date: string;
  status: "Sent" | "Draft";
};

const initialMessages: Message[] = [
  {
    id: 1,
    recipient: "Aarav Sharma",
    email: "aarav@example.com",
    subject: "Assignment Submission Reminder",
    content:
      "Please submit your pending assignments before the due date.",
    date: "2026-10-24",
    status: "Sent",
  },
  {
    id: 2,
    recipient: "Ananya Verma",
    email: "ananya@example.com",
    subject: "Parent-Teacher Meeting",
    content:
      "This is a reminder about the upcoming parent-teacher meeting.",
    date: "2026-10-23",
    status: "Sent",
  },
  {
    id: 3,
    recipient: "Rahul Patel",
    email: "rahul@example.com",
    subject: "Fee Payment Reminder",
    content:
      "Please contact the school office regarding your pending fee.",
    date: "2026-10-22",
    status: "Draft",
  },
];

export default function MessagesPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);

  const [form, setForm] = useState({
    recipient: "",
    email: "",
    subject: "",
    content: "",
  });

  const filteredMessages = messages.filter((message) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      message.recipient,
      message.email,
      message.subject,
    ].some((value) => value.toLowerCase().includes(query));

    const matchesFilter =
      filter === "All" || message.status === filter;

    return matchesSearch && matchesFilter;
  });

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newMessage: Message = {
      id: Date.now(),
      ...form,
      date: new Date().toISOString().slice(0, 10),
      status: "Sent",
    };

    setMessages((current) => [newMessage, ...current]);
    setForm({
      recipient: "",
      email: "",
      subject: "",
      content: "",
    });
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this message?")) {
      setMessages((current) =>
        current.filter((message) => message.id !== id)
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-amber-400 hover:bg-amber-50"
      >
        <ArrowLeft size={17} />
        Back
      </button>

      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          {/* <p className="mb-1 text-sm text-slate-500">
            Communication / Messages
          </p> */}
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Messages
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage and review communication records.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-900 hover:bg-amber-500"
        >
          <Plus size={19} />
          Compose Message
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Messages</p>
            <MessageSquare className="text-amber-600" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold">{messages.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Sent Messages</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600">
            {messages.filter((m) => m.status === "Sent").length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Draft Messages</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">
            {messages.filter((m) => m.status === "Draft").length}
          </p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient or subject..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-amber-400"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-400"
        >
          <option value="All">All Messages</option>
          <option value="Sent">Sent</option>
          <option value="Draft">Drafts</option>
        </select>
      </div>

      {/* Messages list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">Message Records</h2>
          <span className="text-sm text-slate-500">
            {filteredMessages.length} records
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-amber-50/30 sm:flex-row sm:items-center"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Mail size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {message.subject}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      message.status === "Sent"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {message.status}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  To: {message.recipient} ({message.email})
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {message.content}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {message.date}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setSelectedMessage(message)}
                  title="View message"
                  className="rounded-lg border border-slate-200 p-2.5 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Eye size={17} />
                </button>
                <button
                  onClick={() => handleDelete(message.id)}
                  title="Delete message"
                  className="rounded-lg border border-slate-200 p-2.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}

          {filteredMessages.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500">
              No messages found.
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-6 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Compose Message
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter recipient and message details.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Recipient Name
                </label>
                <input
                  required
                  value={form.recipient}
                  onChange={(e) =>
                    setForm({ ...form, recipient: e.target.value })
                  }
                  placeholder="Enter recipient name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Recipient Email
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="recipient@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Subject
                </label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder="Enter message subject"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Write your message..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-amber-500"
                >
                  <Send size={17} />
                  Save Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View message modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-6 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Message Details
              </h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs text-slate-500">Subject</p>
                <p className="mt-1 font-semibold">
                  {selectedMessage.subject}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Recipient</p>
                <p className="mt-1">{selectedMessage.recipient}</p>
                <p className="text-sm text-slate-500">
                  {selectedMessage.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Message</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedMessage.content}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date / Status</p>
                <p className="mt-1 text-sm">
                  {selectedMessage.date} · {selectedMessage.status}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                onClick={() => setSelectedMessage(null)}
                className="rounded-xl bg-amber-400 px-5 py-2.5 font-semibold hover:bg-amber-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
