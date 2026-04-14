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

export const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const data = await response.json();
      if (data.error === "offline") {
        dispatchOfflineEvent();
      }
      throw new ChatbotError(data.code as ErrorCode, data.cause);
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
      const data = await response.json();
      if (data.error === "offline") {
        dispatchOfflineEvent();
      }
      throw new ChatbotError(data.code as ErrorCode, data.cause);
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

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string}).text)
    .join('');
}
