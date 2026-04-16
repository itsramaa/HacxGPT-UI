"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { ArrowUpIcon, GlobeIcon, PlusIcon, ZapIcon, SearchIcon, StarIcon, ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveChat } from "@/hooks/use-active-chat";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { PaperclipIcon, StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

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
  sendMessage:
  | UseChatHelpers<ChatMessage>["sendMessage"]
  | (() => Promise<void>);
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { setPendingAttachmentIds, isModelAvailable, useSearch, setUseSearch } = useActiveChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = event.target.value;
    setInput(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashOpen(true);
      setSlashQuery(val.slice(1));
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  };

  const handleSlashSelect = (cmd: SlashCommand) => {
    setSlashOpen(false);
    setInput("");
    switch (cmd.action) {
      case "new":
        router.push("/");
        break;
      case "clear":
        setMessages(() => []);
        break;
      case "rename":
        toast("Rename is available from the sidebar chat menu.");
        break;
      case "model": {
        const modelBtn = document.querySelector<HTMLButtonElement>(
          "[data-testid='model-selector']"
        );
        modelBtn?.click();
        break;
      }
      case "theme":
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        break;
      case "delete":
        toast("Delete this chat?", {
          action: {
            label: "Delete",
            onClick: () => {
              fetch(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                { method: "DELETE" }
              );
              router.push("/");
              toast.success("Chat deleted");
            },
          },
        });
        break;
      case "purge":
        toast("Delete all chats?", {
          action: {
            label: "Delete all",
            onClick: () => {
              fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
                method: "DELETE",
              });
              router.push("/");
              toast.success("All chats deleted");
            },
          },
        });
        break;
      default:
        break;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const { data: modelsData } = useSWR(
    "/api/models",
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  );

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { id, url, pathname, contentType } = data;

        return {
          id, // UUID from backend — needed for attachment_ids
          url,
          name: pathname,
          contentType,
        };
      }

      let errorMsg = "Failed to upload file";
      try {
        const errData = await response.json();
        if (errData.detail) {
          if (Array.isArray(errData.detail)) {
            errorMsg =
              errData.detail[0]?.msg || JSON.stringify(errData.detail[0]);
          } else if (typeof errData.detail === "object") {
            errorMsg = errData.detail.msg || JSON.stringify(errData.detail);
          } else {
            errorMsg = errData.detail;
          }
        } else if (errData.error) {
          errorMsg =
            typeof errData.error === "string"
              ? errData.error
              : errData.error.msg || "Unknown error";
        } else if (Array.isArray(errData) && errData[0]?.msg) {
          errorMsg = errData[0].msg;
        } else if (errData.msg) {
          errorMsg = errData.msg;
        }
      } catch (_e) {
        // Fallback to default if not JSON
      }
      toast.error(
        typeof errorMsg === "string" ? errorMsg : "Failed to upload file"
      );
    } catch (_error) {
      toast.error("Failed to upload file, please try again!");
    }
  }, []);

  const submitForm = useCallback(async () => {
    if (editingMessage) {
      (sendMessage as () => void)();
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload pending files first
      const uploadedAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          if (attachment.file) {
            const result = await uploadFile(attachment.file);
            if (result) {
              // Revoke old local URL
              URL.revokeObjectURL(attachment.url);
              return { ...result, file: undefined };
            }
            // If upload failed, we should mark it or return something detectable
            return { ...attachment, uploadFailed: true };
          }
          return attachment;
        })
      );

      // Check if any required upload failed
      if (uploadedAttachments.some((a) => (a as any).uploadFailed)) {
        setIsUploading(false);
        return;
      }

      const validAttachments = uploadedAttachments.filter(
        (a) => a.id && !a.id.toString().startsWith("temp-")
      );

      // Register attachment IDs in the global context
      if (validAttachments.length > 0) {
        setPendingAttachmentIds(validAttachments.map((a) => a.id));
      }

      // 2. Clear inputs and history
      window.history.pushState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );

      // 3. Send message with final URLs
      sendMessage({
        role: "user",
        parts: [
          ...validAttachments.map((attachment) => ({
            type: "file" as const,
            url: attachment.url,
            name: attachment.name,
            mediaType: attachment.contentType,
          })),
          {
            type: "text",
            text: input,
          },
        ],
      });

      setAttachments([]);
      setLocalStorageInput("");
      setInput("");

      if (width && width > 768) {
        textareaRef.current?.focus();
      }
    } catch (_error) {
      toast.error("Failed to process message attachments");
    } finally {
      setIsUploading(false);
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    uploadFile,
    editingMessage,
    setPendingAttachmentIds,
  ]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) { return; }

      const newAttachments: Attachment[] = files.map((file) => ({
        id: `temp-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        contentType: file.type,
        size: file.size,
        file,
      }));

      setAttachments((current) => [...current, ...newAttachments]);

      // Reset input
      if (event.target) { event.target.value = ""; }
    },
    [setAttachments]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) { return; }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) { return; }

      event.preventDefault();

      const newAttachments: Attachment[] = imageItems
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null)
        .map((file) => ({
          id: `temp-${Math.random()}`,
          name: "Pasted Image",
          url: URL.createObjectURL(file),
          contentType: file.type,
          size: file.size,
          file,
        }));

      setAttachments((current) => [...current, ...newAttachments]);
    },
    [setAttachments]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {editingMessage && onCancelEdit && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Editing message</span>
          <button
            className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
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
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
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
        className="[&>div]:rounded-2xl [&>div]:border [&>div]:border-border/30 [&>div]:bg-card/70 [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-shadow [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
        onSubmit={() => {
          if (input.startsWith("/")) {
            const query = input.slice(1).trim();
            const cmd = slashCommands.find((c) => c.name === query);
            if (cmd) {
              handleSlashSelect(cmd);
            }
            return;
          }
          if (!input.trim() && attachments.length === 0) {
            return;
          }
          if (status === "ready" || status === "error") {
            if (!isModelAvailable) {
              toast.error("Please configure an API key for this model first!");
              return;
            }
            submitForm();
          } else {
            toast.error("Please wait for the model to finish its response!");
          }
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
                key={attachment.url}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url)
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className="min-h-24 text-[13px] leading-relaxed px-4 pt-3.5 pb-1.5 placeholder:text-muted-foreground/35"
          data-testid="multimodal-input"
          onChange={handleInput}
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
          placeholder={
            editingMessage ? "Edit your message..." : "Ask anything..."
          }
          ref={textareaRef}
          value={input}
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
            <div className="flex items-center gap-1 bg-background/40 p-0.5 rounded-lg border border-border/10">
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

          {status === "submitted" || isUploading ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className={cn(
                "h-7 w-7 rounded-xl transition-all duration-200",
                (input.trim() || attachments.length > 0) && isModelAvailable
                  ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                  : "bg-muted text-muted-foreground/25 cursor-not-allowed"
              )}
              data-testid="send-button"
              disabled={
                (!input.trim() && attachments.length === 0) ||
                isUploading ||
                !isModelAvailable
              }
              status={status}
              variant="secondary"
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
          )}
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (prevProps.editingMessage !== nextProps.editingMessage) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    return true;
  }
);

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

const AttachmentsButton = memo(PureAttachmentsButton);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const [open, setOpen] = useState(false);
  const [activeMobileProvider, setActiveMobileProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setActiveMobileProvider(null), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const size = 15; // Providers per page

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: modelsData,
    error,
    isLoading,
  } = useSWR(
    `/api/models?page=${page}&size=${size}&q=${encodeURIComponent(
      debouncedQuery
    )}`,
    (url: string) => fetch(url).then((r) => r.json()),
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  const dynamicModels: ChatModel[] | undefined = modelsData?.models;
  const activeModels = dynamicModels ?? chatModels;
  const totalProviders = modelsData?.total || 1;
  const totalPages = Math.max(1, Math.ceil(totalProviders / size));


  const selectedModel =
    activeModels.find((m: ChatModel) => m.id === selectedModelId) ??
    activeModels.find((m: ChatModel) => m.id === DEFAULT_CHAT_MODEL) ??
    activeModels[0];
  // Grouping logic
  const providerGroups: Record<string, ChatModel[]> = {};
  const providerHasKey: Record<string, boolean> = {};

  for (const model of activeModels) {
    const pName = model.providerName || "HacxGPT";
    if (!providerGroups[pName]) { providerGroups[pName] = []; }
    providerGroups[pName].push(model);
    // If any model in the group has hasKey: true, or if it's the internal provider
    if (model.hasKey || pName === "hacxgpt") {
      providerHasKey[pName] = true;
    }
  }

  const pNames = Object.keys(providerGroups);
  
  // Guarantee UI sequence: Recommended -> Free Engine -> Full Capacity -> Name
  pNames.forEach(name => {
    providerGroups[name].sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  });
  const availableProviders = pNames
    .filter((name) => providerHasKey[name])
    .sort((a, b) => {
      if (a === "HacxGPT") { return -1; }
      if (b === "HacxGPT") { return 1; }
      return a.localeCompare(b);
    });
  const missingKeyProviders = pNames
    .filter((name) => !providerHasKey[name])
    .sort((a, b) => a.localeCompare(b));

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-7 max-w-[140px] justify-between gap-1.5 rounded-md px-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent"
          data-testid="model-selector"
          variant="ghost"
        >
          <div className="flex items-center gap-1.5 truncate">
            <ModelSelectorLogo
              className="size-3"
              provider={selectedModel?.providerName || "other"}
            />
            <span className="truncate">{selectedModel?.name}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="start"
          className="w-[calc(100vw-32px)] sm:w-[210px] p-2 rounded-2xl backdrop-blur-3xl bg-card/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 animate-in fade-in zoom-in-95 duration-200 ease-out z-50 flex flex-col"
          collisionPadding={16}
          side="top"
          sideOffset={12}
        >
          {isMobile && activeMobileProvider ? (
            <MobileProviderModelsView
              pName={activeMobileProvider}
              models={providerGroups[activeMobileProvider] || []}
              selectedModelId={selectedModelId}
              onModelChange={onModelChange}
              setOpen={setOpen}
              onBack={() => setActiveMobileProvider(null)}
              hasKey={!!providerHasKey[activeMobileProvider]}
            />
          ) : (
            <>
              <div className="px-1 pb-2 pt-1 relative">
                <input
                  className="w-full text-[11px] bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-1.5 outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground/50 transition-colors"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  type="text"
                  value={searchQuery}
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              </div>

              <DropdownMenuGroup className="flex flex-col gap-1 max-h-[35vh] overflow-y-auto scrollbar-hide shrink-0">
            {availableProviders.length > 0 && (
              <>
                <div className="px-3 py-2 mb-1">
                  <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-[2px]">
                    Available
                  </span>
                </div>
                {availableProviders.map((pName) => (
                  <ProviderSubMenu
                    hasKey={true}
                    isMobile={isMobile}
                    key={pName}
                    models={providerGroups[pName]}
                    onModelChange={onModelChange}
                    pName={pName}
                    selectedModelId={selectedModelId}
                    setOpen={setOpen}
                    onMobileSelect={() => setActiveMobileProvider(pName)}
                  />
                ))}
              </>
            )}

            {missingKeyProviders.length > 0 && (
              <>
                {availableProviders.length > 0 && (
                  <div className="h-px bg-white/5 my-1 mx-2" />
                )}
                <div className="px-3 py-2 mb-1">
                  <span className="text-[9px] font-black text-rose-400/60 uppercase tracking-[2px]">
                    No API Key
                  </span>
                </div>
                {missingKeyProviders.map((pName) => (
                  <ProviderSubMenu
                    hasKey={false}
                    isMobile={isMobile}
                    key={pName}
                    models={providerGroups[pName]}
                    onModelChange={onModelChange}
                    pName={pName}
                    selectedModelId={selectedModelId}
                    setOpen={setOpen}
                    onMobileSelect={() => setActiveMobileProvider(pName)}
                  />
                ))}
              </>
            )}
          </DropdownMenuGroup>

          {totalPages > 1 && (
            <div className="flex justify-between items-center px-1 pt-2 border-t border-white/10 mt-1">
              <Button
                className="h-6 px-2 text-[10px] hover:bg-white/5"
                disabled={page === 1}
                onClick={(e) => { e.preventDefault(); setPage((p) => p - 1); }}
                variant="ghost"
              >
                Prev
              </Button>
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {page} / {totalPages}
              </span>
              <Button
                className="h-6 px-2 text-[10px] hover:bg-white/5"
                disabled={page >= totalPages}
                onClick={(e) => { e.preventDefault(); setPage((p) => p + 1); }}
                variant="ghost"
              >
                Next
              </Button>
            </div>
          )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

function MobileProviderModelsView({
  pName,
  models,
  selectedModelId,
  onModelChange,
  setOpen,
  onBack,
  hasKey,
}: {
  pName: string;
  models: ChatModel[];
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  setOpen: (open: boolean) => void;
  onBack: () => void;
  hasKey: boolean;
}) {
  const [modelPage, setModelPage] = useState(1);
  const MODELS_PER_PAGE = 8;
  const totalModelPages = Math.max(1, Math.ceil(models.length / MODELS_PER_PAGE));
  const paginatedModels = models.slice((modelPage - 1) * MODELS_PER_PAGE, modelPage * MODELS_PER_PAGE);

  return (
    <>
      <div className="px-1 py-1 mb-1 flex items-center justify-between border-b border-white/5 shrink-0">
        <button
          onClick={(e) => { e.preventDefault(); onBack(); }}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 opacity-80 hover:opacity-100"
        >
          <ChevronLeftIcon className="size-4" />
          <span className="text-[10px] font-bold tracking-tight">BACK</span>
        </button>
        <div className="flex items-center gap-1.5 px-2">
          <ModelSelectorLogo className="size-3" provider={pName} />
          <span className="text-[11px] font-black uppercase tracking-[1px] truncate max-w-[100px]">{pName}</span>
        </div>
      </div>
      
      <DropdownMenuGroup className="flex flex-col gap-1 max-h-[35vh] overflow-y-auto scrollbar-hide shrink-0">
        {[
          { label: "Recommended", list: paginatedModels.filter((m) => m.isRecommended) },
          { label: "Free Engines", list: paginatedModels.filter((m) => m.isFree && !m.isRecommended) },
          { label: "Full Capacity", list: paginatedModels.filter((m) => !m.isFree && !m.isRecommended) },
        ].map(
          (group) =>
            group.list.length > 0 && (
              <div className="mb-2 last:mb-0" key={group.label}>
                <div className="px-2 py-1 flex items-center gap-2">
                  {group.label === "Recommended" ? (
                    <StarIcon className="size-2.5 text-yellow-400 fill-yellow-400/20" />
                  ) : group.label === "Free Engines" ? (
                    <ZapIcon className="size-2.5 text-emerald-400" />
                  ) : (
                    <GlobeIcon className="size-2.5 text-blue-400" />
                  )}
                  <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-[1.5px]">
                    {group.label}
                  </span>
                </div>
                {group.list.map((model) => (
                  <DropdownMenuItem
                    className={cn(
                      "flex flex-col items-start gap-1 p-2 rounded-xl border border-transparent outline-none m-0.5 cursor-pointer",
                      model.id === selectedModelId
                        ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(var(--primary),0.3)] border-white/10"
                        : "focus:bg-white/5 hover:bg-white/5 hover:text-foreground"
                    )}
                    key={model.id}
                    onSelect={() => {
                      onModelChange?.(model.id);
                      setCookie("chat-model", model.id);
                      setOpen(false);
                      setTimeout(() => {
                        document.querySelector<HTMLTextAreaElement>("[data-testid='multimodal-input']")?.focus();
                      }, 50);
                    }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold tracking-tight truncate max-w-[140px]">{model.name}</span>
                        {model.isRecommended && (
                          <span className="text-[7px] font-black bg-yellow-500/20 text-yellow-500 px-1 rounded-sm tracking-tighter shrink-0">REC</span>
                        )}
                        {model.isFree && !model.isRecommended && (
                          <span className="text-[7px] font-black bg-emerald-500/20 text-emerald-400 px-1 rounded-sm tracking-tighter shrink-0">FREE</span>
                        )}
                      </div>
                      {model.id === selectedModelId && <div className="size-1.5 rounded-full bg-white shadow-[0_0_8px_white] shrink-0" />}
                    </div>
                    <span className={cn("text-[8px] font-mono opacity-60 truncate w-full", model.id === selectedModelId ? "text-primary-foreground/80" : "text-muted-foreground")}>{model.name} | ID:{model.id}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            )
        )}
      </DropdownMenuGroup>
      
      {totalModelPages > 1 && (
        <div className="flex justify-between items-center px-1 pt-2 border-t border-white/10 mt-1 shrink-0">
          <Button
            className="h-6 px-2 text-[10px] hover:bg-white/5"
            disabled={modelPage === 1}
            onClick={(e) => { e.preventDefault(); setModelPage((p) => p - 1); }}
            variant="ghost"
          >
            Prev
          </Button>
          <span className="text-[10px] text-muted-foreground/70 font-mono">
            {modelPage} / {totalModelPages}
          </span>
          <Button
            className="h-6 px-2 text-[10px] hover:bg-white/5"
            disabled={modelPage >= totalModelPages}
            onClick={(e) => { e.preventDefault(); setModelPage((p) => p + 1); }}
            variant="ghost"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

function ProviderSubMenu({
  pName,
  models,
  selectedModelId,
  onModelChange,
  setOpen,
  hasKey,
  isMobile,
  onMobileSelect,
}: {
  pName: string;
  models: ChatModel[];
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  setOpen: (open: boolean) => void;
  hasKey: boolean;
  isMobile?: boolean;
  onMobileSelect?: () => void;
}) {
  const [modelPage, setModelPage] = useState(1);
  const MODELS_PER_PAGE = 5;
  const totalModelPages = Math.max(1, Math.ceil(models.length / MODELS_PER_PAGE));
  const paginatedModels = models.slice((modelPage - 1) * MODELS_PER_PAGE, modelPage * MODELS_PER_PAGE);

  if (isMobile) {
    return (
      <DropdownMenuItem
        onSelect={(e) => { e.preventDefault(); onMobileSelect?.(); }}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-bold outline-none m-0.5 cursor-pointer",
          hasKey
            ? "focus:bg-white/5"
            : "opacity-80 focus:bg-white/5"
        )}
      >
        <div className="flex items-center gap-2">
          <ModelSelectorLogo className="size-3.5" provider={pName} />
          <span className="capitalize">{pName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] opacity-40 font-mono tracking-tighter">
            {models.length}
          </span>
          <ChevronRightIcon className="size-3.5 opacity-50" />
        </div>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-default transition-all duration-200 text-[13px] font-bold outline-none",
          hasKey
            ? "focus:bg-primary/20 focus:text-primary data-[state=open]:bg-primary/20 data-[state=open]:text-primary"
            : "opacity-80 focus:bg-white/5"
        )}
      >
        <div className="flex items-center gap-2">
          <ModelSelectorLogo className="size-3.5" provider={pName} />
          <span className="capitalize">{pName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] opacity-40 font-mono tracking-tighter">
            {models.length}
          </span>
        </div>
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent
          alignOffset={isMobile ? 0 : 0}
          className="w-[calc(100vw-48px)] sm:w-[260px] p-2 rounded-2xl backdrop-blur-3xl bg-card shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-left-2 duration-200 ease-out z-[60]"
          collisionPadding={16}
          sideOffset={isMobile ? -180 : 6}
        >
          <div className="px-3 py-2.5 mb-1.5 flex items-center justify-between border-b border-white/5 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2">
              <ModelSelectorLogo className="size-3.5" provider={pName} />
              <span className="text-[10px] font-black text-foreground uppercase tracking-[1px]">
                {pName} Models
              </span>
            </div>
            {!hasKey && (
              <span className="text-[8px] font-bold bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Key Required
              </span>
            )}
          </div>

          {[
            { label: "Recommended", list: paginatedModels.filter((m) => m.isRecommended) },
            { label: "Free Engines", list: paginatedModels.filter((m) => m.isFree && !m.isRecommended) },
            { label: "Full Capacity", list: paginatedModels.filter((m) => !m.isFree && !m.isRecommended) },
          ].map(
            (group) =>
              group.list.length > 0 && (
                <div className="mb-4 last:mb-0" key={group.label}>
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    {group.label === "Recommended" ? (
                      <StarIcon className="size-2.5 text-yellow-400 fill-yellow-400/20" />
                    ) : group.label === "Free Engines" ? (
                      <ZapIcon className="size-2.5 text-emerald-400" />
                    ) : (
                      <GlobeIcon className="size-2.5 text-blue-400" />
                    )}
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[1.5px]">
                      {group.label}
                    </span>
                  </div>
                  {group.list.map((model) => (
                    <DropdownMenuItem
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 rounded-xl transition-all duration-200 border border-transparent outline-none m-0.5 cursor-pointer",
                        model.id === selectedModelId
                          ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(var(--primary),0.3)] border-white/10"
                          : "focus:bg-white/5 hover:bg-white/5 hover:text-foreground active:scale-[0.98]"
                      )}
                      key={model.id}
                      onSelect={() => {
                        onModelChange?.(model.id);
                        setCookie("chat-model", model.id);
                        setOpen(false);
                        setTimeout(() => {
                          document
                            .querySelector<HTMLTextAreaElement>(
                              "[data-testid='multimodal-input']"
                            )
                            ?.focus();
                        }, 50);
                      }}
                    >
                      <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold tracking-tight">
                            {model.name}
                          </span>
                          {model.isRecommended && (
                            <span className="text-[8px] font-black bg-yellow-500/20 text-yellow-500 px-1 rounded-sm border border-yellow-500/20 tracking-tighter">
                              RECOMMENDED
                            </span>
                          )}
                          {model.isFree && !model.isRecommended && (
                            <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1 rounded-sm border border-emerald-500/20 tracking-tighter">
                              FREE
                            </span>
                          )}
                        </div>
                        {model.id === selectedModelId && (
                          <div className="size-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[9px] font-mono opacity-60 truncate w-full",
                          model.id === selectedModelId
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {model.id}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )
          )}

          {totalModelPages > 1 && (
            <div className="flex justify-between items-center px-1 pb-1 pt-2 border-t border-white/10 mt-1 sticky bottom-[-8px] bg-card/95 backdrop-blur-md z-10">
              <Button
                className="h-6 px-2 text-[10px] hover:bg-white/5"
                disabled={modelPage === 1}
                onClick={(e) => { e.preventDefault(); setModelPage((p) => p - 1); }}
                variant="ghost"
              >
                Prev
              </Button>
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {modelPage} / {totalModelPages}
              </span>
              <Button
                className="h-6 px-2 text-[10px] hover:bg-white/5"
                disabled={modelPage >= totalModelPages}
                onClick={(e) => { e.preventDefault(); setModelPage((p) => p + 1); }}
                variant="ghost"
              >
                Next
              </Button>
            </div>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function ApiKeySelectorCompact({
  selectedModelId,
  status,
}: {
  selectedModelId: string;
  status: UseChatHelpers<ChatMessage>["status"];
}) {
  const router = useRouter();
  const { data: keys } = useSWR("/api/keys", (url) =>
    fetch(url).then((r) => r.json())
  );
  const { data: modelsData } = useSWR("/api/models", (url) =>
    fetch(url).then((r) => r.json()), {
    dedupingInterval: 3600000,
    revalidateOnFocus: false,
  });

  const [selectedKeyId, setSelectedKeyId] = useLocalStorage<string>(
    "selected-api-key",
    ""
  );

  const models = modelsData?.models || chatModels;
  const currentModel = models.find((m: any) => m.id === selectedModelId);

  // Filter keys for this provider
  const availableKeys = (Array.isArray(keys) ? keys : []).filter(
    (k: any) => k.provider_id === currentModel?.providerId && k.is_active
  );

  const activeKey =
    availableKeys.find((k: any) => k.id === selectedKeyId) || availableKeys[0];

  if (availableKeys.length === 0) {
    return (
      <Button
        className="h-7 max-w-[120px] justify-between gap-1 rounded-md px-1.5 text-[10px] font-black text-destructive transition-colors uppercase tracking-tighter hover:text-destructive hover:bg-destructive/10"
        disabled={status !== "ready"}
        onClick={() => router.push("/settings")}
        variant="ghost"
      >
        <div className="flex items-center gap-1 truncate">
          <PlusIcon className="size-2.5" />
          <span className="truncate">Add Key</span>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-7 max-w-[120px] justify-between gap-1 rounded-md px-1.5 text-[10px] font-black text-primary/80 transition-colors uppercase tracking-tighter hover:text-primary hover:bg-transparent disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={status !== "ready"}
          variant="ghost"
        >
          <div className="flex items-center gap-1 truncate">
            <ZapIcon className="size-2.5" />
            <span className="truncate">{activeKey?.name || "Select Key"}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          align="start"
          className="w-[calc(100vw-32px)] sm:w-[180px] p-1.5 rounded-xl backdrop-blur-2xl border-border/40 bg-card/90 z-50"
          collisionPadding={16}
          side="top"
          sideOffset={12}
        >
          <div className="px-2 py-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/10 mb-1">
            Collection Keys
          </div>
          {availableKeys.map((k: any) => (
            <DropdownMenuItem
              className={cn(
                "flex flex-col items-start gap-0.5 p-2 rounded-lg cursor-pointer focus:bg-primary/5",
                selectedKeyId === k.id && "bg-primary/5"
              )}
              key={k.id}
              onSelect={() => setSelectedKeyId(k.id)}
            >
              <span className="text-[11px] font-bold">{k.name}</span>
              <span className="text-[9px] text-muted-foreground font-mono opacity-50 truncate w-full italic">
                {k.is_public ? "System Neural Vault" : "Encrypted Personal Vault"}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="h-7 w-7 rounded-xl bg-foreground p-1 text-background transition-all duration-200 hover:opacity-85 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/25 disabled:cursor-not-allowed"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSearchButton({
  isEnabled,
  onClick,
  status,
}: {
  isEnabled: boolean;
  onClick: () => void;
  status: UseChatHelpers<ChatMessage>["status"];
}) {
  return (
    <Button
      className={cn(
        "h-7 px-2.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-[11px] font-bold shadow-sm",
        isEnabled
          ? "bg-primary/10 border-primary/30 text-primary shadow-primary/10"
          : "bg-background/40 border-border/40 text-muted-foreground hover:border-border hover:text-foreground hover:bg-background/60"
      )}
      disabled={status !== "ready"}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      variant="ghost"
    >
      <GlobeIcon className={cn("size-3.5", isEnabled && "animate-pulse")} />
      <span>Search</span>
      {isEnabled && (
        <div className="size-1 rounded-full bg-primary animate-ping" />
      )}
    </Button>
  );
}

const SearchButton = memo(PureSearchButton);
