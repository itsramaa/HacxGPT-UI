import Form from "next/form";
import { signOut } from "@/app/(auth)/auth";
import { clearAccessToken } from "@/lib/auth-token";

export const SignOutForm = () => {
  return (
    <Form
      action={async () => {
        "use server";

        // 1. Clear the HTTP-only backend JWT cookie
        await clearAccessToken();

        // 2. Destroy the NextAuth session and redirect to login
        await signOut({ redirectTo: "/login" });
      }}
      className="w-full"
    >
      <button
        className="w-full px-1 py-0.5 text-left text-red-500"
        type="submit"
      >
        Sign out
      </button>
    </Form>
  );
};
