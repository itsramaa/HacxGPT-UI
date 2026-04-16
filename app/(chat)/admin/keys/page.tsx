"use client";

import {
  KeyIcon,
  LoaderIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "@/components/chat/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PublicKeysAdminPage() {
  const {
    data: keys,
    mutate: mutateKeys,
    isLoading,
  } = useSWR("/api/admin/keys", fetcher);
  const { data: providers } = useSWR("/api/admin/providers", fetcher);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    api_key: "",
    provider_id: "",
  });

  const handleAddKey = async () => {
    if (!formData.name || !formData.api_key || !formData.provider_id) {
      toast({
        type: "error",
        description: "All fields are required for cluster key registration.",
      });
      return;
    }

    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { throw new Error("Failed to register system-wide key."); }
      toast({ type: "success", description: "Public key linked to cluster." });
      mutateKeys();
      setIsAddOpen(false);
      setFormData({ name: "", api_key: "", provider_id: "" });
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this system key? Demo mode for this provider may fail."
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
      if (!res.ok) { throw new Error("Failed to revoke key."); }
      toast({ type: "success", description: "System key revoked." });
      mutateKeys();
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  const [isRevalidating, setIsRevalidating] = useState(false);

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await fetch("/api/admin/revalidate-keys", { method: "POST" });
      if (!res.ok) { throw new Error("Failed to trigger revalidation."); }
      toast({
        type: "success",
        description: "Key re-validation protocol initiated in the background.",
      });
      // Optionally mutate keys to see updates if they happen fast, but usually it takes time
      setTimeout(mutateKeys, 5000);
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    } finally {
      setIsRevalidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  const providerList =
    (Array.isArray(providers) ? providers : providers?.items) || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheckIcon className="size-5 text-emerald-500" /> System Neural
          Vault
        </h2>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
            disabled={isRevalidating}
            onClick={handleRevalidate}
            size="sm"
            variant="outline"
          >
            {isRevalidating ? (
              <LoaderIcon className="size-3 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-3" />
            )}
            REVALIDATE_KEYS
          </Button>
          <Button
            className="rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
            onClick={() => setIsAddOpen(true)}
            size="sm"
          >
            <PlusIcon className="size-3" /> LINK_SYSTEM_KEY
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keys?.map((key: any) => (
          <div
            className="bg-card/30 border border-border/40 rounded-3xl p-6 flex flex-col gap-4 shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden"
            key={key.id}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <KeyIcon className="size-16" />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <KeyIcon className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">
                    {key.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                    {key.provider?.name}
                  </p>
                </div>
              </div>
              <button
                className="p-2 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteKey(key.id)}
              >
                <TrashIcon className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 font-mono text-[10px] text-muted-foreground bg-muted/10 p-3 rounded-2xl border border-border/10">
              <div className="flex justify-between items-center">
                <span>STATUS:</span>
                <span
                  className={`font-bold ${key.is_active ? "text-emerald-500" : "text-red-500"}`}
                >
                  {key.is_active ? "READY" : "SUSPENDED"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border/5">
                <span>USED_AT:</span>
                <span className="text-foreground/80">
                  {key.last_used_at
                    ? new Date(key.last_used_at).toLocaleTimeString()
                    : "NEVER"}
                </span>
              </div>
            </div>

            {key.last_error && (
              <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-medium italic">
                ERROR: {key.last_error}
              </div>
            )}

            {!key.last_error && (
              <div className="px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                  Security_Level: PUBLIC_DEMO
                </span>
                <RefreshCwIcon className="size-3 opacity-20" />
              </div>
            )}
          </div>
        ))}
      </div>

      {keys?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-border/40 rounded-3xl bg-muted/5 text-muted-foreground gap-4">
          <KeyIcon className="size-10 opacity-20" />
          <p className="text-sm italic">
            No system keys discovered in the neural vault.
          </p>
        </div>
      )}

      {/* Link Key Dialog */}
      <Dialog onOpenChange={setIsAddOpen} open={isAddOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyIcon className="size-4 text-emerald-500" /> Link Cluster
              Secret
            </DialogTitle>
            <DialogDescription>
              Configure a system-wide API key for demo access. This key will be
              used by unauthenticated users.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Provider Node
              </label>
              <Select
                onValueChange={(v) =>
                  setFormData({ ...formData, provider_id: v })
                }
              >
                <SelectTrigger className="bg-muted/20 border-border/40 w-full capitalize">
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {providerList.map((p: any) => (
                    <SelectItem className="capitalize" key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Internal Name
              </label>
              <Input
                className="bg-muted/20 border-border/40"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Master Demo Key"
                value={formData.name}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Secret API Key
              </label>
              <Input
                className="bg-muted/20 border-border/40 font-mono"
                onChange={(e) =>
                  setFormData({ ...formData, api_key: e.target.value })
                }
                placeholder="..."
                type="password"
                value={formData.api_key}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAddOpen(false)} variant="outline">
              SECURE_ABORT
            </Button>
            <Button onClick={handleAddKey}>INITIALIZE_SECRET</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
