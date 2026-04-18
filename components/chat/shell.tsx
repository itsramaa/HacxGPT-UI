"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { DataStreamHandler } from "../data-stream-handler";
import { GuestLimitDialog } from "./guest-limit-dialog";
import { submitEditedMessage } from "@/lib/chat/utils";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { AlertCircle, XIcon } from "lucide-react";

import { useChatOrchestrator } from "@/hooks/use-chat-orchestrator";

export function ChatShell() {
  const pathname = usePathname();
  const isChatRoute = pathname === "/" || pathname.startsWith("/chat/");

  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
    input,
    setInput,
    visibilityType,
    isReadonly,
    isLoading,
    currentModelId,
    setCurrentModelId,
    error,
    setError,
  } = useActiveChat();

  const {
    editingMessage,
    setEditingMessage,
    attachments,
    setAttachments,
    handleEditMessage,
    handleCancelEdit,
    handleSubmit,
  } = useChatOrchestrator();

  const stopRef = useRef(stop);
  stopRef.current = stop;

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      stopRef.current();
      setEditingMessage(null);
      setAttachments([]);
    }
  }, [chatId, setEditingMessage, setAttachments]);

  if (!isChatRoute) {
    return null;
  }

  return (
    <>
      <div className="flex h-dvh w-full flex-row overflow-hidden">
        <div
          className={cn(
            "flex min-w-0 flex-col bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "w-full"
          )}
        >
          <ChatHeader
            chatId={chatId}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
            <Messages
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isArtifactVisible={false}
              isLoading={isLoading}
              isReadonly={isReadonly}
              messages={messages}
              onEditMessage={handleEditMessage}
              regenerate={regenerate}
              selectedModelId={currentModelId}
              setMessages={setMessages}
              status={status}
            />

            {error && (
              <div className="mx-auto flex w-full max-w-4xl px-2 md:px-4 bg-background">
                <div className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3 text-red-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AlertCircle className="shrink-0" size={16} />
                  <span className="text-[11px] font-bold leading-tight">{error}</span>
                  <button
                    className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-lg hover:bg-red-500/10"
                    onClick={() => setError(null)}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4 min-h-[50px]">
              <MultimodalInput
                attachments={attachments}
                chatId={chatId}
                editingMessage={editingMessage}
                input={input}
                isLoading={isLoading}
                messages={messages}
                onCancelEdit={handleCancelEdit}
                onModelChange={setCurrentModelId}
                selectedModelId={currentModelId}
                selectedVisibilityType={visibilityType}
                sendMessage={async (opts) => {
                  setError(null);
                  return await handleSubmit(opts);
                }}
                setAttachments={setAttachments}
                setInput={setInput}
                setMessages={setMessages}
                status={status}
                stop={stop}
              />
            </div>
          </div>
        </div>
      </div>

      <DataStreamHandler />
      <GuestLimitDialog />
    </>
  );
}
