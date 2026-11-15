"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type RecipientTargetRole =
  | "INDIVIDUAL"
  | "ALL"
  | "STUDENT"
  | "TEACHER"
  | "ACCOUNTANT"
  | "HOD";

type RecipientOption = {
  _id?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
};

type Message = {
  id: string | number;
  senderId?: string;
  recipient: string;
  email: string;
  recipientRole?: RecipientTargetRole;
  senderName?: string;
  senderRole?: string;
  subject: string;
  content: string;
  date: string;
  status: "Sent" | "Draft";
};

const TARGET_LABELS: Record<RecipientTargetRole, string> = {
  ALL: "All Users (Teachers, Students & Accountants)",
  TEACHER: "All Teachers",
  STUDENT: "All Students",
  ACCOUNTANT: "All Accountants",
  HOD: "All HODs",
  INDIVIDUAL: "Specific Recipient",
};

export default function MessagesPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [userRole, setUserRole] = useState<string>("STUDENT");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);

  const [form, setForm] = useState({
    recipientRole: "ALL" as RecipientTargetRole,
    recipientUserId: "",
    recipient: "",
    email: "",
    subject: "",
    content: "",
  });

  const canCompose = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(userRole);

  const canDeleteMessage = (message: Message) => {
    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole)) return true;
    return (
      userRole === "TEACHER" &&
      Boolean(currentUserId) &&
      message.senderId === currentUserId
    );
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<{ success?: boolean; messages?: any[] }>("/communication/messages");
      if (res && res.messages) {
        setMessages(
          res.messages.map((m: any) => ({
            id: m._id || m.id,
            senderId: m.sender ? String(m.sender) : "",
            recipient: m.recipient,
            email: m.recipientEmail || m.email || "",
            recipientRole: m.recipientRole || "INDIVIDUAL",
            senderName: m.senderName,
            senderRole: m.senderRole || "",
            subject: m.subject,
            content: m.content,
            date: m.createdAt ? m.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: m.status || "Sent",
          }))
        );
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load messages from server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await api.get<{ success?: boolean; recipients?: RecipientOption[] }>(
        "/communication/messages/recipients"
      );
      if (res && Array.isArray(res.recipients)) {
        setRecipients(res.recipients);
      }
    } catch {
      // Optional directory assist; manual entry remains available
    }
  };

  useEffect(() => {
    let resolvedRole = "";
    try {
      const userStr = localStorage.getItem("eduflow-user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?._id || u?.id) setCurrentUserId(String(u._id || u.id));
        if (u?.role) resolvedRole = String(u.role).toUpperCase();
      }
      if (!resolvedRole) {
        const fallbackRole =
          localStorage.getItem("eduflow-role") || localStorage.getItem("role") || "";
        if (fallbackRole) resolvedRole = fallbackRole.toUpperCase();
      }
      if (resolvedRole) {
        setUserRole(resolvedRole);
        setForm((prev) => ({
          ...prev,
          recipientRole: resolvedRole === "TEACHER" ? "STUDENT" : "ALL",
        }));
      }
    } catch {}
    fetchMessages();
    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(resolvedRole)) {
      fetchRecipients();
    }
  }, []);

  const openComposeModal = () => {
    setFormError("");
    setForm({
      recipientRole: userRole === "TEACHER" ? "STUDENT" : "ALL",
      recipientUserId: "",
      recipient: "",
      email: "",
      subject: "",
      content: "",
    });
    setShowForm(true);
    if (recipients.length === 0) {
      fetchRecipients();
    }
  };

  const filteredMessages = messages.filter((message) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      message.recipient,
      message.email,
      message.subject,
      message.content,
      message.senderName || "",
    ].some((value) => value.toLowerCase().includes(query));

    const matchesFilter =
      filter === "All" || message.status === filter;

    return matchesSearch && matchesFilter;
  });

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setNotice("");

    if (!canCompose) {
      setFormError("Only Admin, Principal, and Teachers can compose messages.");
      return;
    }

    if (form.recipientRole === "INDIVIDUAL" && !form.email.trim() && !form.recipientUserId) {
      setFormError("Please select a recipient or enter a recipient email.");
      return;
    }

    try {
      setSending(true);
      await api.post("/communication/messages", {
        recipientRole: form.recipientRole,
        recipientUserId: form.recipientUserId || undefined,
        recipient:
          form.recipientRole === "INDIVIDUAL"
            ? form.recipient.trim()
            : TARGET_LABELS[form.recipientRole],
        recipientEmail:
          form.recipientRole === "INDIVIDUAL"
            ? form.email.trim().toLowerCase()
            : "",
        subject: form.subject.trim(),
        content: form.content.trim(),
        status: "Sent",
      });

      setForm({
        recipientRole: userRole === "TEACHER" ? "STUDENT" : "ALL",
        recipientUserId: "",
        recipient: "",
        email: "",
        subject: "",
        content: "",
      });
      setShowForm(false);
      setNotice("Message sent successfully.");
      await fetchMessages();
    } catch (err: any) {
      setFormError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await api.delete(`/communication/messages/${id}`);
      await fetchMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete message.");
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
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Messages
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage and review communication records.
          </p>
        </div>

        {canCompose && (
          <button
            onClick={openComposeModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 cursor-pointer"
          >
            <Plus size={18} />
            Compose Message
          </button>
        )}
      </div>

      {notice && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notice"
            className="rounded p-1 hover:bg-emerald-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Messages</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {messages.length}
          </p>
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

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-500" />
            Loading messages...
          </div>
        ) : (
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
                    {message.senderName ? `From: ${message.senderName} · ` : ""}
                    To: {message.recipient}
                    {message.email ? ` (${message.email})` : ""}
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
                  {canDeleteMessage(message) && (
                    <button
                      onClick={() => handleDelete(message.id)}
                      title="Delete message"
                      className="rounded-lg border border-slate-200 p-2.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredMessages.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500">
                No messages found.
              </div>
            )}
          </div>
        )}
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
                  Send To
                </label>
                <select
                  value={form.recipientRole}
                  onChange={(e) => {
                    const nextRole = e.target.value as RecipientTargetRole;
                    setForm({
                      ...form,
                      recipientRole: nextRole,
                      recipientUserId: "",
                      recipient: "",
                      email: "",
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-amber-400"
                >
                  {userRole === "TEACHER" ? (
                    <>
                      <option value="STUDENT">All Students</option>
                      <option value="INDIVIDUAL">Specific Student</option>
                    </>
                  ) : (
                    <>
                      <option value="ALL">All Users (Teachers, Students &amp; Accountants)</option>
                      <option value="TEACHER">All Teachers</option>
                      <option value="STUDENT">All Students</option>
                      <option value="ACCOUNTANT">All Accountants</option>
                      <option value="HOD">All HODs</option>
                      <option value="INDIVIDUAL">Specific User / Email</option>
                    </>
                  )}
                </select>
              </div>

              {form.recipientRole === "INDIVIDUAL" && (
                <>
                  {recipients.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        {userRole === "TEACHER" ? "Select Student (Optional)" : "Select Recipient (Optional)"}
                      </label>
                      <select
                        value={form.email}
                        onChange={(e) => {
                          const selected = recipients.find(
                            (r) => r.email === e.target.value
                          );
                          if (selected) {
                            setForm({
                              ...form,
                              recipientUserId: selected._id ? String(selected._id) : "",
                              recipient: selected.name,
                              email: selected.email,
                            });
                          } else {
                            setForm({
                              ...form,
                              recipientUserId: "",
                            });
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-amber-400"
                      >
                        <option value="">-- Type manually below or pick from list --</option>
                        {recipients.map((r) => (
                          <option key={r.email} value={r.email}>
                            {r.name} ({r.role.replace("_", " ")} · {r.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                      placeholder={
                        userRole === "TEACHER"
                          ? "Enter student name"
                          : "Enter recipient name"
                      }
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
                        setForm({
                          ...form,
                          recipientUserId: "",
                          email: e.target.value,
                        })
                      }
                      placeholder="recipient@example.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-amber-400"
                    />
                  </div>
                </>
              )}

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

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {formError}
                </div>
              )}

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
                  disabled={sending}
                  className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-amber-500 disabled:opacity-60 cursor-pointer"
                >
                  <Send size={17} />
                  {sending ? "Sending..." : "Send Message"}
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
              {selectedMessage.senderName && (
                <div>
                  <p className="text-xs text-slate-500">Sender</p>
                  <p className="mt-1 font-medium">{selectedMessage.senderName}</p>
                </div>
              )}
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