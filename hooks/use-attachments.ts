"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { FileUIPart } from "ai";

export interface AttachmentFile extends FileUIPart {
  id: string;
}

export function useAttachments() {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  
  // Ref for cleanup to avoid stale closures in useEffect return
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const add = useCallback((incomingFiles: File[] | FileList) => {
    const incoming = Array.from(incomingFiles);
    if (incoming.length === 0) return;

    setFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        filename: file.name,
        id: nanoid(),
        mediaType: file.type,
        type: "file" as const,
        url: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setFiles((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.url) {
        URL.revokeObjectURL(found.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setFiles((prev) => {
      for (const f of prev) {
        if (f.url) {
          URL.revokeObjectURL(f.url);
        }
      }
      return [];
    });
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const f of filesRef.current) {
        if (f.url) {
          URL.revokeObjectURL(f.url);
        }
      }
    };
  }, []);

  return {
    files,
    add,
    remove,
    clear,
  };
}
