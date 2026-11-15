"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Megaphone,
  Calendar,
  Users,
  Trash2,
  Eye,
  X,
  AlertCircle,
  Tag,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type Announcement = {
  id: string;
  mongoId: string;
  title: string;
  category: "Academic" | "Administrative" | "Event" | "Holiday";
  audience: "All" | "Students" | "Teachers" | "Accountant";
  priority: "High" | "Medium" | "Low";
  date: string;
  content: string;
  author: string;
  examDate?: string;
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [examDate, setExamDate] = useState("");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string>("All");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Announcement["category"]>("Academic");
  const [audience, setAudience] = useState<Announcement["audience"]>("All");
  const [priority, setPriority] = useState<Announcement["priority"]>("Medium");
  const [content, setContent] = useState("");

  const canManage = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(userRole);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success?: boolean; announcements?: any[] }>("/communication/announcements");
      if (res && res.announcements) {
        setAnnouncements(
          res.announcements.map((a: any) => ({
            id: a._id,
            mongoId: a._id,
            title: a.title,
            category: a.category || "Academic",
            audience: a.audience || "All",
            priority: a.priority || "Medium",
            date: a.createdAt
              ? a.createdAt.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            author: a.authorName || "Administration",
            content: a.content,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load announcements :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const role = localStorage.getItem("role") || localStorage.getItem("eduflow-role") || "";
      if (role) {
        setUserRole(role);
      } else {
        const userStr = localStorage.getItem("eduflow-user");
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.role) setUserRole(u.role);
        }
      }
    } catch {}
    loadAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());

    const matchesAudience =
      selectedAudience === "All" || item.audience === selectedAudience;

    return matchesSearch && matchesAudience;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      await api.post("/communication/announcements", {
        title: title.trim(),
        content: content.trim(),
        category,
        audience,
        priority,
      });

      await loadAnnouncements();
      setTitle("");
      setContent("");
      setShowCreateModal(false);
      setFeedback({ type: "success", message: "Announcement published successfully." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to publish notice." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    setFeedback(null);
    try {
      await api.delete(`/communication/announcements/${id}`);
      await loadAnnouncements();
      if (selectedAnnouncement?.id === id) {
        setSelectedAnnouncement(null);
      }
      setFeedback({ type: "success", message: "Announcement deleted successfully." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete announcement." });
    }
  };

  const priorityStyles = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <Megaphone size={26} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Communication / Notices</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Announcements & Notices
            </h1>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-yellow-300 cursor-pointer"
          >
            <Plus size={18} />
            Publish Notice
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`mb-5 flex items-center justify-between rounded-xl border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Notices</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {announcements.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Published</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">High Priority</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {announcements.filter((a) => a.priority === "High").length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Urgent notifications</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Student Notices</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {announcements.filter((a) => a.audience === "Students" || a.audience === "All").length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Academic updates</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Faculty Notices</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {announcements.filter((a) => a.audience === "Teachers" || a.audience === "All").length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Staff communications</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search notices by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <select
          value={selectedAudience}
          onChange={(e) => setSelectedAudience(e.target.value)}
          aria-label="Filter notices by target audience"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="All">All Audiences</option>
          <option value="Students">Students Only</option>
          <option value="Teachers">Teachers Only</option>
          <option value="Accountant">Accountant Only</option>
        </select>
      </div>

      {/* Announcements Grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnnouncements.map((notice) => (
            <div
              key={notice.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      priorityStyles[notice.priority]
                    }`}
                  >
                    {notice.priority}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {notice.date}
                  </span>
                </div>

                <h3 className="mt-3 font-bold text-slate-900 leading-snug">
                  {notice.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600 leading-relaxed">
                  {notice.content}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-amber-600" />
                    Target: {notice.audience}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAnnouncement(notice)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDelete(notice.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredAnnouncements.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
              <p className="font-semibold text-slate-700">No announcements found</p>
              <p className="mt-1 text-xs text-slate-400">
                Click &ldquo;Publish Notice&rdquo; to broadcast an announcement.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: View Details */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                    priorityStyles[selectedAnnouncement.priority]
                  }`}
                >
                  {selectedAnnouncement.priority} Priority
                </span>
                <h2 className="mt-2 text-lg font-bold text-slate-900">
                  {selectedAnnouncement.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-500" />
                  {selectedAnnouncement.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-amber-500" />
                  Target: {selectedAnnouncement.audience}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag size={14} className="text-amber-500" />
                  Category: {selectedAnnouncement.category}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {selectedAnnouncement.content}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-yellow-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Announcement */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Tag className="text-yellow-500" size={20} />
                <h2 className="text-lg font-bold text-slate-900">Publish Announcement</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g, Upcoming Exam Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-amber-400"
                />
              </div>

              <div>
  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
    Date
  </label>
  <input
    type="date"
    required
    value={examDate}
    onChange={(e) => setExamDate(e.target.value)}
    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
  />
</div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as Announcement["category"])
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-amber-400 bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Event">Event</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(e.target.value as Announcement["audience"])
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-amber-400 bg-white"
                  >
                    <option value="All">All Users</option>
                    <option value="Students">Students Only</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Accountant">Accountant Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as Announcement["priority"])
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-amber-400 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Notice Content *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed description of the announcement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-amber-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-yellow-300 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}