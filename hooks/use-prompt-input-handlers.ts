"use client";

import { useCallback, useEffect, type FormEventHandler, type RefObject } from "react";
import type { PromptInputProps } from "@/components/ai-elements/prompt-input";
import type { PromptInputMessage } from "./use-prompt-manager";

interface PromptManagerLike {
  text: string;
  setText: (text: string) => void;
  attachments: {
    files: any[];
    add: (files: File[] | FileList) => void;
    clear: () => void;
    remove: (id: string) => void;
  };
  submit: (onSubmit: (msg: PromptInputMessage) => void | Promise<void>) => Promise<boolean>;
}

interface UsePromptInputHandlersProps {
  props: PromptInputProps;
  refs: {
    inputRef: RefObject<HTMLInputElement | null>;
    formRef: RefObject<HTMLFormElement | null>;
  };
  prompt: PromptManagerLike;
  usingProvider: boolean;
}

export function usePromptInputHandlers({
  props,
  refs,
  prompt,
  usingProvider,
}: UsePromptInputHandlersProps) {
  const { accept, maxFiles, maxFileSize, onError, onSubmit, globalDrop } = props;
  const { inputRef, formRef } = refs;

  const matchesAccept = useCallback(
    (f: File) => {
      if (!accept || accept.trim() === "") return true;
      const patterns = accept
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return patterns.some((pattern) => {
        if (pattern.endsWith("/*")) {
          const prefix = pattern.slice(0, -1);
          return f.type.startsWith(prefix);
        }
        return f.type === pattern;
      });
    },
    [accept]
  );

  const handleAddFiles = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = Array.from(fileList);
      const accepted = incoming.filter((f) => matchesAccept(f));
      
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types.",
        });
        return;
      }

      const withinSize = (f: File) => (maxFileSize ? f.size <= maxFileSize : true);
      const sized = accepted.filter(withinSize);
      
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size.",
        });
        return;
      }

      const currentCount = prompt.attachments.files.length;
      const capacity = typeof maxFiles === "number" ? Math.max(0, maxFiles - currentCount) : undefined;
      const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized;

      if (typeof capacity === "number" && sized.length > capacity) {
        onError?.({
          code: "max_files",
          message: "Too many files. Some were not added.",
        });
      }

      if (capped.length > 0) {
        prompt.attachments.add(capped);
      }
    },
    [matchesAccept, maxFiles, maxFileSize, onError, prompt.attachments]
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, [inputRef]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      // If NOT using provider, ensure the latest text is captured (for native form edge cases)
      if (!usingProvider) {
        const formData = new FormData(event.currentTarget);
        const text = formData.get("message") as string;
        if (text !== undefined) prompt.setText(text);
      }

      await prompt.submit((msg) => onSubmit(msg, event));
    },
    [prompt, onSubmit, usingProvider]
  );

  // Drag & Drop Logic
  useEffect(() => {
    const target = globalDrop ? document : formRef.current;
    if (!target) return;

    const onDragOver = (e: Event) => {
      const dragEvent = e as DragEvent;
      if (dragEvent.dataTransfer?.types?.includes("Files")) {
        dragEvent.preventDefault();
      }
    };

    const onDrop = (e: Event) => {
      const dragEvent = e as DragEvent;
      if (dragEvent.dataTransfer?.types?.includes("Files")) {
        dragEvent.preventDefault();
        if (dragEvent.dataTransfer.files.length > 0) {
          handleAddFiles(dragEvent.dataTransfer.files);
        }
      }
    };

    target.addEventListener("dragover", onDragOver);
    target.addEventListener("drop", onDrop);
    
    return () => {
      target.removeEventListener("dragover", onDragOver);
      target.removeEventListener("drop", onDrop);
    };
  }, [handleAddFiles, globalDrop, formRef]);

  return {
    handleAddFiles,
    handleSubmit,
    openFileDialog,
  };
}
