import { CircleIcon } from "lucide-react";
import React from "react";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG" | "SECURITY";
  module: string;
  message: string;
}

export function LogTerminal({
  logs,
  total,
  scrollRef,
  isLoading,
}: {
  logs: LogEntry[];
  total: number;
  scrollRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
}) {
  const levelColors = {
    INFO: "text-emerald-400 mr-4",
    WARN: "text-orange-400 mr-4",
    ERROR: "text-red-400 mr-4",
    DEBUG: "text-blue-400 mr-4",
    SECURITY:
      "text-purple-400 font-black tracking-widest outline outline-1 outline-purple-500/30 px-1 rounded animate-pulse mr-4",
  };

  return (
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
        {logs.map((log, i) => (
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
        {!logs.length && !isLoading && (
          <div className="text-muted-foreground/30 py-4 italic">
            End of stream or no matches on this page.
          </div>
        )}
        <div className="flex gap-2 text-primary animate-pulse py-2">
          <span>_</span>
        </div>
      </div>
    </div>
  );
}
