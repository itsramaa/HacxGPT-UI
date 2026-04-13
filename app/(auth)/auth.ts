import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      accessToken?: string;
      availableTokens?: number;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    accessToken?: string;
    availableTokens?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    accessToken?: string;
    availableTokens?: number;
  }
}

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials.email ?? "");
        const password = String(credentials.password ?? "");
        
        try {
          if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
             return {
              id: "dummy-user-id",
              email: username || "hacker@hacxgpt.io",
              type: "regular",
              accessToken: "dummy-token",
              availableTokens: 999999
            };
          }

          const res = await fetch(`${BACKEND_URL}/api/auth/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ username, password }),
          });

          if (!res.ok) {
            return null;
          }

          const data = await res.json();
          const token = data.access_token;
          
          const profileRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!profileRes.ok) return null;
          const profile = await profileRes.json();

          return {
            id: profile.id,
            email: profile.username,
            type: "regular",
            accessToken: token,
            availableTokens: profile.available_tokens
          };
        } catch(e) {
          console.error("Auth backend error:", e);
          return null;
        }
      },
    }),
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        return { id: "guest", type: "guest" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.accessToken = user.accessToken;
        token.availableTokens = user.availableTokens;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.accessToken = token.accessToken;
        session.user.availableTokens = token.availableTokens;
      }

      return session;
    },
  },
});
