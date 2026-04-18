"use client";

import { LogInIcon, PanelLeftIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { VisibilityType } from "../sidebar/visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { searchQuery, setSearchQuery, isGuest } = useActiveChat();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border/10 bg-background/70 px-4 backdrop-blur-md justify-between transition-all duration-300">
      <div className="flex items-center gap-2">
        <Button
          className="md:hidden text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
          onClick={toggleSidebar}
          size="icon-sm"
          variant="ghost"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
      </div>

      <div className="relative flex-1 max-w-sm hidden sm:block group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="size-3.5 text-muted-foreground/40 group-focus-within:text-primary/50 transition-colors duration-300" />
        </div>
        <Input
          className="h-8.5 w-full rounded-full border-border/20 bg-muted/30 pl-9 text-[13px] transition-all duration-300 placeholder:text-muted-foreground/30 focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary/30 focus-visible:shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversation..."
          type="search"
          value={searchQuery}
        />
      </div>

      <div className="flex items-center gap-2">
        {isGuest && (
          <Button
            asChild
            className="h-8 rounded-lg px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 text-[11px] font-bold shadow-lg shadow-primary/20 border border-primary/20"
            size="sm"
          >
            <Link className="flex items-center gap-2" href="/login">
              <LogInIcon className="size-3.5" />
              Sign In
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
