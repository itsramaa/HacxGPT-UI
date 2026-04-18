"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useLocalStorage } from "usehooks-ts";
import type { UseChatHelpers } from "@ai-sdk/react";
import { PlusIcon, ZapIcon } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { chatModels } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ApiKeySelectorCompact({
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
