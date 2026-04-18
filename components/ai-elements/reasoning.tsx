"use client";

import type { ComponentProps, HTMLAttributes, ReactNode } from "react";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { ChevronDownIcon } from "lucide-react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";

import { Shimmer } from "./shimmer";

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

import { useReasoningState } from "@/hooks/use-reasoning-state";

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const { duration, isOpen, setIsOpen, handleOpenChange } = useReasoningState({
      defaultOpen,
      duration: durationProp,
      isStreaming,
      onOpenChange,
      open,
    });

    const contextValue = useMemo(
      () => ({ duration, isOpen, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen]
    );

    return (
      <ReasoningContext.Provider value={contextValue}>
        <Collapsible
          className={cn("not-prose", className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <Shimmer className="font-medium" duration={1}>Thinking...</Shimmer>;
  }
  if (duration === undefined) {
    return <p>Thought for a few seconds</p>;
  }
  return <p>Thought for {duration} seconds</p>;
};

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 text-muted-foreground text-[13px] leading-[1.65] transition-colors hover:text-foreground",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = HTMLAttributes<HTMLDivElement> & {
  children: string;
};

const streamdownPlugins = { cjk, code, math, mermaid };

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => {
    const { isStreaming, isOpen } = useReasoning();
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (isStreaming && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [children, isStreaming]);

    if (!isOpen) return null;

    return (
      <div
        className={cn(
          "mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200 [overflow-anchor:none]",
          className
        )}
      >
        <div
          className={cn(
            "relative max-h-[300px] overflow-y-auto rounded-xl border border-border/40 px-4 py-3 text-[13px] leading-relaxed transition-all duration-300",
            "bg-muted/10 backdrop-blur-md dark:bg-muted/5",
            "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.3)]",
            isStreaming && "border-indigo-500/30 bg-indigo-500/[0.02] ring-1 ring-indigo-500/10"
          )}
          ref={scrollRef}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <Streamdown
            className="text-muted-foreground/80 dark:text-muted-foreground/60"
            plugins={streamdownPlugins}
            {...props}
          >
            {children}
          </Streamdown>
        </div>
      </div>
    );
  }
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
