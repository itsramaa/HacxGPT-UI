import useSWRInfinite from "swr/infinite";
import { toast } from "sonner";
import { fetcher } from "@/lib/utils";
import type { Chat } from "@/lib/types";

const PAGE_SIZE = 20;

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }
  if (pageIndex === 0) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?limit=${PAGE_SIZE}`;
  }
  const oldestChatFromPage = previousPageData.chats.at(-1);
  if (!oldestChatFromPage) {
    return null;
  }
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?starting_after=${oldestChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function useHistoryPortal(user: any) {
  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    user ? getChatHistoryPaginationKey : () => null,
    fetcher,
    { fallbackData: [], revalidateOnFocus: false }
  );

  const deleteChat = async (chatId: string, onSuccess?: () => void) => {
    // Optimistic update
    await mutate(
      (chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((chatHistory) => ({
            ...chatHistory,
            chats: chatHistory.chats.filter((chat) => chat.id !== chatId),
          }));
        }
        return chatHistories;
      },
      { revalidate: false }
    );

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Deletion failed");
      toast.success("Chat deleted");
      await mutate();
      onSuccess?.();
      return true;
    } catch (err) {
      toast.error("Failed to delete chat.");
      mutate();
      return false;
    }
  };

  const deleteAllChats = async (onSuccess?: () => void) => {
    // Optimistic update
    await mutate([], { revalidate: false });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Bulk deletion failed");
      toast.success("All chats deleted");
      await mutate();
      onSuccess?.();
      return true;
    } catch (err) {
      toast.error("Failed to clear history.");
      mutate();
      return false;
    }
  };

  const renameChat = async (chatId: string, title: string, onSuccess?: () => void) => {
    // Optimistic update
    await mutate(
      (chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((chatHistory) => ({
            ...chatHistory,
            chats: chatHistory.chats.map((chat) =>
              chat.id === chatId ? { ...chat, title } : chat
            ),
          }));
        }
        return chatHistories;
      },
      { revalidate: false }
    );

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/sessions/${chatId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );
      if (!response.ok) throw new Error("Rename failed");
      toast.success("Chat renamed");
      await mutate();
      onSuccess?.();
      return true;
    } catch (err) {
      toast.error("Failed to rename chat.");
      mutate();
      return false;
    }
  };

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const chats = paginatedChatHistories?.flatMap((page) => page.chats) ?? [];

  return {
    chats,
    setSize,
    isValidating,
    isLoading,
    mutate,
    deleteChat,
    deleteAllChats,
    renameChat,
    hasReachedEnd,
    hasEmptyChatHistory,
  };
}
