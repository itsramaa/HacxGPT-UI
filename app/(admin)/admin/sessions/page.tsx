"use client";

import {
  ActivityIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useAdminSessions } from "@/hooks/use-admin-sessions";
import { LoaderIcon } from "@/components/chat/icons";
import { SessionTable } from "@/components/admin/session-table";

export default function SessionsAdminPage() {
  const { page, setPage, totalPages, total, isLoading, sessions } =
    useAdminSessions();

  if (isLoading && !sessions.length) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <ActivityIcon className="size-5 text-primary" />
        <h2 className="text-xl font-bold">Global Observability</h2>
      </div>

      <SessionTable sessions={sessions} />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t border-border/10 rounded-2xl border border-border/40">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
          Page {page} of {totalPages || 1}{" "}
          <span className="opacity-40">({total} items tracked)</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
