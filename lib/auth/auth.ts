import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { publicFetch, BACKEND_URL } from "@/lib/api";
import { setAccessToken } from "@/lib/auth/auth-token";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      accessToken?: string;
      total_usage?: number;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    accessToken?: string;
    total_usage?: number;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    accessToken?: string;
    total_usage?: number;
    role?: string;
    /** Unix timestamp (ms) when the access token expires */
    accessTokenExpiresAt?: number;
  }
}

// ---------------------------------------------------------------------------
// Token lifetime — should match the backend's JWT expiry.
// Default: 8 hours (backend typically issues 30-min → 8-hour tokens).
// ---------------------------------------------------------------------------
const ACCESS_TOKEN_TTL_MS =
  Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 28_800) * 1000;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    // ─── Regular credentials login ────────────────────────────────────────
    Credentials({
      credentials: {
        email: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials.email ?? "");
        const password = String(credentials.password ?? "");

        try {
          // 1. Exchange credentials for a JWT
          const res = await publicFetch("/api/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ username, password }) as any,
          });

          if (!res.ok) { return null; }

          const data = await res.json();
          const token: string = data.access_token;

          // 2. Persist the raw JWT in an HTTP-only cookie immediately
          await setAccessToken(token);

          // 3. Fetch the user profile to populate the session
          const profileRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!profileRes.ok) { return null; }
          const profile = await profileRes.json();

          return {
            id: profile.id,
            email: profile.username,
            accessToken: token,
            total_usage: profile.total_usage,
            role: profile.role,
          };
        } catch (e) {
          console.error("Auth backend error:", e);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ── JWT callback: runs every time the token is created / refreshed ────
    jwt({ token, user }) {
      if (user) {
        // First sign-in — seed from the User object returned by authorize()
        token.id = user.id as string;
        token.accessToken = user.accessToken;
        token.total_usage = user.total_usage;
        token.role = user.role;
        // Record when this token should be considered stale
        token.accessTokenExpiresAt = user.accessToken
          ? Date.now() + ACCESS_TOKEN_TTL_MS
          : undefined;
      }

      return token;
    },

    // ── Session callback: shapes the data exposed to useSession() ──────────
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
        // Expose the access token to server-side session callers;
        // it is NOT sent to the browser (the cookie handles that).
        session.user.accessToken = token.accessToken as string | undefined;
        session.user.total_usage = token.total_usage as number | undefined;
        session.user.role = token.role as string | undefined;
      }

      return session;
    },
  },
});
