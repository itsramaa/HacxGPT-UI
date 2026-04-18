"use client";
import { useMemo } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText, parseReasoning } from "@/lib/utils";
import { MessageContent, MessageResponse } from "../ai-elements/message";
import { Shimmer } from "../ai-elements/shimmer";
import { useDataStream } from "../data-stream-provider";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { VersionSwitcher } from "./version-switcher";

import { motion } from "framer-motion";
import { useProcessedMessage } from "@/hooks/use-processed-message";

const PurePreviewMessage = ({
  chatId,
  message,
  isLoading,
  setMessages: _setMessages,
  regenerate: _regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
  onEdit,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  onEdit?: (message: ChatMessage) => void;
}) => {
  const processed = useProcessedMessage(message, isLoading);
  useDataStream();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  const attachments = attachmentsFromMessage.length > 0 && (
    <div
      className={cn(
        "flex flex-row gap-2 mt-1",
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={"message-attachments"}
    >
      {attachmentsFromMessage.map((attachment) => (
        <PreviewAttachment
          attachment={{
            name: attachment.filename ?? "file",
            contentType: attachment.mediaType,
            url: attachment.url,
          }}
          key={attachment.url}
        />
      ))}
    </div>
  );

  const reasoningDropdown = processed.reasoningText && (
    <MessageReasoning
      isLoading={isLoading || processed.isReasoningStreaming}
      key={`reasoning-${message.id}`}
      reasoning={processed.reasoningText}
    />
  );

  const parts = message.parts
    ?.map((part, index) => {
      if (part.type === "reasoning") return null;

      if (part.type === "text") {
        const { content } = parseReasoning(part.text);
        const finalContent = sanitizeText(content);

        if (!finalContent.trim()) return null;

        return (
          <MessageContent
            className={cn({
              "text-[13px] leading-[1.65] w-fit max-w-full overflow-hidden break-words rounded-2xl rounded-tr-lg sm:rounded-2xl sm:rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-4 py-2.5 shadow-[var(--shadow-card)]":
                message.role === "user",
              "markdown-content": message.role === "assistant",
            })}
            data-testid="message-content"
            key={`part-${index}`}
          >
            <MessageResponse>{finalContent}</MessageResponse>
          </MessageContent>
        );
      }

      return null;
    })
    .filter(Boolean);

  const actions = !isReadonly && (
    <MessageActions
      chatId={chatId}
      isLoading={isLoading}
      key={`action-${message.id}`}
      message={message}
      onEdit={onEdit ? () => onEdit(message) : undefined}
    />
  );

  const { activeTool } = useActiveChat();
  const thinkingLabel =
    activeTool === "search_web" ? "Searching the web..." : "Thinking...";

  const content = processed.isThinking ? (
    <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
      <Shimmer className="font-medium opacity-80" duration={1.5}>
        {thinkingLabel}
      </Shimmer>
    </div>
  ) : (
    <div className={cn("flex flex-col gap-2.5", isUser && "items-end")}>
      {attachments}
      {reasoningDropdown}
      {parts}
      {actions}
    </div>
  );

  return (
    <div
      className={cn(
        "group/message w-full",
        !isAssistant && "animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
      )}
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          isUser ? "flex flex-col items-end gap-2" : "flex items-start gap-3"
        )}
      >
        {isAssistant && (
          <motion.div
            animate={isLoading ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
            className="flex h-[calc(13px*1.65)] shrink-0 items-center"
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-b from-muted to-muted/40 text-muted-foreground ring-1 ring-border/50 shadow-sm relative overflow-hidden group-hover/message:ring-primary/20 transition-all duration-300">
              <SparklesIcon size={13} />
              {isLoading && (
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              )}
            </div>
          </motion.div>
        )}
        {isAssistant ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {content}
            <VersionControl message={message} />
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

function VersionControl({ message }: { message: ChatMessage }) {
  const { allMessages, switchVersion } = useActiveChat();
  const parentId = message.metadata?.parentId;
  if (!parentId) {
    return null;
  }

  const siblings = allMessages
    .filter((m) => m.role === "assistant" && m.metadata?.parentId === parentId)
    .sort((a, b) => (a.metadata?.version ?? 0) - (b.metadata?.version ?? 0));

  if (siblings.length <= 1) {
    return null;
  }

  const currentVersion = message.metadata?.version ?? 1;
  const totalVersions = siblings.length;

  const handlePrev = () => {
    const prevIdx =
      siblings.findIndex((s) => s.metadata?.version === currentVersion) - 1;
    if (prevIdx >= 0) {
      switchVersion(parentId, siblings[prevIdx].metadata?.version ?? 1);
    }
  };

  const handleNext = () => {
    const nextIdx =
      siblings.findIndex((s) => s.metadata?.version === currentVersion) + 1;
    if (nextIdx < siblings.length) {
      switchVersion(parentId, siblings[nextIdx].metadata?.version ?? 1);
    }
  };

  return (
    <VersionSwitcher
      className="mt-1.5 opacity-0 group-hover/message:opacity-100 transition-opacity"
      current={currentVersion}
      onNext={handleNext}
      onPrev={handlePrev}
      total={totalVersions}
    />
  );
}

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  const { activeTool } = useActiveChat();

  const label =
    activeTool === "search_web" ? "Searching the web..." : "Thinking...";

  return (
    <div
      className="group/message w-full"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50 shadow-sm relative overflow-hidden">
            <SparklesIcon size={13} />
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          </div>
        </div>

        <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
          <Shimmer className="font-medium opacity-80" duration={1.5}>
            {label}
          </Shimmer>
        </div>
      </div>
    </div>
  );
};
