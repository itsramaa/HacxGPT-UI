"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CpuIcon,
  GlobeIcon,
  PlusIcon,
  ServerIcon,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { LoaderIcon } from "@/components/chat/icons";
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProvidersAdminPage() {
  const [page, setPage] = useState(1);
  const size = 4;
  const {
    data,
    mutate: mutateProviders,
    isLoading,
  } = useSWR(`/api/admin/providers?page=${page}&size=${size}`, fetcher);

  const providers = (Array.isArray(data) ? data : data?.items) || [];
  const total = data?.total || (Array.isArray(data) ? data.length : 0);
  const totalPages = Math.ceil(total / size);

  // Modal State
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [targetProviderId, setTargetProviderId] = useState<string | null>(null);
  const [newModelData, setNewModelData] = useState({ name: "", alias: "" });

  const addProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name");
    const base_url = formData.get("base_url");
    const default_model = formData.get("default_model");

    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, base_url, default_model }),
      });
      if (!res.ok) { throw new Error("Failed to add provider"); }
      toast({ type: "success", description: "Provider added to registry." });
      mutateProviders();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  const openModelDialog = (providerId: string) => {
    setTargetProviderId(providerId);
    setNewModelData({ name: "", alias: "" });
    setModelDialogOpen(true);
  };

  const handleAddModel = async () => {
    if (!targetProviderId || !newModelData.name) {
      toast({ type: "error", description: "Model name is required." });
      return;
    }

    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: targetProviderId,
          name: newModelData.name,
          alias: newModelData.alias || newModelData.name,
        }),
      });
      if (!res.ok) {
        throw new Error("Synchronization failure during neural model linking.");
      }
      toast({
        type: "success",
        description: `Model [${newModelData.name}] mapped successfully.`,
      });
      mutateProviders();
      setModelDialogOpen(false);
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ServerIcon className="size-5 text-orange-500" /> LLM Infrastructure
          </h2>
          <form
            className="flex flex-wrap gap-2 bg-muted/20 p-2 rounded-2xl border border-border/40 w-full md:w-auto"
            onSubmit={addProvider}
          >
            <input
              className="bg-background/50 border border-border/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              name="name"
              placeholder="Provider Name"
              required
            />
            <input
              className="bg-background/50 border border-border/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              name="base_url"
              placeholder="API Base URL"
              required
            />
            <input
              className="bg-background/50 border border-border/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              name="default_model"
              placeholder="Default Model"
              required
            />
            <button
              className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
              type="submit"
            >
              <PlusIcon className="size-3" /> REGISTER_NODE
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers?.map((p: any) => (
            <div
              className="bg-card/30 border border-border/40 rounded-3xl p-6 flex flex-col gap-4 shadow-xl hover:shadow-orange-500/5 transition-all group"
              key={p.id}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <GlobeIcon className="size-5" />
                  </div>
                  <h3 className="font-bold text-lg tracking-tight capitalize">
                    {p.name}
                  </h3>
                </div>
                <button
                  className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all"
                  onClick={() => openModelDialog(p.id)}
                >
                  <PlusIcon className="size-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-[10px] text-muted-foreground bg-muted/10 p-3 rounded-2xl border border-border/10">
                <div className="flex justify-between items-center">
                  <span>BASE_URL:</span>
                  <span className="text-foreground/80 truncate ml-2">
                    {p.base_url}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/5">
                  <span>PRIMARY_MODEL:</span>
                  <span className="text-primary font-bold ml-2 italic">
                    {p.default_model}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-background/40 border border-border/20">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-1.5 rounded-full ${p.has_key ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {p.has_key ? "Key_Linked" : "No_Secret_Key"}
                  </span>
                </div>
                <span className="text-[9px] font-medium text-muted-foreground italic">
                  NODE_{p.id.toString().slice(0, 8)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {p.models?.map((m: any) => (
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${m.is_public ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted/30 border-border/20 text-muted-foreground"}`}
                    key={m.id}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/models/${m.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ is_public: !m.is_public }),
                        });
                        if (!res.ok) {
                          throw new Error("Failed to update model status.");
                        }
                        mutateProviders();
                        toast({
                          type: "success",
                          description: `Model ${m.name} is now ${m.is_public ? "PRIVATE" : "PUBLIC"}.`,
                        });
                      } catch (err: any) {
                        toast({ type: "error", description: err.message });
                      }
                    }}
                    title={`Backend ID: ${m.name}`}
                  >
                    <CpuIcon
                      className={`size-3 ${m.is_public ? "text-primary" : "text-muted-foreground"}`}
                    />
                    {m.alias || m.name}
                    <div
                      className={`size-1.5 rounded-full ${m.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground opacity-30 font-bold font-mono"}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/40">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-80">
            PAGE {page} / {totalPages || 1}{" "}
            <span className="mx-2 opacity-30">|</span> TOTAL_PROVIDERS: {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-xl border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-20 disabled:pointer-events-none"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              className="p-2 rounded-xl border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-20 disabled:pointer-events-none"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Model Registration Dialog */}
      <Dialog onOpenChange={setModelDialogOpen} open={modelDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CpuIcon className="size-4 text-primary" /> Link Neural Model
            </DialogTitle>
            <DialogDescription>
              Register a new model endpoint for this provider. Alias is optional
              for UI display.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Model ID
              </label>
              <Input
                className="bg-muted/20 border-border/40"
                onChange={(e) =>
                  setNewModelData({ ...newModelData, name: e.target.value })
                }
                placeholder="e.g. gpt-4o"
                value={newModelData.name}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                UI Alias
              </label>
              <Input
                className="bg-muted/20 border-border/40"
                onChange={(e) =>
                  setNewModelData({ ...newModelData, alias: e.target.value })
                }
                placeholder="e.g. GPT-4 Omni"
                value={newModelData.alias}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setModelDialogOpen(false)} variant="outline">
              CANCEL
            </Button>
            <Button onClick={handleAddModel}>LINK_NEURAL_UNIT</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
