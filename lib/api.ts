/**
 * lib/api.ts
 *
 * Centralized backend API client.
 *
 * All server-side code MUST use `backendFetch()` (or the typed wrappers)
 * instead of calling `fetch` directly with a hardcoded Bearer header.
 *
 * Features:
 *  - Auto-attaches the JWT from the HTTP-only cookie
 *  - Returns typed errors via ChatbotError
 *  - Never leaks tokens to the browser (server-only module)
 */

import "server-only";

import { getAccessToken } from "./auth-token";
import { ChatbotError } from "./errors";

export const BACKEND_URL =
  process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  /** If true, do not throw on non-2xx — return the raw Response instead */
  rawOnError?: boolean;
};

/**
 * The primary API client for server-side backend calls.
 *
 * Automatically injects the `Authorization: Bearer <jwt>` header from
 * the HTTP-only cookie.  Throws `ChatbotError("unauthorized:chat")` if
 * no token is found.
 */
export async function backendFetch(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const token = await getAccessToken();

  if (!token) {
    throw new ChatbotError("unauthorized:chat");
  }

  const { headers: extraHeaders = {}, rawOnError = false, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };

  // Only set application/json if not already set and body is NOT FormData
  if (!finalHeaders["Content-Type"] && !(rest.body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  // Remove Content-Type if explicitly set to empty string (used to bypass default)
  if (finalHeaders["Content-Type"] === "") {
    delete finalHeaders["Content-Type"];
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok && !rawOnError) {
    if (response.status === 401) {
      throw new ChatbotError("unauthorized:chat");
    }
    if (response.status === 403) {
      throw new ChatbotError("unauthorized:chat", "Forbidden");
    }
    if (response.status === 502 || response.status === 503) {
      throw new ChatbotError("offline:chat");
    }
  }

  return response;
}

/**
 * Convenience wrapper: calls backendFetch and parses JSON.
 * Throws on network or HTTP error.
 */
export async function backendJSON<T = unknown>(
  path: string,
  options?: FetchOptions
): Promise<T> {
  const res = await backendFetch(path, options);
  return res.json() as Promise<T>;
}

/**
 * Unauthenticated fetch — for endpoints that don't need a token
 * (e.g. /api/auth/token, /api/auth/register).
 */
export async function publicFetch(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { headers: extraHeaders = {}, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    ...extraHeaders,
  };

  if (!finalHeaders["Content-Type"] && !(rest.body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (finalHeaders["Content-Type"] === "") {
    delete finalHeaders["Content-Type"];
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });
}
