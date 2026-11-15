const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
};

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("eduflow-token")
      : null;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers,
    cache: "no-store",
  };

  if (options.body && options.method !== "GET") {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  // If 401 Unauthorized on private endpoint, clear stale session
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/admissions/apply")
  ) {
    [
      "token",
      "access_token",
      "eduflow-token",
      "eduflow-user",
      "eduflow-role",
      "eduflow-demo-role",
      "eduflow-demo-auth",
    ].forEach((k) => localStorage.removeItem(k));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "GET", headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "POST", body, headers }),

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "PUT", body, headers }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, { method: "DELETE", headers }),
};
