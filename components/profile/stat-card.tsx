import { cn } from "@/lib/utils";
import React from "react";

export function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-background/40 border border-border/10 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-background/60">
      <div
        className={cn(
          "size-10 rounded-xl flex items-center justify-center bg-background/50",
          color
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[1px] text-muted-foreground opacity-60 leading-none mb-1">
          {label}
        </p>
        <p className="text-base font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}
