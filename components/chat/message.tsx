"use client";
import { useMemo } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText, parseReasoning } from "@/lib/utils";
import { MessageContent, MessageResponse } from "../ai-elements/message";
import { Shimmer } from "../ai-elements/shimmer";
import { useDataStream } from "./data-stream-provider";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { VersionSwitcher } from "./version-switcher";

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
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // 1. Process all parts to extract reasoning and actual content
  const processedMessage = useMemo(() => {
    let reasoningText = "";
    let messageContent = "";
    let isReasoningStreaming = false;
    let hasTools = false;

    message.parts?.forEach((part) => {
      if (part.type === "reasoning") {
        reasoningText += (reasoningText ? "\n\n" : "") + (part.text || "");
        if ("state" in part && part.state === "streaming") isReasoningStreaming = true;
      } else if (part.type === "text") {
        const { reasoning, content } = parseReasoning(part.text);
        if (reasoning) {
          reasoningText += (reasoningText ? "\n\n" : "") + reasoning;
          if (isLoading && !part.text.includes("</think>")) isReasoningStreaming = true;
        }
        messageContent += content;
      } else if (part.type.startsWith("tool-")) {
        hasTools = true;
      }
    });

    return {
      reasoningText: reasoningText.trim(),
      messageContent: messageContent.trim(),
      isReasoningStreaming,
      hasTools,
      hasAnyDisplayableContent: messageContent.trim().length > 0 || hasTools,
    };
  }, [message.parts, isLoading]);

  const attachments = attachmentsFromMessage.length > 0 && (
    <div
      className={cn(
        "flex flex-row gap-2",
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

  // 2. Determine if we should show the global "Thinking..." shimmer
  // (Only if no content, no tools, and no reasoning text yet)
  const isThinking = isAssistant && isLoading &&
    !processedMessage.hasAnyDisplayableContent &&
    !processedMessage.reasoningText;

  const reasoningDropdown = processedMessage.reasoningText && (
    <MessageReasoning
      isLoading={isLoading || processedMessage.isReasoningStreaming}
      key={`reasoning-${message.id}`}
      reasoning={processedMessage.reasoningText}
    />
  );

  const parts = message.parts
    ?.map((part, index) => {
      const { type } = part;
      const key = `message-${message.id}-part-${index}`;

      if (type === "reasoning") return null; // Handled by reasoningDropdown

      if (type === "text") {
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
            key={key}
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

  const content = isThinking ? (
    <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
      <Shimmer className="font-medium" duration={1}>
        {thinkingLabel}
      </Shimmer>
    </div>
  ) : (
    <div className={cn("flex flex-col gap-2", isUser && "items-end")}>
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
          <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={13} />
            </div>
          </div>
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
  const { allMessages, versions, switchVersion } = useActiveChat();
  const parentId = message.metadata?.parentId;
  if (!parentId) { return null; }

  const siblings = allMessages
    .filter((m) => m.role === "assistant" && m.metadata?.parentId === parentId)
    .sort((a, b) => (a.metadata?.version ?? 0) - (b.metadata?.version ?? 0));

  if (siblings.length <= 1) { return null; }

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
      className="mt-1"
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
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
            <SparklesIcon size={13} />
          </div>
        </div>

        <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
          <Shimmer className="font-medium" duration={1}>
            {label}
          </Shimmer>
        </div>
      </div>
    </div>
  );
};
