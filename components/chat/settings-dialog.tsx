"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoaderIcon } from "./icons";

type Provider = {
  provider: string;
  base_url: string;
  has_api_key: boolean;
};

type ApiKey = {
  provider_name: string;
  is_active: boolean;
  label: string | null;
  last_used_at: string | null;
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
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<Record<string, string>>({});

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

  const handleSaveKey = async (provider: string) => {
    const api_key = newKey[provider];
    if (!api_key) return;

    setIsSaving(provider);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_name: provider, api_key }),
      });

      if (res.ok) {
        toast.success(`Key for ${provider} updated successfully`);
        setNewKey((prev) => ({ ...prev, [provider]: "" }));
        fetchData();
      } else {
        toast.error(`Failed to update key for ${provider}`);
      }
    } catch (err) {
      toast.error("An error occurred while saving the key");
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete the key for ${provider}?`)) return;

    setIsSaving(provider);
    try {
      const res = await fetch(`/api/keys?provider=${provider}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Key for ${provider} deleted`);
        fetchData();
      } else {
        toast.error(`Failed to delete key for ${provider}`);
      }
    } catch (err) {
      toast.error("An error occurred while deleting the key");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-2xl border-border/40 max-h-[80dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">System Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your AI providers and API keys. Keys are stored encrypted on our server.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 gap-3 text-muted-foreground">
              <div className="animate-spin"><LoaderIcon /></div>
              <span>Loading configurations...</span>
            </div>
          ) : (
            <div className="grid gap-6">
              {providers.map((p) => {
                const existingKey = keys.find((k) => k.provider_name === p.provider);
                return (
                  <div key={p.provider} className="p-4 rounded-xl border border-border/40 bg-background/50 space-y-3 transition-colors hover:border-border/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize text-sm">{p.provider}</span>
                        {p.has_api_key && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">{p.base_url}</span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder={p.has_api_key ? "••••••••••••••••" : "Paste your API key here..."}
                        value={newKey[p.provider] || ""}
                        onChange={(e) => setNewKey({ ...newKey, [p.provider]: e.target.value })}
                        className="h-9 bg-background/50 border-border/40"
                      />
                      <Button
                        size="sm"
                        disabled={!newKey[p.provider] || isSaving === p.provider}
                        onClick={() => handleSaveKey(p.provider)}
                        className="h-9 px-4 shrink-0"
                      >
                        {isSaving === p.provider ? "Saving..." : p.has_api_key ? "Rotate" : "Save"}
                      </Button>
                      {p.has_api_key && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSaving === p.provider}
                          onClick={() => handleDeleteKey(p.provider)}
                          className="h-9 px-3 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
