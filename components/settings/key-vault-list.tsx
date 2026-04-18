import { LoaderIcon } from "@/components/chat/icons";
import {
  ClockIcon,
  GlobeIcon,
  KeyIcon,
  RefreshCwIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function KeyVaultList({
  keys,
  isLoading,
  selectedKeyIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onBulkDelete,
  onPurgeAll,
  onDeleteKey,
  onRevalidateVault,
  onRevalidateKey,
  isRevalidatingVault,
  revalidatingKeyId,
  page,
  setPage,
  totalPages,
}: {
  keys: any[];
  isLoading: boolean;
  selectedKeyIds: Set<string>;
  onToggleSelectAll: (ids: string[]) => void;
  onToggleSelectOne: (id: string) => void;
  onBulkDelete: () => void;
  onPurgeAll: () => void;
  onDeleteKey: (id: string, name: string) => void;
  onRevalidateVault: () => void;
  onRevalidateKey: (id: string) => void;
  isRevalidatingVault: boolean;
  revalidatingKeyId: string | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-500">
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <KeyIcon size={16} />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Active Connections
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Button
                className="h-7 w-7 p-0 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                variant="outline"
              >
                &lt;
              </Button>
              <span className="text-[10px] font-black tabular-nums opacity-60">
                {page}/{Math.max(1, totalPages)}
              </span>
              <Button
                className="h-7 w-7 p-0 rounded-lg"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => p + 1)}
                variant="outline"
              >
                &gt;
              </Button>
            </div>
            <Button
              className="h-8 text-[9px] font-black border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2"
              disabled={isRevalidatingVault}
              onClick={onRevalidateVault}
              size="sm"
              variant="outline"
            >
              {isRevalidatingVault ? (
                <LoaderIcon className="size-3 animate-spin" />
              ) : (
                <RefreshCwIcon size={12} />
              )}
              REVALIDATE_VAULT
            </Button>
            <Badge
              className="text-[9px] font-black border-border/40 bg-card/30"
              variant="outline"
            >
              {keys.length} ENTRIES
            </Badge>
          </div>
        </div>

        {keys.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-2 bg-muted/10 rounded-xl border border-border/10">
            <Button
              className="h-8 text-[10px] font-black hover:bg-black/40 hover:text-white transition-all flex items-center gap-2"
              onClick={() => onToggleSelectAll(keys.map((k: any) => k.id))}
              size="sm"
              variant="ghost"
            >
              <div
                className={cn(
                  "size-3.5 rounded border border-foreground/30 flex items-center justify-center transition-colors",
                  selectedKeyIds.size === keys.length &&
                    "bg-primary border-primary"
                )}
              >
                {selectedKeyIds.size === keys.length && (
                  <div className="size-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />
                )}
              </div>
              {selectedKeyIds.size === keys.length
                ? "DESELECT ALL"
                : "SELECT ALL"}
            </Button>

            <div className="h-4 w-px bg-border/20 hidden sm:block" />

            {selectedKeyIds.size > 0 ? (
              <Button
                className="h-8 text-[10px] font-black px-4 shadow-lg shadow-destructive/20 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg animate-in zoom-in-95 duration-200"
                onClick={onBulkDelete}
                size="sm"
                variant="destructive"
              >
                DELETE SELECTED ({selectedKeyIds.size})
              </Button>
            ) : (
              <Button
                className="h-8 text-[10px] font-black text-muted-foreground hover:text-destructive transition-colors ml-auto sm:ml-0"
                onClick={onPurgeAll}
                size="sm"
                variant="ghost"
              >
                <Trash2Icon className="mr-2 size-3" />
                PURGE VAULT
              </Button>
            )}

            <div className="flex sm:hidden items-center gap-3 ml-auto">
              <Button
                className="h-7 w-7 p-0 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                variant="outline"
              >
                &lt;
              </Button>
              <span className="text-[10px] font-black tabular-nums opacity-60">
                {page}/{Math.max(1, totalPages)}
              </span>
              <Button
                className="h-7 w-7 p-0 rounded-lg"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => p + 1)}
                variant="outline"
              >
                &gt;
              </Button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card/10 rounded-3xl border border-dashed border-border/40">
          <LoaderIcon className="animate-spin" size={16} />
          <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Fetching Vault...
          </span>
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card/10 rounded-3xl border border-dashed border-border/40 space-y-4">
          <GlobeIcon className="text-muted-foreground/20 size-12" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-muted-foreground/80 tracking-tight">
              No established connections found.
            </p>
            <p className="text-[11px] text-muted-foreground/60 max-w-xs">
              Your workspace is currently offline. Connect an AI provider to
              enable processing.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {keys.map((k) => (
            <div
              className={cn(
                "group p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden",
                selectedKeyIds.has(k.id)
                  ? "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/5"
                  : "border-border/30 bg-card/20 backdrop-blur-md hover:bg-card/40 hover:border-primary/30"
              )}
              key={k.id}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-all"
                style={{
                  backgroundColor: selectedKeyIds.has(k.id)
                    ? "var(--primary)"
                    : "transparent",
                }}
              />

              <div className="flex items-center gap-5">
                <button
                  className={cn(
                    "group/check flex items-center justify-center size-5 rounded-lg border-2 transition-all",
                    selectedKeyIds.has(k.id)
                      ? "bg-primary border-primary text-white"
                      : "border-border/40 hover:border-primary/60 bg-white/5"
                  )}
                  onClick={() => onToggleSelectOne(k.id)}
                  type="button"
                >
                  {selectedKeyIds.has(k.id) && (
                    <div className="size-2 bg-white rounded-full shadow-[0_0_8px_white]" />
                  )}
                </button>

                <div
                  className={`size-12 rounded-2xl flex items-center justify-center border transition-shadow ${k.is_active ? "bg-primary/5 border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.05)]" : "bg-muted/10 border-border/40 text-muted-foreground opacity-50"}`}
                >
                  <ZapIcon size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold tracking-tight italic">
                      {k.name}
                    </span>
                    <Badge className="bg-zinc-500/10 text-zinc-500 text-[9px] font-black border-none h-4">
                      {k.provider?.name?.toUpperCase() || "EXTERNAL"}
                    </Badge>
                    {!k.is_active && (
                      <Badge
                        className="text-[9px] font-black h-4"
                        variant="destructive"
                      >
                        SUSPENDED
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5 min-w-fit">
                      <ClockIcon className="shrink-0" size={10} />
                      Created{" "}
                      {k.created_at
                        ? new Date(k.created_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5 min-w-fit">
                      <ZapIcon className="shrink-0" size={10} />
                      Last check:{" "}
                      {k.last_used_at
                        ? new Date(k.last_used_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Never"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-border/10 justify-between md:justify-end">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span
                    className={cn(
                      "text-[10px] font-black tracking-widest uppercase",
                      k.is_active
                        ? "text-emerald-500/80"
                        : "text-amber-500/80"
                    )}
                  >
                    {k.is_active ? "• OPERATIONAL" : "• STANDBY"}
                  </span>
                  {k.last_error && (
                    <span className="text-[9px] text-red-400 font-medium">
                      {k.last_error}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!k.is_active && (
                    <button
                      className="h-10 w-10 flex items-center justify-center text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors"
                      disabled={revalidatingKeyId === k.id}
                      onClick={() => onRevalidateKey(k.id)}
                      title="Revalidate this key"
                    >
                      {revalidatingKeyId === k.id ? (
                        <LoaderIcon className="size-4 animate-spin text-emerald-500" />
                      ) : (
                        <RefreshCwIcon size={16} />
                      )}
                    </button>
                  )}
                  <button
                    className="h-10 w-10 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={() => onDeleteKey(k.id, k.name)}
                  >
                    <Trash2Icon size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
