"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/toast";
import { type RegisterActionState, register } from "../../../lib/auth/actions";

export default function Page() {
  const router = useRouter();
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: "Account already exists!" });
    } else if (state.status === "failed") {
      toast({ type: "error", description: "Failed to create account!" });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success") {
      toast({ type: "success", description: "Account created!" });
      setIsSuccessful(true);
      // Must await updateSession before navigating so the NextAuth cookie
      // is refreshed before middleware checks it again.
      updateSession().then(() => {
        router.push("/");
      });
    }
  }, [state.status]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="text-sm text-muted-foreground">Get started for free</p>
      <AuthForm action={formAction} mode="register">
        <SubmitButton isSuccessful={isSuccessful}>Sign up</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"Have an account? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </AuthForm>
    </>
  );
}
