"use client";

import {
  ArrowLeftIcon,
  MessageSquareIcon,
  PanelLeftIcon,
  PenSquareIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import { SidebarAdmin } from "@/components/chat/sidebar-admin";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const handleDeleteAll = async () => {
    setShowDeleteAllDialog(false);
    router.replace("/");

    // Optimistic update: clear history cache
    await mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete all chats");
      }

      toast.success("All chats deleted");
      // Revalidate to sync with server
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    } catch (error) {
      toast.error("Failed to delete all chats. Please try again.");
      // Rollback/Sync
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    }
  };

  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
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
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="gap-0 border-r border-sidebar-border/50">
          {!isAdminPage && (
            <>
              <SidebarGroup className="pt-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className="h-8 rounded-lg border border-sidebar-border text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        onClick={() => {
                          setOpenMobile(false);
                          router.push("/");
                        }}
                        tooltip="New Chat"
                      >
                        <PenSquareIcon className="size-4" />
                        <span className="font-medium">New chat</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {user && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          className="rounded-lg text-sidebar-foreground/40 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setShowDeleteAllDialog(true)}
                          tooltip="Delete All Chats"
                        >
                          <TrashIcon className="size-4" />
                          <span className="text-[13px]">Delete all</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

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
        <SidebarFooter className="border-t border-r border-sidebar-border/50 bg-sidebar-accent/5 p-2">
          {user && <SidebarUserNav user={user} />}
          <div className="px-2 py-1 text-[10px] text-sidebar-foreground/30 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>© 2026 Kawasan Digital</span>
            <span className="opacity-50">v{process.env.NEXT_PUBLIC_APP_VERSION || "1.2.0"}</span>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
