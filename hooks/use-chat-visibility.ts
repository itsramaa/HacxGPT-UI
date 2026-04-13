"use client";

import type { VisibilityType } from "@/components/chat/visibility-selector";

/**
 * Stub — backend doesn't support public/private visibility yet.
 * Always returns "private".
 */
export function useChatVisibility({
  chatId: _chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  return {
    visibilityType: initialVisibilityType,
    setVisibilityType: (_v: VisibilityType) => {},
  };
}
