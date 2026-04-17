import type {
  UIMessage,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatbotError, type ErrorCode } from './errors';
import type { ChatMessage } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dispatchOfflineEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hacxgpt:offline"));
  }
}

async function safeParseJson(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

export const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const data = await safeParseJson(response);
      if (data?.error === "offline") {
        dispatchOfflineEvent();
      }
      throw new ChatbotError(
        data?.code as ErrorCode,
        data?.cause || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      dispatchOfflineEvent();
    }
    throw err;
  }
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const data = await safeParseJson(response);
      if (data?.error === "offline") {
        dispatchOfflineEvent();
      }
      throw new ChatbotError(
        data?.code as ErrorCode, 
        data?.cause || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response;
  } catch (error: unknown) {
    // Check if it's a network error (server process down)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      dispatchOfflineEvent();
    }
    
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatbotError('offline:chat');
    }

    throw error;
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function parseReasoning(text: string): { reasoning: string; content: string } {
  const thinkStart = text.indexOf("<think>");
  if (thinkStart === -1) {
    return { reasoning: "", content: text };
  }

  const thinkEnd = text.indexOf("</think>", thinkStart);
  if (thinkEnd === -1) {
    // Still thinking (streaming)
    const reasoning = text.substring(thinkStart + 7);
    return { reasoning: reasoning, content: "" };
  }

  // Finished thinking
  const reasoning = text.substring(thinkStart + 7, thinkEnd);
  const content = text.substring(thinkEnd + 8).trim();
  
  // Handle multiple think blocks if they exist (though rare)
  if (content.includes("<think>")) {
    const next = parseReasoning(content);
    return {
      reasoning: reasoning + (next.reasoning ? "\n\n" + next.reasoning : ""),
      content: next.content,
    };
  }

  return { reasoning, content };
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("");
}
