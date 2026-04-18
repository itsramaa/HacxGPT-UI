"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  SearchIcon,
  TerminalIcon,
  Trash2Icon,
} from "lucide-react";
import { useAdminLogs } from "@/hooks/use-admin-logs";
import { LoaderIcon } from "@/components/chat/icons";
import { LogTerminal } from "@/components/admin/log-terminal";

export default function LogsAdminPage() {
  const {
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    filter,
    setFilter,
    scrollRef,
    filteredLogs,
    clearLogs,
  } = useAdminLogs();

  if (isLoading && !filteredLogs.length) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-280px)]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TerminalIcon className="size-5 text-primary" /> Operational Audit
          Trail
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg bg-muted/40 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
            onClick={clearLogs}
          >
            <Trash2Icon className="size-4" />
          </button>
          <button className="flex items-center gap-2 bg-muted/40 border border-border/40 px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted/70 transition-all font-mono">
            <DownloadIcon className="size-4 font-mono" /> EXPORT_AUDIT.XLSX
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-border/40">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            className="w-full bg-background/50 border border-border/20 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by message or module..."
            type="text"
            value={filter}
          />
        </div>
        {/* Pagination Controls Small */}
        <div className="flex items-center gap-2 px-3 border-l border-border/40">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button
              className="disabled:opacity-20"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="size-3" />
            </button>
            <button
              className="disabled:opacity-20"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRightIcon className="size-3" />
            </button>
          </div>
        </div>
      </div>

      <LogTerminal
        isLoading={isLoading}
        logs={filteredLogs}
        scrollRef={scrollRef}
        total={total}
      />
    </div>
  );
}
