/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   api.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/28 18:26:38 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/30 15:39:05 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Centralized API helper for the SPA
// - Single origin: https://localhost (gateway)
// - Stores access token in localStorage
// - Tiny typed wrappers for GET/POST and common auth flows

// const API_BASE =
//   (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE) ||
//   "https://localhost";
function inferApiBase(): string {
  const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || undefined;
  const override = env?.VITE_API_BASE as string | undefined;
  if (override) return override;
  // When running via Vite (http://localhost:5173), talk to gateway over HTTP:3000
  if (typeof window !== "undefined" && window.location.hostname === "localhost" && window.location.port === "5173") {
    return "http://localhost:3000";
  }
  // Fallback (prod / nginx bundle): keep https
  return "http://localhost:3000";
}
const API_BASE = inferApiBase();

const ACCESS_TOKEN_KEY = "auth.accessToken";

export type Json =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null;

export interface ApiError extends Error {
  status: number;
  details?: unknown;
}

function makeError(status: number, message: string, details?: unknown): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.details = details;
  return err;
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

type FetchOpts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Json;
  auth?: boolean; // default true for protected routes
  signal?: AbortSignal;
};

// Low-level: return both Response and parsed data
async function requestRaw(path: string, opts: FetchOpts = {}): Promise<{ data: any; response: Response }> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const auth = opts.auth !== false; // default true
  const token = getAccessToken();
  if (auth && token) headers["authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
    signal: opts.signal,
  });

  let data: any = null;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // setAccessToken(null); // optional auto-logout
    }
    throw makeError(
      response.status,
      (data && (data.message || data.error)) || `HTTP ${response.status}`,
      data
    );
  }
  return { data, response };
}

// Default: return parsed data only
async function request<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { data } = await requestRaw(path, opts);
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, auth = true) => request<T>(path, { auth }),
  post: <T = unknown>(path: string, body?: Json, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  patch: <T = unknown>(path: string, body?: Json, auth = true) =>
    request<T>(path, { method: "PATCH", body, auth }),
  del: <T = unknown>(path: string, auth = true) =>
    request<T>(path, { method: "DELETE", auth }),
};

// ---------- Auth ----------
export type AuthUser = {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
};

// Extract token from common body/headers layouts
function extractAndStoreToken(res: Response, data: any) {
  let token: string | null = null;

  // body keys first
  if (data && typeof data === "object") {
    token =
      (data.accessToken as string) ||
      (data.access_token as string) ||
      (data.token as string) ||
      (data.jwt as string) ||
      null;
  }

  // fallback to headers
  if (!token) {
    const hdrAuth = res.headers.get("authorization"); // e.g., "Bearer eyJ..."
    const hdrX = res.headers.get("x-access-token");
    if (hdrAuth && hdrAuth.toLowerCase().startsWith("bearer ")) {
      token = hdrAuth.slice(7).trim();
    } else if (hdrX) {
      token = hdrX.trim();
    }
  }

  if (token) setAccessToken(token);
}

export async function signup(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ accessToken?: string }> {
  // 1) Create the account
  const { data, response } = await requestRaw("/auth/signup", {
    method: "POST",
    body: params,
    auth: false,
  });

  // 2) Try to capture a token from the signup response (in case your API returns one)
  extractAndStoreToken(response, data);

  // 3) If no token yet, immediately log in with the same credentials
  if (!getAccessToken()) {
    const loginRes = await login({ email: params.email, password: params.password });
    // login() already stores the token if it gets one
    if (!getAccessToken()) {
      // Still no token → front-end can’t call /auth/me; surface a clear message
      throw new Error("Signup succeeded but no session token was issued. Please log in.");
    }
    if ((loginRes as any)?.accessToken) {
      // For completeness, return a consistent shape
      return { accessToken: (loginRes as any).accessToken };
    }
  }

  return data;
}

export async function login(params: {
  email: string;
  password: string;
  code?: string;
}): Promise<{ accessToken?: string } | { error: "2fa_required" }> {
  const { data, response } = await requestRaw("/auth/login", {
    method: "POST",
    body: params,
    auth: false,
  });
  extractAndStoreToken(response, data);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout", {}, true);
  } finally {
    setAccessToken(null);
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function getMe(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me", true);
}

// Small helper for showing human-readable identity
export function displayName(u: AuthUser | null): string {
  if (!u) return "Guest";
  return u.display_name || u.email || u.id;
}

// Health check (useful in dev)
export async function pingAuth(): Promise<{ status: string }> {
  return api.get<{ status: string }>("/auth/healthz", false);
}

export default {
  API_BASE,
  getAccessToken,
  setAccessToken,
  isAuthenticated,
  signup,
  login,
  logout,
  getMe,
  displayName,
  pingAuth,
  api,
};
