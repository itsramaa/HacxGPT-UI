import type { UseChatHelpers } from "@ai-sdk/react";
import { deleteTrailingMessages } from "./actions";
import type { ChatMessage } from "@/lib/types";

/**
 * Handles the logic for submitting an edited message.
 * It deletes trailing messages and updates the message list before regenerating the response.
 */
export async function submitEditedMessage({
  message,
  text,
  setMessages,
  regenerate,
}: {
  message: ChatMessage;
  text: string;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
}) {
  await deleteTrailingMessages({ id: message.id });

  setMessages((messages) => {
    const index = messages.findIndex((m) => m.id === message.id);
    if (index === -1) {
      return messages;
    }

    return [
      ...messages.slice(0, index),
      { ...message, parts: [{ type: "text" as const, text }] },
    ];
  });

  regenerate();
}
