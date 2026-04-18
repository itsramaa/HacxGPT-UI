"use client";

import { useMemo } from "react";
import type { ChatMessage } from "@/lib/types";
import { parseReasoning } from "@/lib/utils";

export function useProcessedMessage(message: ChatMessage, isLoading: boolean) {
  return useMemo(() => {
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

    const isAssistant = message.role === "assistant";
    const hasAnyDisplayableContent = messageContent.trim().length > 0 || hasTools;

    // Determine if we should show the global "Thinking..." shimmer
    // (Only if no content, no tools, and no reasoning text yet)
    const isThinking = isAssistant && isLoading &&
      !hasAnyDisplayableContent &&
      !reasoningText;

    return {
      reasoningText: reasoningText.trim(),
      messageContent: messageContent.trim(),
      isReasoningStreaming,
      hasTools,
      hasAnyDisplayableContent,
      isThinking,
    };
  }, [message.parts, message.role, isLoading]);
}
