"use client";

import { useCallback, useState, type KeyboardEventHandler, type ClipboardEventHandler } from "react";

interface TextareaHandlersProps {
  attachments: {
    files: any[];
    add: (files: File[]) => void;
    remove: (id: string) => void;
  };
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
}

export function useTextareaHandlers({
  attachments,
  onKeyDown,
}: TextareaHandlersProps) {
  const [isComposing, setIsComposing] = useState(false);

  const isMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      onKeyDown?.(e);

      if (e.defaultPrevented) return;

      if (e.key === "Enter") {
        if (isComposing || e.nativeEvent.isComposing) return;
        if (e.shiftKey) return;
        if (isMobile()) return;

        e.preventDefault();
        
        const { form } = e.currentTarget;
        const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        
        if (submitButton?.disabled) return;
        form?.requestSubmit();
      }

      // Remove last attachment when Backspace is pressed and textarea is empty
      if (
        e.key === "Backspace" &&
        e.currentTarget.value === "" &&
        attachments.files.length > 0
      ) {
        e.preventDefault();
        const lastAttachment = attachments.files.at(-1);
        if (lastAttachment) {
          attachments.remove(lastAttachment.id);
        }
      }
    },
    [onKeyDown, isComposing, attachments, isMobile]
  );

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        event.preventDefault();
        attachments.add(files);
      }
    },
    [attachments]
  );

  return {
    isComposing,
    setIsComposing,
    handleKeyDown,
    handlePaste,
    handleCompositionStart: () => setIsComposing(true),
    handleCompositionEnd: () => setIsComposing(false),
  };
}
