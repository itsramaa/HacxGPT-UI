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

import { motion } from "framer-motion";
import { useGuestLimit } from "@/hooks/use-guest-limit";

export function GuestLimitDialog() {
  const { isLimitReached, setLimitReached } = useGuestLimit();
  const router = useRouter();

  return (
    <AlertDialog onOpenChange={setLimitReached} open={isLimitReached}>
      <AlertDialogContent className="max-w-[400px] border-border/40 bg-card/95 p-0 overflow-hidden rounded-[24px] shadow-2xl backdrop-blur-xl">
        <div className="relative p-6 pt-8">
          {/* Background Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

          <AlertDialogHeader className="items-center text-center space-y-4">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <SparklesIcon size={28} />
            </motion.div>

            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Limit Reached
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] leading-relaxed text-muted-foreground/80 px-4">
                You've reached the free guest limit. Sign in to unlock permanent
                history, encrypted key storage, and unlimited multi-provider access.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-8 flex flex-col gap-2.5 sm:flex-col sm:space-x-0">
            <AlertDialogAction
              className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-bold shadow-[0_4px_12px_rgba(var(--primary-rgb),0.25)] hover:bg-primary/90 hover:shadow-[0_6px_16px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-[0.98]"
              onClick={() => router.push("/register")}
            >
              Create Free Account
            </AlertDialogAction>

            <AlertDialogAction
              className="h-11 w-full rounded-xl border border-border/50 bg-background/50 text-foreground font-semibold transition-all hover:bg-muted active:scale-[0.98]"
              onClick={() => router.push("/login")}
            >
              Sign In to Existing Node
            </AlertDialogAction>

            <AlertDialogCancel className="h-10 w-full border-none bg-transparent hover:bg-muted text-[11px] font-medium text-muted-foreground/60 transition-colors uppercase tracking-wider">
              Maybe later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
