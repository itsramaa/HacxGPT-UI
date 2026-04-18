"use client";

import { useState, useCallback } from "react";
import type { Attachment, ChatMessage } from "@/lib/types";
import { useActiveChat } from "./use-active-chat";
import { submitEditedMessage } from "@/lib/chat/utils";

export function useChatOrchestrator() {
  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    input,
    setInput,
  } = useActiveChat();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleEditMessage = useCallback((msg: ChatMessage) => {
    const text = msg.parts
      ?.filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
    
    setInput(text ?? "");
    setEditingMessage(msg);
  }, [setInput]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setInput("");
  }, [setInput]);

  const handleSubmit = useCallback(
    async (override?: string | ChatMessage | any) => {
      if (typeof override === "object" && override !== null && "role" in override) {
        return sendMessage(override);
      }

      if (editingMessage) {
        const msgToEdit = editingMessage;
        setEditingMessage(null);

        await submitEditedMessage({
          message: msgToEdit,
          text: typeof override === "string" ? override : input,
          setMessages,
          regenerate,
        });

        setInput("");
      } else {
        const textToSend = typeof override === "string" ? override : input;
        if (!textToSend?.trim()) return;

        return sendMessage({
          role: "user",
          parts: [{ type: "text", text: textToSend }],
        });
      }
    },
    [editingMessage, input, setMessages, regenerate, setInput, sendMessage]
  );

  return {
    editingMessage,
    setEditingMessage,
    attachments,
    setAttachments,
    handleEditMessage,
    handleCancelEdit,
    handleSubmit,
  };
}
