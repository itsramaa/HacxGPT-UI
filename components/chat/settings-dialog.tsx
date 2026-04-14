"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoaderIcon } from "./icons";
import { cn } from "@/lib/utils";

type Provider = {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
};

type ApiKey = {
  id: string;
  provider_id: string;
  provider?: Provider;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  last_error: string | null;
};

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ITEMS_PER_PAGE = 5;
  const [providerPage, setProviderPage] = useState(1);
  const [keyPage, setKeyPage] = useState(1);

  // Form state for adding a new key
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [keyName, setKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, kRes] = await Promise.all([
        fetch("/api/providers"),
        fetch("/api/keys"),
      ]);
      if (pRes.ok) setProviders(await pRes.json());
      if (kRes.ok) setKeys(await kRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const handleRegisterKey = async () => {
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
        fetchData();
      } else {
        const error = await res.json();
        let errorMsg = "Failed to register key";
        if (error.detail) {
          if (Array.isArray(error.detail)) {
            errorMsg = error.detail[0]?.msg || JSON.stringify(error.detail[0]);
          } else if (typeof error.detail === 'object') {
            errorMsg = error.detail.msg || JSON.stringify(error.detail);
          } else {
            errorMsg = error.detail;
          }
        }
        toast.error(typeof errorMsg === 'string' ? errorMsg : "Failed to register key");
      }
    } catch (err) {
      toast.error("An error occurred while saving the key");
    } finally {
      setIsSaving(false);
    }
  };

  const [selectedKeyIds, setSelectedKeyIds] = useState<Set<string>>(new Set());

  const handleBulkDelete = async () => {
    if (selectedKeyIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedKeyIds.size} selected keys?`)) return;

    try {
      const ids = Array.from(selectedKeyIds);
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        toast.success(`${selectedKeyIds.size} keys purged`);
        setSelectedKeyIds(new Set());
        fetchData();
      }
    } catch (err) {
      toast.error("Bulk deletion failed");
    }
  };

  const handlePurgeAll = async () => {
    if (!confirm("CRITICAL: Wipe your entire API key vault? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/keys?all=true", { method: "DELETE" });
      if (res.ok) {
        toast.success("Vault wiped successfully");
        setSelectedKeyIds(new Set());
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to wipe vault");
    }
  };

  const toggleSelectAll = () => {
    if (selectedKeyIds.size === keys.length) {
      setSelectedKeyIds(new Set());
    } else {
      setSelectedKeyIds(new Set(keys.map((k) => k.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedKeyIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedKeyIds(next);
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the key "${name}"?`)) return;

    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Key "${name}" deleted`);
        fetchData();
      } else {
        toast.error("Failed to delete key");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the key");
    }
  };

  // Pagination Logic
  const paginatedProviders = providers.slice((providerPage - 1) * ITEMS_PER_PAGE, providerPage * ITEMS_PER_PAGE);
  const totalProviderPages = Math.ceil(providers.length / ITEMS_PER_PAGE);

  const paginatedKeys = keys.slice((keyPage - 1) * ITEMS_PER_PAGE, keyPage * ITEMS_PER_PAGE);
  const totalKeyPages = Math.ceil(keys.length / ITEMS_PER_PAGE);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl bg-card border-border/40 max-h-[90dvh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/10">
          <DialogTitle className="text-xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            System Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your AI provider collections and encrypted API keys.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          {/* Section: Add New Key */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Register New Key
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border/40 bg-zinc-500/5 items-end">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Provider
                </label>
                <select
                  className="w-full h-9 bg-background border border-border/40 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  value={selectedProviderId}
                >
                  <option disabled value="">
                    Select AI Provider...
                  </option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Display Name
                </label>
                <Input
                  className="h-9"
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. My Personal OpenAI"
                  value={keyName}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  API Key
                </label>
                <div className="flex gap-2">
                  <Input
                    className="h-9 grow"
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    placeholder="sk-..."
                    type="password"
                    value={apiKeyValue}
                  />
                  <Button
                    className="h-9 px-6 font-semibold"
                    disabled={
                      isSaving || !keyName || !apiKeyValue || !selectedProviderId
                    }
                    onClick={handleRegisterKey}
                  >
                    {isSaving ? "Adding..." : "Add Key"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Provider Ecosystem */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Provider Ecosystem
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  className="h-6 w-6 p-0" 
                  disabled={providerPage === 1} 
                  onClick={() => setProviderPage(p => p - 1)}
                  variant="outline"
                >
                  &lt;
                </Button>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {providerPage} / {Math.max(1, totalProviderPages)}
                </span>
                <Button 
                  className="h-6 w-6 p-0" 
                  disabled={providerPage === totalProviderPages || totalProviderPages === 0} 
                  onClick={() => setProviderPage(p => p + 1)}
                  variant="outline"
                >
                  &gt;
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {isLoading ? (
                <div className="py-8 flex justify-center"><LoaderIcon className="animate-spin" size={16} /></div>
              ) : paginatedProviders.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">No providers found</div>
              ) : (
                paginatedProviders.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-background/30">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{p.base_url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${p.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {p.is_active ? "Verified" : "Offline"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section: Active Connections */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Connections
              </h3>
              <div className="flex items-center gap-4">
                {keys.length > 0 && (
                  <div className="flex items-center gap-2 pr-4 border-r border-border/20">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[9px] font-black tracking-tight flex items-center gap-1.5 hover:bg-zinc-500/10"
                      onClick={toggleSelectAll}
                    >
                      <div className={cn("size-3 rounded border border-foreground/30 flex items-center justify-center", selectedKeyIds.size === keys.length && "bg-primary border-primary")}>
                        {selectedKeyIds.size === keys.length && <div className="size-1 bg-white rounded-full" />}
                      </div>
                      {selectedKeyIds.size === keys.length ? "DESELECT ALL" : "SELECT ALL"}
                    </Button>
                    
                    {selectedKeyIds.size > 0 ? (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-7 text-[10px] font-black px-3"
                        onClick={handleBulkDelete}
                      >
                        DELETE ({selectedKeyIds.size})
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] font-black text-muted-foreground hover:text-red-400"
                        onClick={handlePurgeAll}
                      >
                        PURGE ALL
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button 
                    className="h-6 w-6 p-0" 
                    disabled={keyPage === 1} 
                    onClick={() => setKeyPage(p => p - 1)}
                    variant="outline"
                  >
                    &lt;
                  </Button>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {keyPage} / {Math.max(1, totalKeyPages)}
                  </span>
                  <Button 
                    className="h-6 w-6 p-0" 
                    disabled={keyPage === totalKeyPages || totalKeyPages === 0} 
                    onClick={() => setKeyPage(p => p + 1)}
                    variant="outline"
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
                <LoaderIcon className="animate-spin" size={16}/>
                <span className="text-xs font-medium">Fetching secure vault...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="py-12 rounded-xl border border-dashed border-border/60 flex flex-col items-center justify-center text-center px-6">
                <p className="text-sm text-muted-foreground max-w-xs">
                  No API keys registered yet. Add one above to start chatting with advanced models.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedKeys.map((key) => (
                  <div
                    className={cn(
                      "group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all gap-4 relative overflow-hidden",
                      selectedKeyIds.has(key.id) 
                        ? "border-primary/40 bg-primary/5 shadow-inner" 
                        : "border-border/30 bg-background/50 hover:bg-zinc-500/5 shadow-sm"
                    )}
                    key={key.id}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={() => toggleSelectOne(key.id)}
                        className={cn(
                          "size-4 rounded border transition-all flex items-center justify-center",
                          selectedKeyIds.has(key.id) 
                            ? "bg-primary border-primary text-white" 
                            : "border-border/60 hover:border-primary/60 bg-white/5"
                        )}
                      >
                        {selectedKeyIds.has(key.id) && <div className="size-1.5 bg-white rounded-full" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{key.name}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-500/10 text-zinc-500 text-[10px] font-bold uppercase">
                            {key.provider?.name || "unknown"}
                          </span>
                          {!key.is_active && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase">
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1 opacity-70">
                            Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            }) : "Never"}
                          </span>
                          {key.last_error && <span className="text-red-400 font-bold truncate max-w-[200px]">— {key.last_error}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${
                        key.is_active 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>
                        {key.is_active ? "ACTIVE" : "STANDBY"}
                      </div>
                      <Button
                        className="h-8 px-3 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        size="sm"
                        variant="ghost"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        <div className="p-4 border-t border-border/10 bg-zinc-500/5 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
             Your credentials are securely encrypted before storage.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
