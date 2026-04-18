"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";
import { toast } from "sonner";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { Attachment, ChatMessage } from "@/lib/types";
import { slashCommands, type SlashCommand } from "@/components/chat/slash-commands";
import { useActiveChat } from "@/hooks/use-active-chat";

export function useMultimodalHandlers({
  chatId,
  input,
  setInput,
  attachments,
  setAttachments,
  setMessages,
  sendMessage,
  editingMessage,
  status,
}: {
  chatId: string;
  input: string;
  setInput: (val: string) => void;
  attachments: Attachment[];
  setAttachments: (val: (prev: Attachment[]) => Attachment[]) => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: (msg: any) => void | Promise<void>;
  editingMessage?: ChatMessage | null;
  status: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTheme, resolvedTheme } = useTheme();
  const { setPendingAttachmentIds, isModelAvailable } = useActiveChat();
  const [isUploading, setIsUploading] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [localStorageInput, setLocalStorageInput] = useLocalStorage("input", "");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSubmittedQuery = useRef<string | null>(null);

  // Sync with Local Storage
  useEffect(() => {
    if (textareaRef.current) {
      const finalValue = textareaRef.current.value || localStorageInput || "";
      setInput(finalValue);
    }
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = useCallback((val: string) => {
    setInput(val);
    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashOpen(true);
      setSlashQuery(val.slice(1));
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  }, [setInput]);

  const handleSlashSelect = useCallback((cmd: SlashCommand) => {
    setSlashOpen(false);
    setInput("");
    switch (cmd.action) {
      case "new":
        router.push("/");
        break;
      case "clear":
        toast("Clear history for this chat?", {
          action: {
            label: "Clear",
            onClick: async () => {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`, {
                method: "DELETE",
              });
              setMessages(() => []);
              toast.success("History cleared");
            },
          },
        });
        break;
      case "rename":
        toast("Rename is available from the sidebar chat menu.");
        break;
      case "model": {
        document.querySelector<HTMLButtonElement>("[data-testid='model-selector']")?.click();
        break;
      }
      case "theme":
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        break;
      case "delete":
        toast("Delete this chat?", {
          action: {
            label: "Delete",
            onClick: async () => {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`, { method: "DELETE" });
              router.push("/");
              toast.success("Chat deleted");
            },
          },
        });
        break;
      case "purge":
        toast("Delete all chats?", {
          action: {
            label: "Delete all",
            onClick: async () => {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, { method: "DELETE" });
              router.push("/");
              toast.success("All chats deleted");
            },
          },
        });
        break;
      default:
        break;
    }
  }, [chatId, router, setMessages, setTheme, resolvedTheme, setInput]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.id,
          url: data.url,
          name: data.pathname,
          contentType: data.contentType,
        };
      }
      toast.error("Failed to upload file");
    } catch (_error) {
      toast.error("Failed to upload file, please try again!");
    }
    return null;
  }, []);

  const submitForm = useCallback(async (specificInput?: string) => {
    if (editingMessage) {
      (sendMessage as any)();
      return;
    }

    const val = specificInput ?? input;

    if (!val.trim() && attachments.length === 0) return;
    if (status !== "ready" && status !== "error") {
      toast.error("Please wait for the model to finish its response!");
      return;
    }
    if (!isModelAvailable) {
      toast.error("Please configure an API key for this model first!");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          if (attachment.file) {
            const result = await uploadFile(attachment.file);
            if (result) {
              URL.revokeObjectURL(attachment.url);
              return { ...result, file: undefined };
            }
            return { ...attachment, uploadFailed: true };
          }
          return attachment;
        })
      );

      if (uploadedAttachments.some((a) => (a as any).uploadFailed)) {
        setIsUploading(false);
        return;
      }

      const validAttachments = uploadedAttachments.filter(
        (a) => a.id && !a.id.toString().startsWith("temp-")
      );

      if (validAttachments.length > 0) {
        setPendingAttachmentIds(validAttachments.map((a) => (a as any).id));
      }

      window.history.pushState({}, "", `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`);

      sendMessage({
        role: "user",
        parts: [
          ...validAttachments.map((attachment) => ({
            type: "file" as const,
            url: attachment.url,
            name: attachment.name,
            mediaType: attachment.contentType,
          })),
          { type: "text", text: val },
        ],
      });

      setAttachments(() => []);
      setLocalStorageInput("");
      if (!specificInput) setInput("");
      setTimeout(() => textareaRef.current?.focus(), 50);
    } catch (_error) {
      toast.error("Failed to process message attachments");
    } finally {
      setIsUploading(false);
    }
  }, [
    input, setInput, attachments, setAttachments, sendMessage, chatId,
    uploadFile, editingMessage, setPendingAttachmentIds, status, isModelAvailable,
    setLocalStorageInput
  ]);

  useEffect(() => {
    const query = searchParams.get("query");
    if (query && status === "ready" && isModelAvailable && hasSubmittedQuery.current !== query) {
      hasSubmittedQuery.current = query;
      submitForm(query);
    }
  }, [searchParams, status, isModelAvailable, submitForm]);

  const handleFileChange = useCallback(async (files: File[]) => {
    const newAttachments: Attachment[] = files.map((file) => ({
      id: `temp-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      contentType: file.type,
      size: file.size,
      file,
    }));
    setAttachments((current) => [...current, ...newAttachments]);
  }, [setAttachments]);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;

    event.preventDefault();
    const newAttachments: Attachment[] = imageItems
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)
      .map((file) => ({
        id: `temp-${Math.random()}`,
        name: "Pasted Image",
        url: URL.createObjectURL(file),
        contentType: file.type,
        size: file.size,
        file,
      }));
    setAttachments((current) => [...current, ...newAttachments]);
  }, [setAttachments]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return {
    isUploading,
    slashOpen,
    setSlashOpen,
    slashQuery,
    slashIndex,
    setSlashIndex,
    textareaRef,
    handleInput,
    handleSlashSelect,
    submitForm,
    handleFileChange,
  };
}
