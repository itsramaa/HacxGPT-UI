"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { suggestions } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "../ai-elements/suggestion";
import type { VisibilityType } from "../sidebar/visibility-selector";

import { useSuggestedActions } from "@/hooks/use-suggested-actions";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: any;
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage, selectedVisibilityType }: SuggestedActionsProps) {
  const router = useRouter();
  const { suggestedActions } = useSuggestedActions(4);

  return (
    <div
      className="flex w-full gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible"
      data-testid="suggested-actions"
      style={{
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="min-w-[200px] shrink-0 sm:min-w-0 sm:shrink"
          exit={{ opacity: 0, scale: 0.95 }}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          key={suggestedAction}
          transition={{
            delay: 0.05 * index,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Suggestion
            className="h-auto w-full group relative rounded-[16px] border border-border/40 bg-card/40 px-4 py-3.5 text-left transition-all duration-300 sm:p-5 hover:bg-card/70 hover:border-primary/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 active:scale-[0.98] whitespace-normal break-words flex-col items-start justify-start gap-2"
            onClick={(suggestion) => {
              sendMessage(suggestion);
            }}
            suggestion={suggestedAction}
          >
            <div className="flex flex-col gap-1.5 w-full">
              <div className="text-[13px] font-medium leading-tight text-foreground/90 group-hover:text-primary transition-colors duration-300 block line-clamp-3">
                {suggestedAction}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary/40 group-hover:text-primary/60 transition-colors flex items-center gap-1">
                EXECUTE PROMPT <span className="text-[14px] leading-none">&rarr;</span>
              </div>
            </div>

            {/* Subtle Inner Glow on Hover */}
            <div className="absolute inset-0 rounded-[16px] bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
