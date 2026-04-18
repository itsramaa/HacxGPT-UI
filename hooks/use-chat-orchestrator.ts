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

  const handleSubmit = useCallback(async () => {
    if (editingMessage) {
      const msgToEdit = editingMessage;
      setEditingMessage(null);
      
      await submitEditedMessage({
        message: msgToEdit,
        text: input,
        setMessages,
        regenerate,
      });
      
      setInput("");
    } else {
      // Logic for new message is handled by MultimodalInput calling sendMessage normally
      // But we expose this to keep it consistent
      return sendMessage({
        role: "user",
        parts: [{ type: "text", text: input }]
      });
    }
  }, [editingMessage, input, setMessages, regenerate, setInput, sendMessage]);

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
