"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VersionSwitcherProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function VersionSwitcher({
  current,
  total,
  onPrev,
  onNext,
  className = "",
}: VersionSwitcherProps) {
  if (total <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[10px] font-bold text-muted-foreground/50 select-none",
        className
      )}
    >
      <Button
        className="h-5 w-5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
        disabled={current <= 1}
        onClick={onPrev}
        size="icon"
        variant="ghost"
      >
        <ChevronLeftIcon size={10} />
      </Button>

      <span className="min-w-[28px] text-center tracking-tight">
        {current} / {total}
      </span>

      <Button
        className="h-5 w-5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
        disabled={current >= total}
        onClick={onNext}
        size="icon"
        variant="ghost"
      >
        <ChevronRightIcon size={10} />
      </Button>
    </div>
  );
}
