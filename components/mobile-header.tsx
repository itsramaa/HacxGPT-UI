"use client";

import { PanelLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export function MobileHeader({ title, className, children }: MobileHeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className={cn(
      "flex md:hidden h-14 shrink-0 items-center gap-4 border-b border-border/10 bg-background/50 backdrop-blur-md px-4 sticky top-0 z-50",
      className
    )}>
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-foreground active:scale-95 transition-all"
      >
        <PanelLeftIcon className="size-4" />
      </Button>
      {title && (
        <div className="font-bold text-sm tracking-tight uppercase opacity-80 truncate flex-1">
          {title}
        </div>
      )}
      {children && (
        <div className="ml-auto flex items-center gap-2">
          {children}
        </div>
      )}
    </header>
  );
}
