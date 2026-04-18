"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { groupChatsByDate } from "@/lib/date-utils";
import { useHistoryPortal } from "@/hooks/use-history-portal";
import { LoaderIcon } from "@/components/chat/icons";
import { ChatItem } from "./sidebar-history-item";
import { SidebarHistoryDialogs } from "./sidebar-history-dialogs";

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const id = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;

  const {
    chats: chatsFromHistory,
    setSize,
    isValidating,
    isLoading,
    deleteChat,
    renameChat,
    hasReachedEnd,
    hasEmptyChatHistory,
  } = useHistoryPortal(user);

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const chatToDelete = deleteId;
    if (!chatToDelete) { return; }

    const isCurrentChat = pathname === `/chat/${chatToDelete}`;

    await deleteChat(chatToDelete, () => {
      setShowDeleteDialog(false);
      if (isCurrentChat) {
        router.replace("/");
      }
    });
  };

  if (!user) {
    return (
      <div className="flex w-full flex-row items-center justify-center gap-2 px-2 py-4 text-[13px] text-sidebar-foreground/60">
        Login to save and revisit previous chats!
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-0.5 px-1 py-1">
        {[44, 32, 28, 64, 52].map((item) => (
          <div
            className="flex h-8 items-center gap-2 rounded-lg px-2"
            key={item}
          >
            <div
              className="h-3 max-w-(--skeleton-width) flex-1 animate-pulse rounded-md bg-sidebar-foreground/[0.06]"
              style={
                {
                  "--skeleton-width": `${item}%`,
                } as React.CSSProperties
              }
            />
          </div>
        ))}
      </div>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <div className="flex w-full flex-row items-center justify-center gap-2 px-2 py-4 text-[13px] text-sidebar-foreground/60 text-center">
        Your conversations will appear here once you start chatting!
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        <SidebarMenu className="px-0">
          {chatsFromHistory &&
            (() => {
              const groupedChats = groupChatsByDate(chatsFromHistory);
              return (
                <div className="flex flex-col gap-4">
                  {groupedChats.today.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Today
                      </div>
                      {groupedChats.today.map((chat) => (
                        <ChatItem
                          chat={chat}
                          isActive={chat.id === id}
                          key={chat.id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId);
                            setShowDeleteDialog(true);
                          }}
                          onRename={renameChat}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.yesterday.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Yesterday
                      </div>
                      {groupedChats.yesterday.map((chat) => (
                        <ChatItem
                          chat={chat}
                          isActive={chat.id === id}
                          key={chat.id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId);
                            setShowDeleteDialog(true);
                          }}
                          onRename={renameChat}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastWeek.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Last 7 days
                      </div>
                      {groupedChats.lastWeek.map((chat) => (
                        <ChatItem
                          chat={chat}
                          isActive={chat.id === id}
                          key={chat.id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId);
                            setShowDeleteDialog(true);
                          }}
                          onRename={renameChat}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastMonth.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Last 30 days
                      </div>
                      {groupedChats.lastMonth.map((chat) => (
                        <ChatItem
                          chat={chat}
                          isActive={chat.id === id}
                          key={chat.id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId);
                            setShowDeleteDialog(true);
                          }}
                          onRename={renameChat}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.older.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                        Older
                      </div>
                      {groupedChats.older.map((chat) => (
                        <ChatItem
                          chat={chat}
                          isActive={chat.id === id}
                          key={chat.id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId);
                            setShowDeleteDialog(true);
                          }}
                          onRename={renameChat}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
        </SidebarMenu>

        <motion.div
          className="h-8 w-full"
          onViewportEnter={() => {
            if (!isValidating && !hasReachedEnd && chatsFromHistory?.length) {
              setSize((size) => size + 1);
            }
          }}
        />

        {!hasReachedEnd && isValidating && (
          <div className="mt-1 flex flex-row items-center justify-center gap-2 px-4 py-2 text-sidebar-foreground/50">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
            <div className="text-[11px]">Loading...</div>
          </div>
        )}

        <SidebarHistoryDialogs
          confirmDeleteAllOpen={false}
          confirmDeleteOpen={showDeleteDialog}
          onExecuteDelete={handleDelete}
          onExecuteDeleteAll={async () => { }}
          setConfirmDeleteAllOpen={() => { }}
          setConfirmDeleteOpen={setShowDeleteDialog}
        />
      </div>
    </>
  );
}
