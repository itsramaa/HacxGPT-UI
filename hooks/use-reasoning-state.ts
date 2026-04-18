"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

export interface UseReasoningStateProps {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
}

export function useReasoningState({
  isStreaming = false,
  open,
  defaultOpen,
  onOpenChange,
  duration: durationProp,
}: UseReasoningStateProps) {
  const resolvedDefaultOpen = defaultOpen ?? isStreaming;
  // Track if defaultOpen was explicitly set to false (to prevent auto-open)
  const isExplicitlyClosed = defaultOpen === false;

  const [isOpen, setIsOpen] = useControllableState<boolean>({
    defaultProp: resolvedDefaultOpen,
    onChange: onOpenChange,
    prop: open,
  });

  const [duration, setDuration] = useControllableState<number | undefined>({
    defaultProp: undefined,
    prop: durationProp,
  });

  const hasEverStreamedRef = useRef(isStreaming);
  const [hasAutoClosed, setHasAutoClosed] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Track when streaming starts and compute duration
  useEffect(() => {
    if (isStreaming) {
      hasEverStreamedRef.current = true;
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
    } else if (startTimeRef.current !== null) {
      setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
      startTimeRef.current = null;
    }
  }, [isStreaming, setDuration]);

  // Auto-open when streaming starts (unless explicitly closed)
  useEffect(() => {
    if (isStreaming && !isOpen && !isExplicitlyClosed) {
      setIsOpen(true);
    }
  }, [isStreaming, isOpen, setIsOpen, isExplicitlyClosed]);

  // Auto-close when streaming ends (once only, and only if it ever streamed)
  useEffect(() => {
    if (
      hasEverStreamedRef.current &&
      !isStreaming &&
      isOpen &&
      !hasAutoClosed
    ) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setHasAutoClosed(true);
      }, AUTO_CLOSE_DELAY);

      return () => clearTimeout(timer);
    }
  }, [isStreaming, isOpen, setIsOpen, hasAutoClosed]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setIsOpen(newOpen);
    },
    [setIsOpen]
  );

  return {
    duration,
    isOpen,
    setIsOpen,
    handleOpenChange,
  };
}
