export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://support-api.homaklab.com";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "https://support-api.homaklab.com";

export type SupportSessionStatus =
  | "CREATED"
  | "WAITING_TECHNICIAN"
  | "TECHNICIAN_ASSIGNED"
  | "ACTIVE"
  | "ENDED"
  | "EXPIRED"
  | "REJECTED"
  | "CANCELLED";

export interface SupportSession {
  id: string;
  supportCode: string;
  status: SupportSessionStatus;
  deviceHostname: string | null;
  deviceIp: string | null;
  clientVersion: string | null;
  technicianName: string | null;
  department: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  endedAt: string | null;
  terminationReason: string | null;
  rustdeskId: string | null;
  rustdeskPassword: string | null;
  rustdeskNotifiedAt: string | null;
}

export interface QueueItem extends SupportSession {
  waitSeconds: number;
}

export interface AuditLogEntry {
  id: string;
  sessionId: string | null;
  eventType: string;
  actorName: string | null;
  ipAddress: string | null;
  detail: string | null;
  timestamp: string;
}

export interface CreateSessionResponse {
  id: string;
  supportCode: string;
  expiresAt: string;
}

export interface Technician {
  id: string;
  username: string;
  displayName: string;
  department: string | null;
  role?: string;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  technician: Technician;
}

const TOKEN_KEY = "homak_tech_token";
const TECHNICIAN_KEY = "homak_tech_info";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredTechnician(): Technician | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TECHNICIAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Technician;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TECHNICIAN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  config: { skipAuthRedirect?: boolean } = {},
): Promise<T> {
  const token = getStoredToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !config.skipAuthRedirect) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Oturum süresi doldu. Lütfen tekrar giriş yapın.", 401);
  }

  if (!res.ok) {
    let message = `İstek başarısız oldu (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function login(params: { username: string; password: string }) {
  return request<LoginResponse>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    { skipAuthRedirect: true },
  );
}

export function generateCode(params: { technicianName?: string; department?: string } = {}) {
  return request<CreateSessionResponse>("/api/v1/support/sessions", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function verifyCode(params: { code: string; hostname?: string; clientVersion?: string }) {
  return request<SupportSession>("/api/v1/support/verify-code", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getQueue() {
  return request<QueueItem[]>("/api/v1/support/queue");
}

export function getSession(id: string) {
  return request<SupportSession>(`/api/v1/support/sessions/${id}`);
}

export interface SessionStatusByCode {
  status: SupportSessionStatus;
  rustdeskId: string | null;
  rustdeskNotifiedAt: string | null;
}

export function getSessionStatusByCode(code: string) {
  return request<SessionStatusByCode>(`/api/v1/support/sessions/by-code/${code}/status`);
}

export function acceptSession(id: string, params: { technicianName?: string } = {}) {
  return request<SupportSession>(`/api/v1/support/sessions/${id}/accept`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function rejectSession(id: string) {
  return request<SupportSession>(`/api/v1/support/sessions/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function terminateSession(id: string, params: { reason?: string } = {}) {
  return request<SupportSession>(`/api/v1/support/sessions/${id}/terminate`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function submitRustdeskInfo(
  id: string,
  params: { rustdeskId: string; rustdeskPassword?: string },
) {
  return request<SupportSession>(`/api/v1/support/sessions/${id}/rustdesk-info`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getAuditLogs(params: { limit?: number; eventType?: string; sessionId?: string } = {}) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.eventType) search.set("eventType", params.eventType);
  if (params.sessionId) search.set("sessionId", params.sessionId);
  const qs = search.toString();
  return request<AuditLogEntry[]>(`/api/v1/support/audit-logs${qs ? `?${qs}` : ""}`);
}

export function getTechnicians() {
  return request<Technician[]>("/api/v1/technicians");
}

export function createTechnician(data: {
  username: string;
  password: string;
  displayName: string;
  department?: string;
  role?: string;
}) {
  return request<Technician>("/api/v1/technicians", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTechnician(
  id: string,
  data: {
    displayName?: string;
    department?: string;
    role?: string;
    password?: string;
  },
) {
  return request<Technician>(`/api/v1/technicians/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTechnician(id: string) {
  return request<{ ok: boolean; message: string }>(`/api/v1/technicians/${id}`, {
    method: "DELETE",
  });
}

export interface ActiveSupportSession extends SupportSession {
  isAgentOnline: boolean;
  techCount: number;
  lastActivitySecondsAgo: number;
  activeSeconds: number;
}

export function getActiveSessions() {
  return request<ActiveSupportSession[]>("/api/v1/support/sessions/active");
}

export interface SupportStats {
  totalSessions: number;
  todaySessions: number;
  activeSessions: number;
  waitingSessions: number;
  endedSessions: number;
  expiredSessions: number;
  rejectedSessions: number;
  createdSessions: number;
  avgWaitSeconds: number;
  topDevices: Array<{ hostname: string; count: number }>;
  statusCounts: Record<string, number>;
}

export function getSupportStats() {
  return request<SupportStats>("/api/v1/support/stats");
}

export type RecordingStatus = "RECORDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface SessionRecording {
  id: string;
  sessionId: string;
  status: RecordingStatus;
  durationSec: number | null;
  fileSizeByte: number | null;
  frameCount: number;
  startedAt: string;
  endedAt: string | null;
  errorMessage: string | null;
  supportCode?: string;
  technicianName?: string | null;
  deviceHostname?: string | null;
  department?: string | null;
}

export function getRecordings(params: { limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return request<SessionRecording[]>(`/api/v1/support/recordings${qs ? `?${qs}` : ""}`);
}

export function getRecordingStreamUrl(sessionId: string): string {
  const token = getStoredToken();
  const url = new URL(`${API_URL}/api/v1/support/recordings/${sessionId}/stream`);
  if (token) url.searchParams.set("access_token", token);
  return url.toString();
}

export { ApiError };
