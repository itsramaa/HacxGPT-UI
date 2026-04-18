"use client";

import {
  MessageSquareIcon,
  PanelLeftIcon,
  PenSquareIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useState } from "react";
import { useHistoryPortal } from "@/hooks/use-history-portal";
import { SidebarAdmin } from "@/components/sidebar/sidebar-admin";
import { SidebarHistory } from "@/components/sidebar/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar/sidebar-user-nav";
import { SidebarHistoryDialogs } from "./sidebar-history-dialogs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { deleteAllChats } = useHistoryPortal(user);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const handleDeleteAll = async () => {
    await deleteAllChats(() => {
      setShowDeleteAllDialog(false);
      router.replace("/");
    });
  };

  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <>
      <Sidebar collapsible="icon" className="h-full flex flex-col">
        <SidebarHeader className="shrink-0 sticky top-0 z-30 bg-sidebar/95 backdrop-blur-md pb-2 pt-3 border-b border-sidebar-border/30">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="group/logo relative flex items-center justify-center">
                <SidebarMenuButton
                  asChild
                  className="size-8 !px-0 items-center justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                  tooltip="Chatbot"
                >
                  <Link href="/" onClick={() => setOpenMobile(false)}>
                    <MessageSquareIcon className="size-4 text-sidebar-foreground/50" />
                  </Link>
                </SidebarMenuButton>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className="pointer-events-none absolute inset-0 size-8 opacity-0 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:group-hover/logo:opacity-100"
                      onClick={() => toggleSidebar()}
                    >
                      <PanelLeftIcon className="size-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block" side="right">
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger className="text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground" />
              </div>
            </SidebarMenuItem>

            {!isAdminPage && (
              <div className="group-data-[collapsible=icon]:hidden pt-2 flex flex-col gap-1">
                {pathname !== "/chat/demo" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="h-10 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 text-[13px] text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground active:scale-[0.98] md:h-9 md:rounded-lg md:border-sidebar-border md:bg-transparent md:text-sidebar-foreground/70 md:hover:bg-sidebar-accent/50"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push("/");
                      }}
                      tooltip="New Chat"
                    >
                      <PenSquareIcon className="size-4" />
                      <span className="font-semibold text-sm">New chat</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="rounded-xl text-sidebar-foreground/50 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] md:rounded-lg md:text-sidebar-foreground/40"
                      onClick={() => setShowDeleteAllDialog(true)}
                      tooltip="Delete All Chats"
                    >
                      <TrashIcon className="size-4 text-destructive/60" />
                      <span className="text-[12px] font-medium">Clear history</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <div className="h-px bg-sidebar-border/30 my-1 mx-2" />
              </div>
            )}
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="gap-0 border-r border-sidebar-border/50 flex-1 overflow-y-auto">
          {!isAdminPage && (
            <>
              <SidebarGroup className="px-1 pr-2 pt-0">
                <SidebarGroupLabel className="h-6 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30">
                  History
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarHistory user={user} />
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {isAdminPage && <SidebarAdmin />}
        </SidebarContent>
        <SidebarFooter className="border-t border-r border-sidebar-border/50 bg-sidebar-accent/5 p-2 shrink-0">
          {user && <SidebarUserNav user={user} />}
          <div className="px-2 py-1 text-[10px] text-sidebar-foreground/30 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>© 2026 Holycan</span>
            <span className="opacity-50">
              v{process.env.NEXT_PUBLIC_APP_VERSION || "1.2.0"}
            </span>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarHistoryDialogs
        confirmDeleteAllOpen={showDeleteAllDialog}
        confirmDeleteOpen={false}
        onExecuteDelete={async () => { }}
        onExecuteDeleteAll={handleDeleteAll}
        setConfirmDeleteAllOpen={setShowDeleteAllDialog}
        setConfirmDeleteOpen={() => { }}
      />
    </>
  );
}