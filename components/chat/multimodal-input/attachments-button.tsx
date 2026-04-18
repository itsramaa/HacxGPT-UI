"use client";

import { memo } from "react";
import useSWR from "swr";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { ChatMessage } from "@/lib/types";
import { type ModelCapabilities } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "../icons";

function PureAttachmentsButton({
  fileInputRef,
  status,
  selectedModelId,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
}) {
  const { data: modelsResponse } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );

  const caps: Record<string, ModelCapabilities> | undefined =
    modelsResponse?.capabilities ?? modelsResponse;
  
  // Potential future use for vision-only models
  const _hasVision = caps?.[selectedModelId]?.vision ?? false;

  return (
    <Button
      className={cn(
        "h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors text-muted-foreground hover:border-border hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
      )}
      data-testid="attachments-button"
      disabled={status !== "ready"}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

export const AttachmentsButton = memo(PureAttachmentsButton);
