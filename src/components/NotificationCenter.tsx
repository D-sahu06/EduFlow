"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Calendar,
  CalendarCheck,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  MailOpen,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_INCOMING_EVENT,
  deleteNotificationItem,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationAsUnread,
  type NotificationItem,
} from "@/lib/notifications";

type StatusFilter = "all" | "unread" | "read";

type CategoryVisual = {
  badgeClass: string;
  iconBgClass: string;
  Icon: React.ElementType;
};

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  Announcements: {
    badgeClass: "bg-yellow-100 text-yellow-900 border-yellow-200",
    iconBgClass: "bg-yellow-100 text-yellow-700",
    Icon: Megaphone,
  },
  "Attendance Updates": {
    badgeClass: "bg-sky-100 text-sky-900 border-sky-200",
    iconBgClass: "bg-sky-100 text-sky-700",
    Icon: CalendarCheck,
  },
  "Examination Notifications": {
    badgeClass: "bg-indigo-100 text-indigo-900 border-indigo-200",
    iconBgClass: "bg-indigo-100 text-indigo-700",
    Icon: ClipboardList,
  },
  "Fees and Payment Updates": {
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    iconBgClass: "bg-emerald-100 text-emerald-700",
    Icon: Wallet,
  },
  Messages: {
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    iconBgClass: "bg-amber-100 text-amber-700",
    Icon: MessageSquare,
  },
  "Events and Important Reminders": {
    badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    iconBgClass: "bg-purple-100 text-purple-700",
    Icon: Calendar,
  },
  "General System Notifications": {
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    iconBgClass: "bg-slate-100 text-slate-700",
    Icon: Settings,
  },
};

const DEFAULT_VISUAL: CategoryVisual = {
  badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  iconBgClass: "bg-slate-100 text-slate-700",
  Icon: Bell,
};

function formatDateTimeParts(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return { dateText: "—", timeText: "" };
  }

  return {
    dateText: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    timeText: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default function NotificationCenter() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readCount, setReadCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetchNotifications({
          status: statusFilter,
          category: categoryFilter,
          search: debouncedSearch,
        });
        setNotifications(res.notifications || []);
        setTotalCount(res.totalCount ?? 0);
        setUnreadCount(res.unreadCount ?? 0);
        setReadCount(res.readCount ?? 0);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Unable to load notifications right now.";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, categoryFilter, debouncedSearch]
  );

  useEffect(() => {
    void loadNotifications(false);
  }, [loadNotifications]);

  useEffect(() => {
    const handleIncoming = () => {
      void loadNotifications(true);
    };

    window.addEventListener(NOTIFICATION_INCOMING_EVENT, handleIncoming);
    return () => {
      window.removeEventListener(NOTIFICATION_INCOMING_EVENT, handleIncoming);
    };
  }, [loadNotifications]);

  const applySummary = (res: {
    totalCount?: number;
    unreadCount?: number;
    readCount?: number;
  }) => {
    if (typeof res.totalCount === "number") setTotalCount(res.totalCount);
    if (typeof res.unreadCount === "number") setUnreadCount(res.unreadCount);
    if (typeof res.readCount === "number") setReadCount(res.readCount);
  };

  const handleToggleRead = async (item: NotificationItem) => {
    setBusyId(item._id);
    setError(null);
    try {
      const res = item.isRead
        ? await markNotificationAsUnread(item._id)
        : await markNotificationAsRead(item._id);

      applySummary(res);

      setNotifications((prev) => {
        const nextIsRead = !item.isRead;
        if (
          (statusFilter === "unread" && nextIsRead) ||
          (statusFilter === "read" && !nextIsRead)
        ) {
          return prev.filter((n) => n._id !== item._id);
        }
        return prev.map((n) =>
          n._id === item._id
            ? {
                ...n,
                isRead: nextIsRead,
                readAt: nextIsRead ? new Date().toISOString() : null,
              }
            : n
        );
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update notification."
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        const res = await markNotificationAsRead(item._id);
        applySummary(res);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      } catch {
        // Navigate cleanly even if read sync fails
      }
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    setError(null);
    try {
      const res = await markAllNotificationsAsRead();
      applySummary(res);

      if (statusFilter === "unread") {
        setNotifications([]);
      } else {
        const now = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now }))
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (item: NotificationItem) => {
    setBusyId(item._id);
    setError(null);
    try {
      const res = await deleteNotificationItem(item._id);
      applySummary(res);
      setNotifications((prev) => prev.filter((n) => n._id !== item._id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete notification."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Top Back Button */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-1 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={17} />
            Back
          </button>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-slate-900 shadow-xs">
              <BellRing size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Notification Center
                </h1>
                <span className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-100 px-3 py-0.5 text-xs font-semibold text-yellow-900">
                  {unreadCount} Unread
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Stay updated with announcements, attendance changes, exam schedules,
                fee payments, messages, and important reminders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadNotifications(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin text-yellow-600" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={unreadCount === 0 || markingAll}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer"
            >
              <CheckCheck size={16} />
              {markingAll ? "Marking..." : "Mark All as Read"}
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Total Notifications
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Bell size={20} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-yellow-200 bg-white p-5 shadow-xs">
            <div>
              <p className="text-xs font-semibold tracking-wide text-yellow-700 uppercase">
                Unread Alerts
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {unreadCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
              <BellRing size={20} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div>
              <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                Read Notifications
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {readCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: "all", label: "All", count: totalCount },
                { key: "unread", label: "Unread", count: unreadCount },
                { key: "read", label: "Read", count: readCount },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer ${
                    active
                      ? "bg-yellow-400 text-slate-900 font-semibold shadow-xs"
                      : "border border-gray-200 bg-white text-slate-600 hover:bg-yellow-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Dropdown + Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              aria-label="Filter by notification category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-yellow-400"
            >
              <option value="All">All Categories</option>
              {NOTIFICATION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <div className="relative min-w-[240px]">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-gray-200 bg-slate-50 py-2 pr-3.5 pl-9 text-sm text-slate-800 outline-none transition focus:border-yellow-400 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadNotifications(false)}
              className="self-start rounded-lg bg-red-100 px-3 py-1 font-semibold text-red-800 hover:bg-red-200 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-xs">
              <RefreshCw size={28} className="animate-spin text-yellow-500" />
              <p className="mt-3 text-sm font-medium text-slate-600">
                Loading your notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <Bell size={26} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No notifications found
              </h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {statusFilter !== "all" ||
                categoryFilter !== "All" ||
                debouncedSearch
                  ? "No notifications match your active filters. Try clearing filters or switching back to All."
                  : "You are all caught up. Real-time alerts for your role and activities will appear here."}
              </p>
              {(statusFilter !== "all" ||
                categoryFilter !== "All" ||
                debouncedSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setCategoryFilter("All");
                    setSearchInput("");
                  }}
                  className="mt-4 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-yellow-500 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            notifications.map((item) => {
              const visual =
                CATEGORY_VISUALS[item.category] || DEFAULT_VISUAL;
              const CategoryIcon = visual.Icon;
              const { dateText, timeText } = formatDateTimeParts(
                item.createdAt
              );
              const isBusy = busyId === item._id;

              return (
                <article
                  key={item._id}
                  className={`rounded-2xl border p-5 transition shadow-xs ${
                    !item.isRead
                      ? "border-yellow-200 border-l-4 border-l-yellow-400 bg-yellow-50/40"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Left Content */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${visual.iconBgClass}`}
                      >
                        <CategoryIcon size={20} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {!item.isRead && (
                            <span
                              aria-label="Unread notification"
                              className="inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500 ring-4 ring-yellow-100"
                            />
                          )}

                          <h2 className="text-base font-bold text-slate-900">
                            {item.title}
                          </h2>

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${visual.badgeClass}`}
                          >
                            {item.category}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              item.isRead
                                ? "bg-slate-100 text-slate-600"
                                : "bg-yellow-400 text-slate-900"
                            }`}
                          >
                            {item.isRead ? "Read" : "Unread"}
                          </span>

                          {item.priority === "High" && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                              Important
                            </span>
                          )}
                        </div>

                        <p className="text-sm leading-relaxed text-slate-700">
                          {item.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} />
                            {dateText}
                          </span>
                          {timeText && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={13} />
                              {timeText}
                            </span>
                          )}
                          {item.actorName && (
                            <span>By {item.actorName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                      {item.link && (
                        <button
                          type="button"
                          onClick={() => void handleOpenNotification(item)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                        >
                          <ExternalLink size={14} />
                          Open
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleToggleRead(item)}
                        disabled={isBusy}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition disabled:opacity-60 cursor-pointer ${
                          item.isRead
                            ? "border-gray-200 bg-white text-slate-700 hover:bg-slate-50"
                            : "border-yellow-300 bg-yellow-100 text-yellow-900 hover:bg-yellow-200"
                        }`}
                      >
                        {item.isRead ? (
                          <>
                            <MailOpen size={14} />
                            Mark as Unread
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            Mark as Read
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={isBusy}
                        aria-label="Delete notification"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
