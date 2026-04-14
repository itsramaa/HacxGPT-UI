/**
 * lib/auth-token.ts
 *
 * Centralized helpers for managing the backend JWT access token stored
 * in an HTTP-only cookie.  All server-side code (API routes, Server
 * Components, middleware) should go through this module instead of
 * reading/writing the cookie ad-hoc.
 *
 * Cookie name: "hacx_access_token"
 * Cookie attributes:
 *   - httpOnly: true   → not readable by JS in the browser
 *   - secure:   true   → HTTPS only in production
 *   - sameSite: "lax"  → sent with top-level navigation, blocks CSRF
 *   - path:     "/"    → available on every route
 *   - maxAge:   30 days (JWT should be refreshed long before this)
 */

import { cookies } from "next/headers";
import { isProductionEnvironment } from "./constants";

export const TOKEN_COOKIE_NAME = "hacx_access_token";

/** Max age for the cookie (30 days). The backend JWT expiry is shorter. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Cookie options used when writing the token. */
export function tokenCookieOptions(maxAge = MAX_AGE_SECONDS) {
  return {
    name: TOKEN_COOKIE_NAME,
    httpOnly: true,
    secure: isProductionEnvironment,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Read the raw JWT string from the request cookie store.
 * Works in Server Components, API Route Handlers, and middleware.
 *
 * Returns `null` when the cookie is absent or empty.
 */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(TOKEN_COOKIE_NAME)?.value;
  return value && value.length > 0 ? value : null;
}

/**
 * Persist a JWT in the HTTP-only cookie.
 * Call this after a successful login / token refresh on the server side.
 */
export async function setAccessToken(token: string): Promise<void> {
  const store = await cookies();
  store.set({
    ...tokenCookieOptions(),
    value: token,
  });
}

/**
 * Clear the JWT cookie — call on sign-out.
 */
export async function clearAccessToken(): Promise<void> {
  const store = await cookies();
  store.set({
    ...tokenCookieOptions(0),
    value: "",
  });
}

/**
 * Lightweight check: does the cookie exist and is it non-empty?
 * Does NOT validate the JWT signature – that is done by the backend.
 */
export async function hasAccessToken(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}
