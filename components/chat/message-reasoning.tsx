"use client";

import { useReasoningState } from "@/hooks/use-reasoning-state";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";

type MessageReasoningProps = {
  isLoading: boolean;
  reasoning: string;
};

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const { isOpen, handleOpenChange } = useReasoningState({
    isStreaming: isLoading,
  });

  return (
    <Reasoning
      data-testid="message-reasoning"
      isStreaming={isLoading}
      onOpenChange={handleOpenChange}
      open={isOpen}
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning}</ReasoningContent>
    </Reasoning>
  );
}
