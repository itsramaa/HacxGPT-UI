"use client";

import { useCallback, useState } from "react";
import type { SourceDocumentUIPart, FileUIPart } from "ai";
import { nanoid } from "nanoid";
import { useAttachments } from "./use-attachments";

export interface PromptInputMessage {
  text: string;
  files: FileUIPart[];
}

const convertBlobUrlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export function usePromptManager(initialText = "") {
  const [text, setText] = useState(initialText);
  const attachments = useAttachments();
  const [sources, setSources] = useState<(SourceDocumentUIPart & { id: string })[]>(
    []
  );

  const clear = useCallback(() => {
    setText("");
    attachments.clear();
    setSources([]);
  }, [attachments]);

  const addSource = useCallback(
    (incoming: SourceDocumentUIPart[] | SourceDocumentUIPart) => {
      const array = Array.isArray(incoming) ? incoming : [incoming];
      setSources((prev) => [
        ...prev,
        ...array.map((s) => ({ ...s, id: nanoid() })),
      ]);
    },
    []
  );

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const submit = useCallback(
    async (
      onSubmit: (message: PromptInputMessage) => void | Promise<void>
    ) => {
      // 1. Convert blob URLs to data URLs
      const convertedFiles: FileUIPart[] = await Promise.all(
        attachments.files.map(async (file) => {
          if (file.url?.startsWith("blob:")) {
            const dataUrl = await convertBlobUrlToDataUrl(file.url);
            return {
              ...file,
              url: dataUrl ?? file.url,
            };
          }
          return file;
        })
      );

      // 2. Execute onSubmit
      try {
        const result = onSubmit({ text, files: convertedFiles });
        
        if (result instanceof Promise) {
          await result;
        }
        
        // 3. Clear on success
        clear();
        return true;
      } catch (err) {
        console.error("Prompt submission failed:", err);
        return false;
      }
    },
    [text, attachments.files, clear]
  );

  return {
    text,
    setText,
    attachments,
    sources,
    addSource,
    removeSource,
    clear,
    submit,
  };
}
