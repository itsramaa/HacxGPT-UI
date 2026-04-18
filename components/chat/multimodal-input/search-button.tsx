"use client";

import { memo } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
import { GlobeIcon } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function PureSearchButton({
  isEnabled,
  onClick,
  status,
}: {
  isEnabled: boolean;
  onClick: () => void;
  status: UseChatHelpers<ChatMessage>["status"];
}) {
  return (
    <Button
      className={cn(
        "h-7 px-2.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-[11px] font-bold shadow-sm",
        isEnabled
          ? "bg-primary/10 border-primary/30 text-primary shadow-primary/10"
          : "bg-background/40 border-border/40 text-muted-foreground hover:border-border hover:text-foreground hover:bg-background/60"
      )}
      disabled={status !== "ready"}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      variant="ghost"
    >
      <GlobeIcon className={cn("size-3.5", isEnabled && "animate-pulse")} />
      <span>Search</span>
      {isEnabled && (
        <div className="size-1 rounded-full bg-primary animate-ping" />
      )}
    </Button>
  );
}

export const SearchButton = memo(PureSearchButton);
