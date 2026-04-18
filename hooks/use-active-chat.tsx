"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useDataStream } from "@/components/data-stream-provider";
import { getChatHistoryPaginationKey } from "@/hooks/use-history-portal";
import { toast } from "@/components/toast";
import type { VisibilityType } from "@/components/sidebar/visibility-selector";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

type ActiveChatContextValue = {
  chatId: string;
  messages: ChatMessage[];
  allMessages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  visibilityType: VisibilityType;
  isReadonly: boolean;
  isLoading: boolean;
  currentModelId: string;
  setCurrentModelId: (id: string) => void;
  setPendingAttachmentIds: (ids: string[]) => void;
  switchVersion: (parentId: string, version: number) => void;
  versions: Record<string, number>;
  handleRegenerate: (
    messageId: string,
    providedParentId?: string
  ) => Promise<void>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeTool: string | null;
  setActiveTool: Dispatch<SetStateAction<string | null>>;
  isGuest: boolean;
  isModelAvailable: boolean;
  useSearch: boolean;
  setUseSearch: Dispatch<SetStateAction<boolean>>;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

export function ActiveChatProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: any;
}) {
  const isGuest = !session?.user;
  const pathname = usePathname();
  const { setDataStream } = useDataStream();
  const { mutate } = useSWRConfig();

  const chatIdFromUrl = extractChatId(pathname);
  const isNewChat = !chatIdFromUrl;
  const newChatIdRef = useRef(generateUUID());
  const prevPathnameRef = useRef(pathname);

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  // Regenerate UUID for new chats when pathname changes — must be in useEffect
  // to avoid side-effects during render (which fire twice in React Strict Mode)
  useEffect(() => {
    if (isNewChat && prevPathnameRef.current !== pathname) {
      newChatIdRef.current = generateUUID();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isNewChat]);

  const { data: allModels } = useSWR<any>("/api/models", fetcher);
  const [currentModelId, setCurrentModelState] = useState(DEFAULT_CHAT_MODEL);

  const setCurrentModelId = async (id: string) => {
    setCurrentModelState(id);
    // Mark as initialized so the background sync doesn't overwrite it
    hasInitializedModel.current = chatId;

    // 1. Persist to cookie for new chats inheritance
    document.cookie = `chat-model=${encodeURIComponent(id)}; path=/; max-age=31536000`;

    // 2. If existing chat, sync to backend session
    if (!isNewChat && !isGuest && allModels?.models) {
      const modelDetail = allModels.models.find((m: any) => m.id === id);
      if (modelDetail) {
        try {
          await fetch(`/api/history/${chatId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model_name: modelDetail.name,
              provider_id: modelDetail.providerId,
            }),
          });
          // Mutate the specific chat data to reflect change locally
          mutate(
            `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`
          );
        } catch (err) {
          console.error("Failed to sync model to backend:", err);
        }
      }
    }
  };

  const isModelAvailable = useMemo(() => {
    if (!allModels?.models) {
      return true; // Still allow while loading to avoid flickering
    }
    const model = allModels.models.find((m: any) => m.id === currentModelId);
    if (!model) {
      return false; // If model is selected but not in the list, treat as unavailable
    }
    return !!model.hasKey;
  }, [allModels, currentModelId]);

  // Auto-switch to available model for Guests if current one is broken
  useEffect(() => {
    if (isGuest && allModels?.models && !isModelAvailable) {
      const firstAvailable = allModels.models.find((m: any) => m.hasKey);
      if (firstAvailable) {
        setCurrentModelState(firstAvailable.id);
      }
    }
  }, [allModels, isModelAvailable, isGuest]);

  const currentModelIdRef = useRef(currentModelId);
  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Pending attachment IDs to be sent with the next chat request
  const pendingAttachmentIdsRef = useRef<string[]>([]);
  const setPendingAttachmentIds = (ids: string[]) => {
    pendingAttachmentIdsRef.current = ids;
  };

  const [input, setInput] = useState("");

  const { data: chatData, isLoading } = useSWR(
    isNewChat || isGuest
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const initialMessages: ChatMessage[] = isNewChat
    ? []
    : (chatData?.messages ?? []);
  const visibility: VisibilityType = isNewChat
    ? "private"
    : (chatData?.visibility ?? "private");

  const [versionMap, setVersionMap] = useState<Record<string, number>>({});
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);

  useEffect(() => {
    if (chatData?.activeVersions) {
      setVersionMap(chatData.activeVersions);
    }
  }, [chatData?.activeVersions]);

  const useSearchRef = useRef(useSearch);
  useEffect(() => {
    useSearchRef.current = useSearch;
  }, [useSearch]);

  const visibilityRef = useRef(visibility);
  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  const router = useRouter();

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    generateId: generateUUID,
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      return (
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
      fetch: async (url, init) => {
        const response = await fetchWithErrorHandlers(url, init);
        const actualId = response.headers.get("X-Chat-Id");

        // If we got an ID and we were in "New Chat" mode, update the URL
        if (actualId && (actualId !== chatId || isNewChat)) {
          newChatIdRef.current = actualId;
          // Use router.replace to update the URL without losing state
          router.replace(
            `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${actualId}`
          );

          // Immediately mutate sidebar so the new chat shows up while generating
          setTimeout(() => {
            mutate(unstable_serialize(getChatHistoryPaginationKey));
          }, 0);
        }
        return response;
      },
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const state = (part as { state?: string }).state;
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        const attachmentIds = pendingAttachmentIdsRef.current;
        pendingAttachmentIdsRef.current = []; // consume & clear

        return {
          body: {
            id: chatIdFromUrl ?? newChatIdRef.current,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityRef.current,
            use_search: useSearchRef.current,
            ...(attachmentIds.length > 0
              ? { attachment_ids: attachmentIds }
              : {}),
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart as any] : []));

      // Real-time tool/usage/metadata update
      try {
        const part = dataPart as any;
        if (part?.tool_call) {
          setActiveTool(part.tool_call);
        }

        // Capture metadata sent at the end of the stream
        if (part?.message_id) {
          setMessages((prev) => {
            const lastMessage = prev.at(-1);
            if (lastMessage && lastMessage.role === "assistant") {
              return prev.map((m, idx) =>
                idx === prev.length - 1
                  ? {
                    ...m,
                    id: part.message_id,
                    metadata: {
                      ...m.metadata,
                      parentId: part.parent_id,
                      version: part.version,
                      promptTokens: part.usage?.prompt_tokens,
                      completionTokens: part.usage?.completion_tokens,
                      totalTokens: part.usage?.total_tokens,
                    },
                  }
                  : m
              );
            }
            return prev;
          });
        }
      } catch (_e) { }
    },
    onFinish: (_message) => {
      setActiveTool(null);
      if (isGuest) { return; }

      const historyKey = unstable_serialize(getChatHistoryPaginationKey);
      const currentChatKey = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`;

      mutate(historyKey);
      mutate(currentChatKey);

      // Real-time usage update: Trigger session update
      // This will cause SidebarUserNav to re-fetch the user profile with new total_usage
      if (typeof window !== "undefined") {
        // Dispatch a custom event and revalidate SWR for profile
        window.dispatchEvent(new CustomEvent("hacxgpt:usage-updated"));
        // If we had a specific SWR hook for profile, we'd mutate it here.
        // For now, let's just re-fetch /api/auth/me to update the local cached session data
        // Next-auth session is harder to force-update, but we can try to poke it.
      }

      // If this was a new chat starting, the title is likely being generated in background.
      // We poll a few times to ensure both sidebar and current page catch changes.
      if (
        messages.length <= 3 &&
        (chatData?.title === "New Chat" || !chatData?.title)
      ) {
        const poll = () => {
          mutate(historyKey);
          mutate(currentChatKey);
        };

        setTimeout(poll, 2000);
        setTimeout(poll, 5000);
        setTimeout(poll, 10_000);
      }
    },
    onError: (error) => {
      const isGuestLimit =
        (error as any).cause?.includes("Guest limit reached") ||
        error.message?.includes("Guest limit reached");

      if (isGuestLimit) {
        window.dispatchEvent(new CustomEvent("hacxgpt:guest-limit-reached"));
        return;
      }

      if (error instanceof ChatbotError) {
        toast({ type: "error", description: error.message });
      } else {
        toast({
          type: "error",
          description: error.message || "Oops, an error occurred!",
        });
      }
    },
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleRegenerate = useCallback(
    async (messageId: string, providedParentId?: string) => {
      let parentId = providedParentId;

      if (!parentId) {
        // 1. Find the assistant message being regenerated to find its parent
        const targetMsg = messages.find((m) => m.id === messageId);
        if (!targetMsg || targetMsg.role !== "assistant") { return; }

        // 2. Find its parent (the user message)
        parentId = targetMsg.metadata?.parentId;
      }

      if (!parentId) {
        toast({
          type: "error",
          description: "Cannot regenerate: original prompt not found.",
        });
        return;
      }

      if (!isModelAvailable) {
        toast({
          type: "error",
          description: "Please configure an API key for this model first!",
        });
        return;
      }

      try {
        await sendMessage(
          {
            role: "assistant",
            parts: [{ type: "text", text: "" }],
          },
          {
            body: { parent_id: parentId },
          }
        );
      } catch (_err) {
        toast({ type: "error", description: "Regeneration failed." });
      }
    },
    [messages, sendMessage, isModelAvailable]
  );

  const switchVersion = useCallback(
    async (parentId: string, version: number) => {
      // 1. Update local state for immediate response
      setVersionMap((prev) => ({ ...prev, [parentId]: version }));

      // 2. Persist to backend
      if (!isNewChat) {
        try {
          await fetch(`/api/history/${chatId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              active_versions: { ...versionMap, [parentId]: version },
            }),
          });
        } catch (err) {
          console.error("Failed to persist version selection:", err);
        }
      }
    },
    [chatId, isNewChat, versionMap]
  );

  const loadedChatIds = useRef(new Set<string>());

  if (isNewChat && !loadedChatIds.current.has(newChatIdRef.current)) {
    loadedChatIds.current.add(newChatIdRef.current);
  }

  useEffect(() => {
    if (loadedChatIds.current.has(chatId)) {
      return;
    }
    // Only overwrite if we have new messages from the server, 
    // or if the server explicitly confirms it's an existing chat but empty.
    if (chatData?.messages && (chatData.messages.length > 0 || !isLoading)) {
      loadedChatIds.current.add(chatId);
      // We only call setMessages if the incoming data actually contains something
      // or if we're switching between old chats (to avoid clearing new chat local state)
      if (chatData.messages.length > 0) {
        setMessages(chatData.messages);
      }
    }
  }, [chatId, chatData?.messages, isLoading, setMessages]);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      if (isNewChat) {
        setMessages([]);
      }
    }
  }, [chatId, isNewChat, setMessages]);

  const hasInitializedModel = useRef<string | null>(null);

  useEffect(() => {
    // If we already initialized the model for THIS chat instance, stop.
    if (hasInitializedModel.current === chatId) {
      return;
    }

    if (chatData && !isNewChat) {
      if (chatData.modelId) {
        setCurrentModelState(chatData.modelId);
        hasInitializedModel.current = chatId;
      } else {
        const cookieModel = document.cookie
          .split("; ")
          .find((row) => row.startsWith("chat-model="))
          ?.split("=")[1];
        if (cookieModel) {
          setCurrentModelState(decodeURIComponent(cookieModel));
          hasInitializedModel.current = chatId;
        }
      }
    } else if (isNewChat) {
      const cookieModel = document.cookie
        .split("; ")
        .find((row) => row.startsWith("chat-model="))
        ?.split("=")[1];
      if (cookieModel) {
        setCurrentModelState(decodeURIComponent(cookieModel));
        hasInitializedModel.current = chatId;
      }
    }
  }, [chatData, isNewChat, chatId]);

  const hasAppendedQueryRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    if (query && !hasAppendedQueryRef.current) {
      hasAppendedQueryRef.current = true;
      window.history.replaceState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });
    }
  }, [sendMessage, chatId]);

  useAutoResume({
    autoResume: !isNewChat && !!chatData,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const isReadonly = isNewChat ? false : (chatData?.isReadonly ?? false);

  // --- Filtering Branched Messages ---
  const activeMessages = useMemo(() => {
    // 1. Group assistant messages by parentId
    const siblingsByParent: Record<string, ChatMessage[]> = {};
    messages.forEach((m) => {
      if (m.role === "assistant" && m.metadata?.parentId) {
        if (!siblingsByParent[m.metadata.parentId]) {
          siblingsByParent[m.metadata.parentId] = [];
        }
        siblingsByParent[m.metadata.parentId].push(m);
      }
    });

    // 2. Filter: If a position has multiple versions, pick the one from versionMap or the latest one
    return messages.filter((m) => {
      if (m.role === "assistant" && m.metadata?.parentId) {
        const siblings = siblingsByParent[m.metadata.parentId];
        if (siblings.length <= 1) { return true; }

        const selectedVersion =
          versionMap[m.metadata.parentId] ??
          siblings.at(-1)?.metadata?.version ??
          1;
        return m.metadata?.version === selectedVersion;
      }
      return true;
    });
  }, [messages, versionMap]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) { return activeMessages; }
    const query = searchQuery.toLowerCase();
    return activeMessages.filter((m) =>
      m.parts?.some(
        (p) => p.type === "text" && p.text?.toLowerCase().includes(query)
      )
    );
  }, [activeMessages, searchQuery]);

  // We should only show a "loading" state if we are actually at a chat route that we haven't loaded yet.
  // But if it's a new chat that just transitioned, we don't want to show loading because we already have messages.
  const isFetchingSession = !isNewChat && isLoading && messages.length === 0;

  const value = useMemo<ActiveChatContextValue>(
    () => ({
      chatId,
      messages: filteredMessages,
      allMessages: messages,
      setMessages,
      sendMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      setInput,
      visibilityType: visibility,
      isReadonly,
      isLoading: isFetchingSession,
      currentModelId,
      setCurrentModelId,
      setPendingAttachmentIds,
      activeTool,
      setActiveTool,
      switchVersion,
      versions: versionMap,
      handleRegenerate,
      searchQuery,
      setSearchQuery,
      isGuest,
      isModelAvailable,
      useSearch,
      setUseSearch,
    }),
    [
      chatId,
      filteredMessages,
      messages,
      setMessages,
      sendMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      visibility,
      isReadonly,
      isFetchingSession,
      currentModelId,
      activeTool,
      switchVersion,
      versionMap,
      handleRegenerate,
      searchQuery,
      isGuest,
      isModelAvailable,
      useSearch,
      setUseSearch,
    ]
  );

  return (
    <ActiveChatContext.Provider value={value}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return context;
}
