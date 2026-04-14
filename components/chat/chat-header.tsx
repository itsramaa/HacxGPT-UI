"use client";

import { MoonIcon, PanelLeftIcon, SearchIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";
import { useActiveChat } from "@/hooks/use-active-chat";

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
  const { searchQuery, setSearchQuery } = useActiveChat();

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
          placeholder="Search within this chat..."
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
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
