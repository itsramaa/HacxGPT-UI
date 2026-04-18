"use server";

import { z } from "zod";
import { publicFetch } from "@/lib/api";
import { signIn } from "../../app/(auth)/auth";

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  fullName: z.string().max(100).optional(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = loginSchema.parse({
      identifier: formData.get("identifier"),
      password: formData.get("password"),
    });

    await signIn("credentials", {
      email: validatedData.identifier,
      password: validatedData.password,
      redirect: false,
    });

    // The cookie is already set inside auth.ts → authorize() → setAccessToken().
    // signIn() runs authorize() server-side, so the cookie lands on the response
    // before we return "success" to the client.
    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = registerSchema.parse({
      username: formData.get("username"),
      email: formData.get("email"),
      fullName: formData.get("fullName") || undefined,
      password: formData.get("password"),
    });

    console.log(`validate data:${validatedData.email}`);

    // 1. Create account on the backend
    const res = await publicFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: validatedData.username,
        email: validatedData.email,
        full_name: validatedData.fullName,
        password: validatedData.password,
      }),
    });

    if (!res.ok) {
      if (res.status === 400) {
        return { status: "user_exists" };
      }
      return { status: "failed" };
    }

    // 2. Log in immediately and set the HTTP-only cookie
    await signIn("credentials", {
      email: validatedData.username,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};
