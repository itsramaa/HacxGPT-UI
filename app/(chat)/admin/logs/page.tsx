"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
  DownloadIcon,
  SearchIcon,
  TerminalIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { LoaderIcon } from "@/components/chat/icons";
import { toast } from "@/components/chat/toast";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG" | "SECURITY";
  module: string;
  message: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogsAdminPage() {
  const [page, setPage] = useState(1);
  const size = 20;
  const {
    data,
    mutate: mutateLogs,
    isLoading,
  } = useSWR(`/api/admin/logs?page=${page}&size=${size}`, fetcher, {
    refreshInterval: 5000,
  });
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const logs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / size);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const levelColors = {
    INFO: "text-emerald-400 mr-4",
    WARN: "text-orange-400 mr-4",
    ERROR: "text-red-400 mr-4",
    DEBUG: "text-blue-400 mr-4",
    SECURITY:
      "text-purple-400 font-black tracking-widest outline outline-1 outline-purple-500/30 px-1 rounded animate-pulse mr-4",
  };

  const clearLogs = async () => {
    toast({ type: "success", description: "Audit buffer cleared." });
    mutateLogs({ items: [], total: 0, page: 1, size }, false);
  };

  const filteredLogs =
    logs?.filter(
      (l: LogEntry) =>
        l.message.toLowerCase().includes(filter.toLowerCase()) ||
        l.module.toLowerCase().includes(filter.toLowerCase())
    ) || [];

  if (isLoading && !data) {
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

      {/* Log Terminal */}
      <div className="flex-1 rounded-2xl border border-primary/20 overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/10 border-b border-border/10">
          <div className="flex items-center gap-1.5">
            <CircleIcon className="size-2 fill-red-500 text-red-500" />
            <CircleIcon className="size-2 fill-orange-500 text-orange-500" />
            <CircleIcon className="size-2 fill-emerald-500 text-emerald-500" />
          </div>
          <div className="mx-auto text-[10px] font-mono text-muted-foreground/50 tracking-widest uppercase">
            HacxGPT_CLI_BUFFER v1.0.4{" "}
            <span className="ml-2 opacity-80">| TOTAL_RECORDS: {total}</span>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed selection:bg-primary/30"
          ref={scrollRef}
        >
          {filteredLogs.map((log: LogEntry, i: number) => (
            <div
              className="flex gap-4 group hover:bg-white/5 py-0.5 px-1 rounded transition-colors"
              key={i}
            >
              <span className="text-muted-foreground/40 shrink-0 select-none">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span
                className={`font-bold shrink-0 w-12 ${levelColors[log.level] || "text-muted-foreground"}`}
              >
                {log.level}
              </span>
              <span className="text-primary/70 shrink-0 w-16">
                [{log.module}]
              </span>
              <span className="text-foreground/80">{log.message}</span>
            </div>
          ))}
          {!filteredLogs.length && !isLoading && (
            <div className="text-muted-foreground/30 py-4 italic">
              End of stream or no matches on this page.
            </div>
          )}
          <div className="flex gap-2 text-primary animate-pulse py-2">
            <span>_</span>
          </div>
        </div>
      </div>
    </div>
  );
}
