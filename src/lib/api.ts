import { ApiResponse } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const TOKEN_KEY = "rp_access_token";
const REFRESH_KEY = "rp_refresh_token";
const ORG_KEY = "rp_org_id";

// ─── Token helpers ────────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getOrgId: () => localStorage.getItem(ORG_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  setOrgId: (orgId: string) => localStorage.setItem(ORG_KEY, orgId),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ORG_KEY);
  },
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = tokenStorage.getAccess();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, false);
    }
    // Refresh failed — clear tokens and redirect to login
    tokenStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const json = await res.json();

  if (!res.ok) {
    throw {
      statusCode: res.status,
      message: json.message ?? "Request failed",
      errors: json.errors,
    };
  }

  // All successful responses are wrapped: { success, data, timestamp }
  const envelope = json as ApiResponse<T>;
  return envelope.data;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const { accessToken, refreshToken: newRefresh } = json.data;
    tokenStorage.setTokens(accessToken, newRefresh);
    return true;
  } catch {
    return false;
  }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  register: (body: { email: string; password: string; fullName: string; timezone?: string }) =>
    api.post<{ accessToken: string; refreshToken: string }>("/auth/register", body),

  login: (body: { email: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string }>("/auth/login", body),

  me: () => api.get<import("@/types").AuthUser>("/auth/me"),

  logout: () => api.post<void>("/auth/logout"),

  updateProfile: (body: { fullName?: string; timezone?: string; locale?: string; avatarUrl?: string }) =>
    api.patch<import("@/types").AuthUser>("/auth/me", body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>("/auth/change-password", body),
};

// ─── Organization endpoints ───────────────────────────────────────────────────

export const orgsApi = {
  list: () => api.get<import("@/types").OrgMembership[]>("/organizations"),

  create: (body: { name: string; timezone?: string; currency?: string }) =>
    api.post<import("@/types").Organization>("/organizations", body),

  get: (orgId: string) =>
    api.get<import("@/types").Organization>(`/organizations/${orgId}`),

  update: (orgId: string, body: Partial<{ name: string; timezone: string; currency: string }>) =>
    api.patch<import("@/types").Organization>(`/organizations/${orgId}`, body),

  members: (orgId: string) =>
    api.get<import("@/types").TeamMember[]>(`/organizations/${orgId}/members`),

  inviteMember: (orgId: string, body: { email: string; role?: string }) =>
    api.post<import("@/types").TeamMember>(`/organizations/${orgId}/members/invite`, body),

  updateMemberRole: (orgId: string, userId: string, role: string) =>
    api.patch<import("@/types").TeamMember>(`/organizations/${orgId}/members/${userId}/role`, { role }),

  removeMember: (orgId: string, userId: string) =>
    api.delete<{ message: string }>(`/organizations/${orgId}/members/${userId}`),
};

// ─── Projects endpoints ───────────────────────────────────────────────────────

export const projectsApi = {
  list: (orgId: string) =>
    api.get<import("@/types").Project[]>(`/organizations/${orgId}/projects`),

  create: (orgId: string, body: { name: string; clientName?: string; colorTag?: string }) =>
    api.post<import("@/types").Project>(`/organizations/${orgId}/projects`, body),
};

// ─── Assets endpoints ─────────────────────────────────────────────────────────

export const assetsApi = {
  list: (orgId: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return api.get<import("@/types").Asset[]>(`/organizations/${orgId}/assets${qs}`);
  },

  get: (orgId: string, assetId: string) =>
    api.get<import("@/types").Asset>(`/organizations/${orgId}/assets/${assetId}`),

  create: (orgId: string, body: import("@/types").CreateAssetDto) =>
    api.post<import("@/types").Asset>(`/organizations/${orgId}/assets`, body),

  update: (orgId: string, assetId: string, body: Partial<import("@/types").CreateAssetDto>) =>
    api.patch<import("@/types").Asset>(`/organizations/${orgId}/assets/${assetId}`, body),

  remove: (orgId: string, assetId: string) =>
    api.delete<void>(`/organizations/${orgId}/assets/${assetId}`),

  history: (orgId: string, assetId: string) =>
    api.get<import("@/types").RenewalEvent[]>(`/organizations/${orgId}/assets/${assetId}/history`),
};

// ─── Renewals endpoints ───────────────────────────────────────────────────────

export const renewalsApi = {
  summary: (orgId: string) =>
    api.get<import("@/types").RenewalSummary>(`/organizations/${orgId}/renewals/summary`),

  upcoming: (orgId: string, days = 30) =>
    api.get<import("@/types").AssetWithDays[]>(
      `/organizations/${orgId}/renewals/upcoming?days=${days}`,
    ),

  overdue: (orgId: string) =>
    api.get<import("@/types").AssetWithDays[]>(`/organizations/${orgId}/renewals/overdue`),

  calendar: (orgId: string, year: number, month: number) =>
    api.get<import("@/types").Asset[]>(
      `/organizations/${orgId}/renewals/calendar?year=${year}&month=${month}`,
    ),

  renew: (orgId: string, assetId: string, newRenewalDate?: string) =>
    api.post<import("@/types").Asset>(
      `/organizations/${orgId}/renewals/assets/${assetId}/renew`,
      { newRenewalDate },
    ),
};

// ─── Notifications endpoints ──────────────────────────────────────────────────

export const notificationsApi = {
  list: (orgId: string) =>
    api.get<import("@/types").Notification[]>(`/organizations/${orgId}/notifications`),

  unreadCount: (orgId: string) =>
    api.get<{ count: number }>(`/organizations/${orgId}/notifications/unread-count`),

  markRead: (orgId: string, notificationId: string) =>
    api.patch<void>(`/organizations/${orgId}/notifications/${notificationId}/read`),

  getPreferences: (orgId: string) =>
    api.get<import("@/types").NotificationPreferences>(`/organizations/${orgId}/notifications/preferences`),

  updatePreferences: (orgId: string, body: Partial<import("@/types").NotificationPreferences>) =>
    api.put<import("@/types").NotificationPreferences>(`/organizations/${orgId}/notifications/preferences`, body),
};

// ─── Billing endpoints ────────────────────────────────────────────────────────

export const billingApi = {
  getPlans: (orgId: string) =>
    api.get<import("@/types").Plan[]>(`/organizations/${orgId}/billing/plans`),

  getSubscription: (orgId: string) =>
    api.get<import("@/types").Subscription | null>(`/organizations/${orgId}/billing/subscription`),
};
