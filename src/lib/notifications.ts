"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const NOTIFICATION_CATEGORIES = [
  "Announcements",
  "Attendance Updates",
  "Examination Notifications",
  "Fees and Payment Updates",
  "Messages",
  "Events and Important Reminders",
  "General System Notifications",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationPriority = "Low" | "Medium" | "High";

export type NotificationItem = {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  category: NotificationCategory | string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string | null;
  link?: string;
  actor?: string | null;
  actorName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type NotificationSummary = {
  totalCount: number;
  unreadCount: number;
  readCount: number;
};

export type NotificationsListResponse = NotificationSummary & {
  success: boolean;
  count: number;
  notifications: NotificationItem[];
  categories?: string[];
};

export type NotificationMutationResponse = NotificationSummary & {
  success: boolean;
  message: string;
  notification?: NotificationItem;
};

export const NOTIFICATIONS_CHANGE_EVENT = "eduflow-notifications-change";
export const NOTIFICATION_INCOMING_EVENT = "eduflow-notification-incoming";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("eduflow-token")
  );
}

export function emitNotificationsChanged(unreadCount?: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGE_EVENT, {
      detail: { unreadCount },
    })
  );
}

export function emitIncomingNotification(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_INCOMING_EVENT));
}

export async function fetchNotifications(params?: {
  status?: "all" | "unread" | "read";
  category?: string;
  search?: string;
  limit?: number;
}): Promise<NotificationsListResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params?.category && params.category !== "All") {
    query.set("category", params.category);
  }
  if (params?.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params?.limit && params.limit > 0) {
    query.set("limit", String(params.limit));
  }

  const qs = query.toString();
  return api.get<NotificationsListResponse>(
    `/communication/notifications${qs ? `?${qs}` : ""}`
  );
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  if (!getStoredAuthToken()) return 0;
  const res = await api.get<{ success: boolean; unreadCount: number }>(
    "/communication/notifications/unread-count"
  );
  return typeof res.unreadCount === "number" ? res.unreadCount : 0;
}

export async function markNotificationAsRead(
  id: string
): Promise<NotificationMutationResponse> {
  const res = await api.put<NotificationMutationResponse>(
    `/communication/notifications/${id}/read`
  );
  emitNotificationsChanged(res.unreadCount);
  return res;
}

export async function markNotificationAsUnread(
  id: string
): Promise<NotificationMutationResponse> {
  const res = await api.put<NotificationMutationResponse>(
    `/communication/notifications/${id}/unread`
  );
  emitNotificationsChanged(res.unreadCount);
  return res;
}

export async function markAllNotificationsAsRead(): Promise<NotificationMutationResponse> {
  const res = await api.put<NotificationMutationResponse>(
    "/communication/notifications/read-all"
  );
  emitNotificationsChanged(res.unreadCount);
  return res;
}

export async function deleteNotificationItem(
  id: string
): Promise<NotificationMutationResponse> {
  const res = await api.delete<NotificationMutationResponse>(
    `/communication/notifications/${id}`
  );
  emitNotificationsChanged(res.unreadCount);
  return res;
}

/**
 * Subscribe cleanly to live unread notification count via authenticated SSE
 * with cross-component custom event sync, focus refresh, and periodic fallback.
 */
export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!getStoredAuthToken()) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Preserve last known badge count on transient errors
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let streamController: AbortController | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectStream = async () => {
      if (disposed) return;

      const token = getStoredAuthToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }

      streamController?.abort();
      const controller = new AbortController();
      streamController = controller;

      try {
        const response = await fetch(
          `${API_BASE_URL}/communication/notifications/stream`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/event-stream",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`SSE stream error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!disposed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split(/\r?\n\r?\n/);
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const dataLines = frame
              .split(/\r?\n/)
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim());

            if (dataLines.length === 0) continue;

            try {
              const payload = JSON.parse(dataLines.join("\n"));
              if (typeof payload.unreadCount === "number" && !disposed) {
                setUnreadCount(payload.unreadCount);
              }
              if (payload.notification && !disposed) {
                emitIncomingNotification();
              }
            } catch {
              // Ignore malformed SSE keepalive/fragment
            }
          }
        }
      } catch (error) {
        if (
          disposed ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
      }

      if (!disposed && getStoredAuthToken()) {
        reconnectTimer = setTimeout(() => {
          void refreshUnreadCount();
          void connectStream();
        }, 5000);
      }
    };

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;
      if (typeof detail?.unreadCount === "number") {
        setUnreadCount(detail.unreadCount);
      } else {
        void refreshUnreadCount();
      }
    };

    const handleSessionChange = () => {
      void refreshUnreadCount();
      void connectStream();
    };

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    };

    void refreshUnreadCount();
    void connectStream();

    const fallbackInterval = setInterval(() => {
      void refreshUnreadCount();
    }, 30000);

    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, handleChange);
    window.addEventListener("eduflow-user-change", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    return () => {
      disposed = true;
      streamController?.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(fallbackInterval);
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleChange);
      window.removeEventListener("eduflow-user-change", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
    };
  }, [refreshUnreadCount]);

  return { unreadCount, refreshUnreadCount };
}
