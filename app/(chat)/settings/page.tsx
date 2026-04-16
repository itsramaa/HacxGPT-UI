"use client";

import {
  ClockIcon,
  GlobeIcon,
  KeyIcon,
  PlusIcon,
  RefreshCwIcon,
  Settings2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  ZapIcon,
  SearchIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { LoaderIcon } from "@/components/chat/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, fetcher } from "@/lib/utils";
import { MobileHeader } from "@/components/chat/mobile-header";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  const { data: keys, isLoading: keysLoading } = useSWR<any[]>(
    "/api/keys",
    fetcher
  );
  const { data: providersData, isLoading: providersLoading } = useSWR<any>(
    "/api/providers",
    fetcher
  );
  const { data: modelsData } = useSWR("/api/models", fetcher, {
    dedupingInterval: 3600000,
    revalidateOnFocus: false,
  });

  // Model Hub Pagination & Search State
  const [modelPages, setModelPages] = useState<Record<string, number>>({});
  const [hubSearchQuery, setHubSearchQuery] = useState("");
  const [hubDebouncedQuery, setHubDebouncedQuery] = useState("");
  const [hubPage, setHubPage] = useState(1);
  const HUB_ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHubDebouncedQuery(hubSearchQuery);
      setHubPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [hubSearchQuery]);

  const { data: catalogData, isLoading: catalogLoading } = useSWR<any>(
    `/api/providers?all=true&page=${hubPage}&size=${HUB_ITEMS_PER_PAGE}&q=${encodeURIComponent(hubDebouncedQuery)}`,
    fetcher
  );

  const { data: preferences, mutate: mutatePrefs } = useSWR(
    "/api/providers/preferences",
    fetcher
  );

  // Form State
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [keyName, setKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [disabledProviders, setDisabledProviders] = useState<string[]>([]);
  const [disabledModels, setDisabledModels] = useState<string[]>([]);

  const hasSyncedPrefs = useRef(false);
  useEffect(() => {
    if (preferences && !hasSyncedPrefs.current) {
      setDisabledProviders(preferences.disabled_provider_ids || []);
      setDisabledModels(preferences.disabled_model_ids || []);
      hasSyncedPrefs.current = true;
    }
  }, [preferences]);

  // Pagination State
  const ITEMS_PER_PAGE = 4;
  const [keyPage, setKeyPage] = useState(1);
  const [providerPage, setProviderPage] = useState(1);

  // Confirmation States
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [pendingDeleteData, setPendingDeleteData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const models = modelsData?.models || [];
  const activeKeys = keys || [];
  const allProviders = providersData?.items || providersData || [];
  const fullCatalog = catalogData?.items || catalogData || [];
  const catalogTotalPages = catalogData ? Math.max(1, Math.ceil((catalogData.total || 1) / HUB_ITEMS_PER_PAGE)) : 1;

  // Paginated Data
  const paginatedKeys = activeKeys.slice(
    (keyPage - 1) * ITEMS_PER_PAGE,
    keyPage * ITEMS_PER_PAGE
  );
  const totalKeyPages = Math.ceil(activeKeys.length / ITEMS_PER_PAGE);

  const paginatedProviders = allProviders.slice(
    (providerPage - 1) * ITEMS_PER_PAGE,
    providerPage * ITEMS_PER_PAGE
  );
  const totalProviderPages = Math.ceil(allProviders.length / ITEMS_PER_PAGE);

  const handleRegisterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !keyName || !apiKeyValue) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selectedProviderId,
          name: keyName,
          api_key: apiKeyValue,
        }),
      });

      if (res.ok) {
        toast.success(`Key "${keyName}" registered successfully`);
        setKeyName("");
        setApiKeyValue("");
        mutate("/api/keys");
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to register key");
      }
    } catch (_err) {
      toast.error("Execution failed. Check your network.");
    } finally {
      setIsSaving(false);
    }
  };

  // Selection State
  const [selectedKeyIds, setSelectedKeyIds] = useState<Set<string>>(new Set());

  const executeBulkDelete = async () => {
    if (selectedKeyIds.size === 0) { return; }
    try {
      const ids = Array.from(selectedKeyIds);
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        toast.success(`${selectedKeyIds.size} connections purged`);
        setSelectedKeyIds(new Set());
        mutate("/api/keys");
      }
    } catch (_err) {
      toast.error("Bulk deletion failed");
    } finally {
      setConfirmBulkOpen(false);
    }
  };

  const executePurgeAll = async () => {
    try {
      const res = await fetch("/api/keys?all=true", { method: "DELETE" });
      if (res.ok) {
        toast.success("Vault wiped successfully");
        setSelectedKeyIds(new Set());
        mutate("/api/keys");
      }
    } catch (_err) {
      toast.error("Failed to wipe vault");
    } finally {
      setConfirmPurgeOpen(false);
    }
  };

  const executeDeleteKey = async () => {
    if (!pendingDeleteData) { return; }
    try {
      const res = await fetch(`/api/keys/${pendingDeleteData.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Connection "${pendingDeleteData.name}" removed`);
        mutate("/api/keys");
      } else {
        toast.error("Failed to delete connection");
      }
    } catch (_err) {
      toast.error("Deletion failed");
    } finally {
      setConfirmDeleteOpen(false);
      setPendingDeleteData(null);
    }
  };

  const savePreferences = async () => {
    setIsUpdatingPrefs(true);
    try {
      const res = await fetch("/api/providers/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disabled_provider_ids: disabledProviders,
          disabled_model_ids: disabledModels,
        }),
      });
      if (res.ok) {
        toast.success("Model Hub visibility updated.");
        mutatePrefs();
        mutate("/api/providers"); // Refresh main provider list
      } else {
        toast.error("Failed to update preferences.");
      }
    } catch (_err) {
      toast.error("Sync failed.");
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const toggleProviderVisibility = (id: string) => {
    setDisabledProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleModelVisibility = (id: string) => {
    setDisabledModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedKeyIds.size === activeKeys.length) {
      setSelectedKeyIds(new Set());
    } else {
      setSelectedKeyIds(new Set(activeKeys.map((k: any) => k.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedKeyIds);
    if (next.has(id)) { next.delete(id); }
    else { next.add(id); }
    setSelectedKeyIds(next);
  };

  const [isRevalidatingSelf, setIsRevalidatingSelf] = useState(false);
  const handleRevalidateSelf = async () => {
    setIsRevalidatingSelf(true);
    try {
      const res = await fetch("/api/keys/revalidate", { method: "POST" });
      if (!res.ok) {
        throw new Error("Revalidation protocol failed.");
      }
      toast.success("Vault re-validation initiated in background.");
      setTimeout(() => mutate("/api/keys"), 5000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRevalidatingSelf(false);
    }
  };

  const [revalidatingKeyId, setRevalidatingKeyId] = useState<string | null>(
    null
  );
  const handleRevalidateKey = async (id: string) => {
    setRevalidatingKeyId(id);
    try {
      const res = await fetch(`/api/keys/${id}/revalidate`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Target probe failed.");
      }
      toast.success("Single-node probe queued.");
      setTimeout(() => mutate("/api/keys"), 3000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRevalidatingKeyId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background/30 backdrop-blur-sm border-l border-border/10">
      <MobileHeader title="API Settings" />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-6xl py-6 md:py-12 px-4 md:px-6 space-y-12 md:space-y-16 overflow-x-hidden">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 md:px-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-[10px] uppercase">
                <ShieldCheckIcon size={12} />
                Secured Vault
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40 italic">
                COMMAND CENTER
              </h1>
              <p className="text-muted-foreground font-medium max-w-lg text-sm md:text-base leading-relaxed opacity-80">
                Architect your AI ecosystem. Manage provider collections,
                encrypted credentials, and global model landscape.
              </p>
            </div>
            <div className="flex items-center gap-3 md:gap-4 self-start md:self-auto bg-card/20 p-2 rounded-2xl border border-border/10 md:bg-transparent md:p-0 md:border-0">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-foreground/80">
                  {session?.user?.name || "Architect"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                  System Administrator
                </span>
              </div>
              <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                <Settings2Icon className="size-5 md:size-6" />
              </div>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-3 px-1 md:px-0">
            {/* Form Side - Left 1 col */}
            <div className="lg:col-span-1 space-y-8">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <PlusIcon size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Expand Collections
                  </h2>
                </div>

                <Card className="border-border/30 bg-card/40 backdrop-blur-md shadow-2xl shadow-primary/5 rounded-[1.5rem]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-90">
                      New Credential
                    </CardTitle>
                    <CardDescription className="text-[11px] leading-relaxed">
                      Link a new API key to your secure vault.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6" onSubmit={handleRegisterKey}>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Provider Platform
                        </Label>
                        <Select
                          onValueChange={setSelectedProviderId}
                          value={selectedProviderId}
                        >
                          <SelectTrigger className="h-11 bg-background/50 border-border/20 w-full rounded-xl">
                            <SelectValue placeholder="Select Platform..." />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-2xl border-border/40">
                            {allProviders?.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Connection Name
                        </Label>
                        <Input
                          className="h-11 bg-background/50 border-border/20 rounded-xl"
                          onChange={(e) => setKeyName(e.target.value)}
                          placeholder="e.g. My Primary Workspace"
                          value={keyName}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Secret Key
                        </Label>
                        <Input
                          className="h-11 bg-background/50 border-border/20 rounded-xl"
                          onChange={(e) => setApiKeyValue(e.target.value)}
                          placeholder="••••••••••••••••"
                          type="password"
                          value={apiKeyValue}
                        />
                      </div>

                      <Button
                        className="w-full h-11 font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl bg-primary text-primary-foreground hover:scale-[1.01] active:scale-95 transition-all"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <LoaderIcon className="animate-spin mr-2" size={16} />
                        ) : (
                          <ZapIcon className="mr-2" size={14} />
                        )}
                        Authorize Connection
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* List Side - Right 2 cols */}
            <div className="lg:col-span-2 space-y-12">
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
                          disabled={keyPage === 1}
                          onClick={() => setKeyPage((p) => p - 1)}
                          variant="outline"
                        >
                          &lt;
                        </Button>
                        <span className="text-[10px] font-black tabular-nums opacity-60">
                          {keyPage}/{Math.max(1, totalKeyPages)}
                        </span>
                        <Button
                          className="h-7 w-7 p-0 rounded-lg"
                          disabled={
                            keyPage === totalKeyPages || totalKeyPages === 0
                          }
                          onClick={() => setKeyPage((p) => p + 1)}
                          variant="outline"
                        >
                          &gt;
                        </Button>
                      </div>
                      <Button
                        className="h-8 text-[9px] font-black border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2"
                        disabled={isRevalidatingSelf}
                        onClick={handleRevalidateSelf}
                        size="sm"
                        variant="outline"
                      >
                        {isRevalidatingSelf ? (
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
                        {activeKeys.length} ENTRIES
                      </Badge>
                    </div>
                  </div>

                  {activeKeys.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 p-2 bg-muted/10 rounded-xl border border-border/10">
                      <Button
                        className="h-8 text-[10px] font-black hover:bg-black/40 hover:text-white transition-all flex items-center gap-2"
                        onClick={toggleSelectAll}
                        size="sm"
                        variant="ghost"
                      >
                        <div
                          className={cn(
                            "size-3.5 rounded border border-foreground/30 flex items-center justify-center transition-colors",
                            selectedKeyIds.size === activeKeys.length &&
                            "bg-primary border-primary"
                          )}
                        >
                          {selectedKeyIds.size === activeKeys.length && (
                            <div className="size-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />
                          )}
                        </div>
                        {selectedKeyIds.size === activeKeys.length
                          ? "DESELECT ALL"
                          : "SELECT ALL"}
                      </Button>

                      <div className="h-4 w-px bg-border/20 hidden sm:block" />

                      {selectedKeyIds.size > 0 ? (
                        <Button
                          className="h-8 text-[10px] font-black px-4 shadow-lg shadow-destructive/20 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg animate-in zoom-in-95 duration-200"
                          onClick={() => setConfirmBulkOpen(true)}
                          size="sm"
                          variant="destructive"
                        >
                          DELETE SELECTED ({selectedKeyIds.size})
                        </Button>
                      ) : (
                        <Button
                          className="h-8 text-[10px] font-black text-muted-foreground hover:text-destructive transition-colors ml-auto sm:ml-0"
                          onClick={() => setConfirmPurgeOpen(true)}
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
                          disabled={keyPage === 1}
                          onClick={() => setKeyPage((p) => p - 1)}
                          variant="outline"
                        >
                          &lt;
                        </Button>
                        <span className="text-[10px] font-black tabular-nums opacity-60">
                          {keyPage}/{Math.max(1, totalKeyPages)}
                        </span>
                        <Button
                          className="h-7 w-7 p-0 rounded-lg"
                          disabled={
                            keyPage === totalKeyPages || totalKeyPages === 0
                          }
                          onClick={() => setKeyPage((p) => p + 1)}
                          variant="outline"
                        >
                          &gt;
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {keysLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card/10 rounded-3xl border border-dashed border-border/40">
                    <LoaderIcon className="animate-spin" size={16} />
                    <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                      Fetching Vault...
                    </span>
                  </div>
                ) : activeKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-card/10 rounded-3xl border border-dashed border-border/40 space-y-4">
                    <GlobeIcon className="text-muted-foreground/20 size-12" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-muted-foreground/80 tracking-tight">
                        No established connections found.
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 max-w-xs">
                        Your workspace is currently offline. Connect an AI
                        provider to enable processing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {paginatedKeys.map((k) => (
                      <div
                        className={cn(
                          "group p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden",
                          selectedKeyIds.has(k.id)
                            ? "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/5"
                            : "border-border/30 bg-card/20 backdrop-blur-md hover:bg-card/40 hover:border-primary/30"
                        )}
                        key={k.id}
                      >
                        {/* Selection Overlay for checkmark feel */}
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
                            onClick={() => toggleSelectOne(k.id)}
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
                                {new Date(k.created_at).toLocaleString(
                                  undefined,
                                  { dateStyle: "medium", timeStyle: "short" }
                                )}
                              </span>
                              <span className="flex items-center gap-1.5 min-w-fit">
                                <ZapIcon className="shrink-0" size={10} />
                                Last check:{" "}
                                {k.last_used_at
                                  ? new Date(k.last_used_at).toLocaleString(
                                    undefined,
                                    { dateStyle: "medium", timeStyle: "short" }
                                  )
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
                              <span className="text-[9px] text-red-400/60 max-w-[120px] truncate">
                                {k.last_error}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {!k.is_active && (
                              <Button
                                className="h-10 w-10 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                                disabled={revalidatingKeyId === k.id}
                                onClick={() => handleRevalidateKey(k.id)}
                                size="icon"
                                title="Revalidate this key"
                                variant="ghost"
                              >
                                {revalidatingKeyId === k.id ? (
                                  <LoaderIcon className="size-4 animate-spin text-emerald-500" />
                                ) : (
                                  <RefreshCwIcon size={16} />
                                )}
                              </Button>
                            )}
                            <Button
                              className="h-10 w-10 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10 rounded-xl"
                              onClick={() => {
                                setPendingDeleteData({ id: k.id, name: k.name });
                                setConfirmDeleteOpen(true);
                              }}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2Icon size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Personalize Model Hub */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-primary">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ZapIcon size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Model Hub Preferences
                  </h2>
                </div>

                <Card className="border-border/30 bg-card/40 backdrop-blur-md rounded-[1.5rem] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase">Visibility Control</CardTitle>
                    <CardDescription className="text-xs">
                      Deactivate providers or specific models that you don't use to declutter your workspace.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="relative w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="Search providers or models..."
                          value={hubSearchQuery}
                          onChange={(e) => setHubSearchQuery(e.target.value)}
                          className="w-full text-sm bg-background/50 border border-border/50 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground/50 transition-colors"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-border/40"
                          disabled={hubPage === 1}
                          onClick={() => setHubPage((p) => p - 1)}
                        >
                          Prev
                        </Button>
                        <span className="text-xs text-muted-foreground font-mono">
                          {hubPage} / {catalogTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-border/40"
                          disabled={hubPage >= catalogTotalPages}
                          onClick={() => setHubPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    {catalogLoading ? (
                      <div className="flex justify-center p-8"><LoaderIcon className="animate-spin" /></div>
                    ) : fullCatalog.length === 0 ? (
                      <div className="flex justify-center p-8 text-sm text-muted-foreground font-medium">No results found.</div>
                    ) : (
                      <div className="grid gap-4">
                        {fullCatalog?.map((p: any) => {
                          const currentPage = modelPages[p.id] || 1;
                          const MODELS_PER_PAGE = 12;
                          const totalPages = Math.max(1, Math.ceil((p.models?.length || 0) / MODELS_PER_PAGE));
                          const paginatedModels = (p.models || []).slice((currentPage - 1) * MODELS_PER_PAGE, currentPage * MODELS_PER_PAGE);

                          return (
                            <div key={p.id} className="p-4 rounded-2xl border border-border/20 bg-background/20 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn("size-2 rounded-full", !disabledProviders.includes(p.id) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
                                  <span className="font-bold text-sm tracking-tight capitalize">{p.name}</span>
                                </div>
                                <Button
                                  className={cn("h-7 text-[10px] font-black", !disabledProviders.includes(p.id) ? "text-primary" : "text-muted-foreground")}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleProviderVisibility(p.id)}
                                >
                                  {!disabledProviders.includes(p.id) ? "ENABLED" : "DISABLED"}
                                </Button>
                              </div>

                              {!disabledProviders.includes(p.id) && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-5 pt-2 border-l border-border/10 ml-1">
                                    {paginatedModels.map((m: any) => (
                                      <div
                                        key={m.id}
                                        className={cn(
                                          "flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer",
                                          !disabledModels.includes(m.id) ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border/10 opacity-50"
                                        )}
                                        onClick={() => toggleModelVisibility(m.id)}
                                      >
                                        <span className="text-[10px] font-medium truncate">{m.alias || m.name}</span>
                                        <div className={cn("size-3 rounded-md border flex items-center justify-center transition-all", !disabledModels.includes(m.id) ? "bg-primary border-primary text-white" : "border-border/40")} >
                                          {!disabledModels.includes(m.id) && <div className="size-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {totalPages > 1 && (
                                    <div className="flex justify-end items-center gap-2 pr-2">
                                      <Button
                                        variant="ghost" size="sm" className="h-6 px-2 text-[10px] hover:bg-white/5"
                                        disabled={currentPage === 1}
                                        onClick={() => setModelPages(prev => ({ ...prev, [p.id]: currentPage - 1 }))}
                                      >
                                        Prev
                                      </Button>
                                      <span className="text-[10px] text-muted-foreground font-mono">{currentPage} / {totalPages}</span>
                                      <Button
                                        variant="ghost" size="sm" className="h-6 px-2 text-[10px] hover:bg-white/5"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setModelPages(prev => ({ ...prev, [p.id]: currentPage + 1 }))}
                                      >
                                        Next
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-4 border-t border-border/10 flex justify-end">
                      <Button
                        onClick={savePreferences}
                        disabled={isUpdatingPrefs}
                        className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-6 shadow-lg shadow-primary/20"
                      >
                        {isUpdatingPrefs ? <LoaderIcon className="animate-spin mr-2" /> : <ZapIcon className="mr-2" size={14} />}
                        SAVE_VISIBILITY_STATE
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>

        {/* Confirmation Modals */}
        <AlertDialog onOpenChange={setConfirmDeleteOpen} open={confirmDeleteOpen}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Neural Channel?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to purge{" "}
                <span className="text-primary font-bold">
                  "{pendingDeleteData?.name}"
                </span>
                ? This will disable communication with the target provider.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ABORT</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={executeDeleteKey}
              >
                PURGE_NODE
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog onOpenChange={setConfirmBulkOpen} open={confirmBulkOpen}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle>Execute Cluster Wipe?</AlertDialogTitle>
              <AlertDialogDescription>
                Wipe{" "}
                <span className="text-primary font-bold">
                  {selectedKeyIds.size} selected connections
                </span>
                . This batch operation cannot be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ABORT</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={executeBulkDelete}
              >
                EXECUTE_WIPE
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog onOpenChange={setConfirmPurgeOpen} open={confirmPurgeOpen}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive font-black tracking-widest uppercase">
                CRITICAL_VAULT_RESET
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are about to wipe your entire API key reservoir. This action
                results in total system silence. Proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>SECURE_ABORT</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={executePurgeAll}
              >
                WIPE_TOTAL_VAULT
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
