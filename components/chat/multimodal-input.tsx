"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { ArrowUpIcon } from "lucide-react";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useEffect,
  useRef
} from "react";
import { toast } from "sonner";
import { useWindowSize } from "usehooks-ts";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { PreviewAttachment } from "./preview-attachment";
import {
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "../sidebar/visibility-selector";

// Internal specialized hooks & components
import { useMultimodalHandlers } from "@/hooks/use-multimodal-handlers";
import { AttachmentsButton } from "./multimodal-input/attachments-button";
import { ModelSelectorCompact } from "./multimodal-input/model-selector-compact";
import { ApiKeySelectorCompact } from "./multimodal-input/api-key-selector-compact";
import { SearchButton } from "./multimodal-input/search-button";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  editingMessage,
  onCancelEdit,
  isLoading,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"] | (() => Promise<void>);
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
}) {
  const { width } = useWindowSize();
  const { isModelAvailable, useSearch, setUseSearch } = useActiveChat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isUploading,
    slashOpen,
    setSlashOpen,
    slashQuery,
    slashIndex,
    setSlashIndex,
    textareaRef,
    handleInput,
    handleSlashSelect,
    submitForm,
    handleFileChange,
  } = useMultimodalHandlers({
    chatId,
    input,
    setInput,
    attachments,
    setAttachments,
    setMessages,
    sendMessage,
    editingMessage,
    status,
  });

  const isGenerating = status === "submitted" || status === "streaming";

  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width && width > 768) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width, textareaRef]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {editingMessage && onCancelEdit && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-200">
          <span className="font-medium">Editing message</span>
          <button
            className="rounded px-1.5 py-0.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground text-[11px]"
            onMouseDown={(e) => {
              e.preventDefault();
              onCancelEdit();
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {!editingMessage &&
        !isLoading &&
        messages.length === 0 &&
        attachments.length === 0 &&
        !isUploading &&
        isModelAvailable && (
          <SuggestedActions
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}

      <input
        className="hidden"
        multiple
        onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <div className="relative">
        {slashOpen && (
          <SlashCommandMenu
            onClose={() => setSlashOpen(false)}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        )}
      </div>

      <PromptInput
        className="[&>div]:rounded-2xl [&>div]:border [&>div]:border-border/30 [&>div]:bg-card/70 [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-all [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)] [&>div]:focus-within:border-border/50"
        onSubmit={() => {
          if (input.startsWith("/")) {
            const query = input.slice(1).trim();
            const cmd = slashCommands.find((c) => c.name === query);
            if (cmd) {
              handleSlashSelect(cmd);
            }
            return;
          }
          submitForm();
        }}
      >
        {attachments.length > 0 && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                isUploading={isUploading && !!attachment.file}
                key={attachment.url}
                onRemove={() => {
                  setAttachments((current) => current.filter((a) => a.url !== attachment.url));
                }}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className="min-h-24 text-[13px] leading-relaxed px-4 pt-3.5 pb-1.5 placeholder:text-muted-foreground/35 resize-none"
          data-testid="multimodal-input"
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isModelAvailable) {
              e.preventDefault();
              toast.error("Please configure an API key for this model first!");
              return;
            }

            if (slashOpen) {
              const filtered = slashCommands.filter((cmd) =>
                cmd.name.startsWith(slashQuery.toLowerCase())
              );
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIndex((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (filtered[slashIndex]) {
                  handleSlashSelect(filtered[slashIndex]);
                }
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setSlashOpen(false);
                return;
              }
            }
            if (e.key === "Escape" && editingMessage && onCancelEdit) {
              e.preventDefault();
              onCancelEdit();
            }
          }}
          placeholder={editingMessage ? "Edit your message..." : "Ask anything..."}
          ref={textareaRef}
          value={input}
          disabled={isGenerating || isUploading}
        />
        <PromptInputFooter className="px-3 pb-3">
          <PromptInputTools>
            <AttachmentsButton
              fileInputRef={fileInputRef}
              selectedModelId={selectedModelId}
              status={status}
            />
            <SearchButton
              isEnabled={useSearch}
              onClick={() => setUseSearch(!useSearch)}
              status={status}
            />
            <div className="flex items-center gap-1 bg-background/40 p-0.5 rounded-lg border border-border/10 shadow-sm">
              <ModelSelectorCompact
                onModelChange={onModelChange}
                selectedModelId={selectedModelId}
              />
              <div className="w-px h-3 bg-border/20 mx-0.5" />
              <ApiKeySelectorCompact
                selectedModelId={selectedModelId}
                status={status}
              />
            </div>
          </PromptInputTools>

          <PromptInputSubmit
            className={cn(
              "h-7 w-7 rounded-xl transition-all duration-200",
              (input.trim() || attachments.length > 0 || isGenerating) && isModelAvailable
                ? "bg-foreground text-background dark:hover:bg-gray-400 hover:bg-gray-500 active:scale-95 shadow-sm"
                : "bg-muted text-muted-foreground/25"
            )}
            data-testid="send-button"
            disabled={
              (!input.trim() && attachments.length === 0 && !isGenerating) ||
              isUploading ||
              !isModelAvailable
            }
            onStop={stop}
            status={status}
            variant="secondary"
          >
            <ArrowUpIcon className="size-4" strokeWidth={2.5} />
          </PromptInputSubmit>
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) { return false; }
    if (prevProps.status !== nextProps.status) { return false; }
    if (!equal(prevProps.attachments, nextProps.attachments)) { return false; }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) { return false; }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) { return false; }
    if (prevProps.editingMessage !== nextProps.editingMessage) { return false; }
    if (prevProps.isLoading !== nextProps.isLoading) { return false; }
    if (prevProps.messages.length !== nextProps.messages.length) { return false; }

    return true;
  }
);
