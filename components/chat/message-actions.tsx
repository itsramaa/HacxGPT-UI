import { memo } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { ChatMessage } from "@/lib/types";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { CopyIcon, PencilEditIcon, RegenerateIcon } from "./icons";

export function PureMessageActions({
  chatId,
  message,
  isLoading,
  onEdit,
}: {
  chatId: string;
  message: ChatMessage;
  isLoading: boolean;
  onEdit?: () => void;
}) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const { handleRegenerate } = useActiveChat();

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  };

  const formatTokens = (n?: number) => {
    if (!n) { return null; }
    if (n >= 1000) { return `${(n / 1000).toFixed(1)}k`; }
    return n.toString();
  };

  if (message.role === "user") {
    return (
      <Actions className="-mr-0.5 justify-end opacity-0 transition-opacity duration-150 group-hover/message:opacity-100">
        <div className="flex items-center gap-0.5">
          {onEdit && (
            <Action
              className="size-7 text-muted-foreground/50 hover:text-foreground"
              data-testid="message-edit-button"
              onClick={onEdit}
              tooltip="Edit"
            >
              <PencilEditIcon />
            </Action>
          )}
          <Action
            className="size-7 text-muted-foreground/50 hover:text-foreground"
            onClick={() => handleRegenerate("", message.id)}
            tooltip="Regenerate"
          >
            <RegenerateIcon size={14} />
          </Action>
          <Action
            className="size-7 text-muted-foreground/50 hover:text-foreground"
            onClick={handleCopy}
            tooltip="Copy"
          >
            <CopyIcon />
          </Action>
        </div>
      </Actions>
    );
  }

  const { promptTokens, completionTokens, totalTokens } =
    message.metadata || {};

  return (
    <Actions className="-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 items-center">
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      {totalTokens !== undefined && totalTokens > 0 && (
        <Action
          className="h-6 w-auto px-1.5 text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1 cursor-default"
          tooltip={`Prompt: ${promptTokens?.toLocaleString()} | Out: ${completionTokens?.toLocaleString()} | Total: ${totalTokens?.toLocaleString()} Tokens`}
        >
          <div className="size-1 rounded-full bg-primary/30" />
          {formatTokens(totalTokens)}
        </Action>
      )}
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }

    return true;
  }
);
