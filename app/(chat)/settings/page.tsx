"use client";

import {
  ClockIcon,
  GlobeIcon,
  KeyIcon,
  PlusIcon,
  Settings2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
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

export default function SettingsPage() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  const { data: keys, isLoading: keysLoading } = useSWR<any[]>(
    "/api/keys",
    fetcher
  );
  const { data: providers, isLoading: providersLoading } = useSWR<any[]>(
    "/api/providers",
    fetcher
  );
  const { data: modelsData } = useSWR("/api/models", fetcher);

  // Form State
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [keyName, setKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
  const allProviders = providers || [];

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

  return (
    <div className="flex-1 overflow-y-auto bg-background/30 backdrop-blur-sm border-l border-border/10">
      <div className="container mx-auto max-w-6xl py-12 px-6 space-y-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-[10px] uppercase">
              <ShieldCheckIcon size={12} />
              Secured Vault
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40 italic">
              COMMAND CENTER
            </h1>
            <p className="text-muted-foreground font-medium max-w-lg">
              Architect your AI ecosystem. Manage provider collections,
              encrypted credentials, and global model landscape.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-foreground/80">
                {session?.user?.name || "Architect"}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                System Administrator
              </span>
            </div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <Settings2Icon size={24} />
            </div>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
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

              <Card className="border-border/30 bg-card/40 backdrop-blur-md shadow-2xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">
                    New Credential
                  </CardTitle>
                  <CardDescription className="text-[11px]">
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
                        <SelectTrigger className="h-10 bg-background/50 border-border/20 w-full">
                          <SelectValue placeholder="Select Platform..." />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-2xl border-border/40">
                          {allProviders?.map((p) => (
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
                        className="h-10 bg-background/50 border-border/20"
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
                        className="h-10 bg-background/50 border-border/20"
                        onChange={(e) => setApiKeyValue(e.target.value)}
                        placeholder="••••••••••••••••"
                        type="password"
                        value={apiKeyValue}
                      />
                    </div>

                    <Button
                      className="w-full h-10 font-bold tracking-tight shadow-lg shadow-primary/20"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <LoaderIcon className="animate-spin" size={16} />
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-500">
                  <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <KeyIcon size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Active Connections
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {activeKeys.length > 0 && (
                    <div className="flex items-center gap-2 pr-4 border-r border-border/20">
                      <Button
                        className="h-8 text-[10px] font-black hover:bg-black/40 hover:text-white transition-all flex items-center gap-2"
                        onClick={toggleSelectAll}
                        size="sm"
                        variant="ghost"
                      >
                        <div
                          className={cn(
                            "size-3 rounded border border-foreground/30 flex items-center justify-center",
                            selectedKeyIds.size === activeKeys.length &&
                              "bg-primary border-primary"
                          )}
                        >
                          {selectedKeyIds.size === activeKeys.length && (
                            <div className="size-1.5 bg-white rounded-full" />
                          )}
                        </div>
                        {selectedKeyIds.size === activeKeys.length
                          ? "DESELECT ALL"
                          : "SELECT ALL"}
                      </Button>

                      {selectedKeyIds.size > 0 ? (
                        <Button
                          className="h-8 text-[10px] font-black px-4 shadow-lg shadow-destructive/20"
                          onClick={() => setConfirmBulkOpen(true)}
                          size="sm"
                          variant="destructive"
                        >
                          DELETE SELECTED ({selectedKeyIds.size})
                        </Button>
                      ) : (
                        <Button
                          className="h-8 text-[10px] font-black text-muted-foreground hover:text-red-400"
                          onClick={() => setConfirmPurgeOpen(true)}
                          size="sm"
                          variant="ghost"
                        >
                          PURGE VAULT
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        className="h-6 w-6 p-0"
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
                        className="h-6 w-6 p-0"
                        disabled={
                          keyPage === totalKeyPages || totalKeyPages === 0
                        }
                        onClick={() => setKeyPage((p) => p + 1)}
                        variant="outline"
                      >
                        &gt;
                      </Button>
                    </div>
                    <Badge
                      className="text-[9px] font-black border-border/40 bg-card/30"
                      variant="outline"
                    >
                      {activeKeys.length} ENTRIES
                    </Badge>
                  </div>
                </div>
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

            {/* Provider Ecosystem */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-indigo-500">
                  <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <GlobeIcon size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Provider Ecosystem
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    className="h-6 w-6 p-0"
                    disabled={providerPage === 1}
                    onClick={() => setProviderPage((p) => p - 1)}
                    variant="outline"
                  >
                    &lt;
                  </Button>
                  <span className="text-[10px] font-black tabular-nums opacity-60">
                    {providerPage}/{Math.max(1, totalProviderPages)}
                  </span>
                  <Button
                    className="h-6 w-6 p-0"
                    disabled={
                      providerPage === totalProviderPages ||
                      totalProviderPages === 0
                    }
                    onClick={() => setProviderPage((p) => p + 1)}
                    variant="outline"
                  >
                    &gt;
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {paginatedProviders?.map((p: any) => {
                  const providerKeys = activeKeys.filter(
                    (k) => k.provider_id === p.id
                  );
                  const isAuthorized = providerKeys.some((k) => k.is_active);
                  const providerModels = models.filter(
                    (m: any) => m.provider_id === p.id || m.providerId === p.id
                  );

                  return (
                    <div
                      className="relative p-6 rounded-3xl border border-border/20 bg-card/10 hover:bg-card/30 hover:border-primary/20 transition-all group overflow-hidden flex flex-col gap-6"
                      key={p.id}
                    >
                      <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                        <GlobeIcon size={128} />
                      </div>

                      <div className="flex items-start justify-between relative">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black tracking-tighter italic uppercase">
                            {p.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                            {p.base_url}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-[9px] font-black tracking-widest px-2 py-0.5 border-none",
                            isAuthorized
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-zinc-500/10 text-zinc-500"
                          )}
                        >
                          {isAuthorized ? "AUTHORIZED" : "NO ACTIVE KEYS"}
                        </Badge>
                      </div>

                      <div className="space-y-3 relative">
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          <span>Available Models</span>
                          <span>{providerModels.length} Total</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {providerModels.slice(0, 4).map((m: any) => (
                            <span
                              className="px-2 py-1 rounded-md bg-zinc-500/5 border border-border/10 text-[9px] font-medium text-foreground/70"
                              key={m.id}
                            >
                              {m.name}
                            </span>
                          ))}
                          {providerModels.length > 4 && (
                            <span className="px-2 py-1 rounded-md bg-primary/5 text-primary text-[9px] font-bold italic">
                              +{providerModels.length - 4} MORE
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/10 mt-auto relative">
                        <div className="flex -space-x-2">
                          {providerKeys.map((k, _i) => (
                            <div
                              className={cn(
                                "size-6 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-black transition-transform hover:scale-110 cursor-default",
                                k.is_active
                                  ? "bg-emerald-500 text-white"
                                  : "bg-zinc-500 text-white"
                              )}
                              key={k.id}
                              title={k.name}
                            >
                              {k.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {providerKeys.length === 0 && (
                            <span className="text-[9px] font-medium text-muted-foreground italic">
                              No collections linked
                            </span>
                          )}
                        </div>
                        <Button
                          className="h-7 text-[9px] font-black text-primary hover:bg-primary/5 p-0 px-3"
                          size="sm"
                          variant="ghost"
                        >
                          EXPLORE CAPABILITIES
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
  );
}
