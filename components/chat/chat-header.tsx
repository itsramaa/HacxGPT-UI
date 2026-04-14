"use client";

import { LogInIcon, PanelLeftIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { VisibilityType } from "./visibility-selector";

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
    <header className="sticky top-0 flex h-14 items-center gap-4 bg-sidebar px-4 border-b border-border/10 justify-between">
      <div className="flex items-center gap-2">
        <Button
          className="md:hidden"
          onClick={toggleSidebar}
          size="icon-sm"
          variant="ghost"
        >
          <PanelLeftIcon className="size-4" />
        </Button>

        {/* Visibility selector hidden until sharing is implemented */}
        {/* {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )} */}
      </div>

      <div className="relative flex-1 max-w-sm hidden sm:block">
        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/50" />
        <Input
          className="h-9 w-full rounded-full bg-background/50 pl-9 text-xs focus-visible:ring-primary/20"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search within this chat..."
          type="search"
          value={searchQuery}
        />
      </div>

      <div className="flex items-center gap-2">
        {isGuest && (
          <Button
            asChild
            className="h-8 rounded-lg px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 text-xs font-bold"
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
