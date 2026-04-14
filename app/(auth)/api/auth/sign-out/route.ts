/**
 * POST /api/auth/sign-out
 *
 * Clears the HTTP-only JWT cookie in addition to the NextAuth session.
 * The client should call this before `signOut()` (or we call both in the
 * sign-out form action).
 */

import { NextResponse } from "next/server";
import { signOut } from "@/app/(auth)/auth";
import { clearAccessToken } from "@/lib/auth-token";

export async function POST(): Promise<NextResponse> {
  // 1. Clear the JWT HTTP-only cookie
  await clearAccessToken();

  // 2. Destroy the NextAuth session
  await signOut({ redirect: false });

  return NextResponse.json({ ok: true });
}
