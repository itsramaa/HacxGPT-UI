"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SparklesIcon } from "./icons";

export function GuestLimitDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleLimit = () => setOpen(true);
    window.addEventListener("hacxgpt:guest-limit-reached", handleLimit);
    return () =>
      window.removeEventListener("hacxgpt:guest-limit-reached", handleLimit);
  }, []);

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
            <SparklesIcon size={24} />
          </div>
          <AlertDialogTitle className="text-xl">Limit Reached</AlertDialogTitle>
          <AlertDialogDescription className="text-balance">
            You've reached the free guest limit. Sign in to unlock permanent
            history, encrypted key storage, and unlimited multi-provider access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex-col gap-2 sm:flex-col sm:space-x-0">
          <AlertDialogAction
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
            onClick={() => router.push("/register")}
          >
            Create Free Account
          </AlertDialogAction>

          <AlertDialogAction
            className="w-full border border-primary/40 bg-background hover:bg-muted text-foreground transition-colors"
            onClick={() => router.push("/login")}
          >
            Sign In to Existing Node
          </AlertDialogAction>

          <AlertDialogCancel className="w-full border-none bg-transparent hover:bg-muted opacity-60 text-xs">
            Maybe later
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
