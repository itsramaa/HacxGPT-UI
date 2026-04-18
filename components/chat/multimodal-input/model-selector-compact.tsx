"use client";

import { memo, useEffect, useState } from "react";
import useSWR from "swr";
import { useWindowSize } from "usehooks-ts";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  SearchIcon, 
  StarIcon, 
  ZapIcon, 
  GlobeIcon 
} from "lucide-react";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
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
import { 
  type ChatModel, 
  chatModels, 
  DEFAULT_CHAT_MODEL 
} from "@/lib/ai/models";
import { cn } from "@/lib/utils";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

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
  const size = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: modelsData } = useSWR(
    `/api/models?page=${page}&size=${size}&q=${encodeURIComponent(debouncedQuery)}`,
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

  const providerGroups: Record<string, ChatModel[]> = {};
  const providerHasKey: Record<string, boolean> = {};

  for (const model of activeModels) {
    const pName = model.providerName || "HacxGPT";
    if (!providerGroups[pName]) { providerGroups[pName] = []; }
    providerGroups[pName].push(model);
    if (model.hasKey || pName === "hacxgpt") {
      providerHasKey[pName] = true;
    }
  }

  const pNames = Object.keys(providerGroups);

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
              activeProvider={activeMobileProvider}
              hasKey={!!providerHasKey[activeMobileProvider]}
              models={providerGroups[activeMobileProvider] || []}
              onBack={() => setActiveMobileProvider(null)}
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
              setOpen={setOpen}
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
                        onMobileSelect={() => setActiveMobileProvider(pName)}
                        pName={pName}
                        selectedModelId={selectedModelId}
                        setOpen={setOpen}
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
                        onMobileSelect={() => setActiveMobileProvider(pName)}
                        pName={pName}
                        selectedModelId={selectedModelId}
                        setOpen={setOpen}
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

export const ModelSelectorCompact = memo(PureModelSelectorCompact);

function MobileProviderModelsView({
  activeProvider,
  models,
  selectedModelId,
  onModelChange,
  setOpen,
  onBack,
  hasKey: _hasKey,
}: {
  activeProvider: string;
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
          <ModelSelectorLogo className="size-3" provider={activeProvider} />
          <span className="text-[11px] font-black uppercase tracking-[1px] truncate max-w-[100px]">{activeProvider}</span>
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
          alignOffset={0}
          className="w-[calc(100vw-48px)] sm:w-[260px] p-2 rounded-2xl backdrop-blur-3xl bg-card shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-left-2 duration-200 ease-out z-[60]"
          collisionPadding={16}
          sideOffset={6}
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
                      <span className={cn("text-[10px] font-mono opacity-60 truncate w-full", model.id === selectedModelId ? "text-primary-foreground/80" : "text-muted-foreground")}>{model.id}</span>
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
