"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/chat/toast";
import { useSWRConfig } from "swr";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CpuIcon, GlobeIcon, KeyIcon, Settings2Icon, Trash2Icon, ZapIcon } from "lucide-react";

type APIKey = {
  provider: string;
  key_preview: string;
  is_active: boolean;
};

type Provider = {
  id: string;
  name: string;
};

type Model = {
  id: string;
  name: string;
  provider: string;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const { data: keys, isLoading: keysLoading } = useSWR<APIKey[]>("/api/keys", fetcher);
  const { data: providers } = useSWR<Provider[]>("/api/providers", fetcher);
  const { data: modelData } = useSWR("/api/models", fetcher);

  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState("");

  const models: Model[] = modelData?.models || [];
  const activeKeys = keys || [];

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !apiKey) return;

    toast({ type: "success", description: `API Key for ${selectedProvider.toUpperCase()} has been securely stored.` });
    setApiKey("");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background/50">
      <div className="container mx-auto max-w-6xl py-10 px-6 space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">System Preferences</h1>
            <p className="text-muted-foreground text-lg">Configure AI providers and global application behavior.</p>
          </div>
          <div className="hidden sm:flex size-14 rounded-full bg-primary/10 items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
            <Settings2Icon size={28} />
          </div>
        </div>

        <div className="grid gap-12">
          {/* Section: API Access */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <KeyIcon className="text-primary size-5" />
              <h2 className="text-2xl font-bold tracking-tight">API Access Control</h2>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
              <Card className="border-border/60 shadow-lg h-fit group transition-all hover:shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Add Credentials</CardTitle>
                  <CardDescription>Link your own API keys to enable premium models.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveKey} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="provider" className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Provider</Label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger id="provider" className="bg-background/80 border-border/30">
                          <SelectValue placeholder="Select Platform" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-xl border-border/40">
                          {providers?.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="focus:bg-primary/10 focus:text-primary">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">API Secret</Label>
                      <Input 
                        id="key" 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        placeholder="••••••••••••••••"
                        className="bg-background/80 border-border/30"
                      />
                    </div>
                    <Button type="submit" className="w-full shadow-md shadow-primary/20">Authorize Provider</Button>
                  </form>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 px-1">Established Connections</h3>
                {activeKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/40 bg-card/20 text-center">
                    <GlobeIcon size={32} className="text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground italic">No active connections found. Connect a provider to begin.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {activeKeys.map((k) => (
                      <div key={k.provider} className="group flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/60">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <ZapIcon size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold capitalize block">{k.provider}</span>
                            <code className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded border border-border/20">{k.key_preview}</code>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="hidden sm:block text-[10px] font-bold text-green-500 uppercase tracking-widest px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">Operational</div>
                           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <Trash2Icon size={16} />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section: Model Landscape */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <CpuIcon className="text-primary size-5" />
              <h2 className="text-2xl font-bold tracking-tight">Model Landscape</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {models.map((m) => {
                const isReady = activeKeys.some(k => k.provider === m.provider);
                return (
                  <div key={m.id} className="group relative rounded-2xl border border-border/40 p-5 transition-all bg-card/20 hover:bg-card/40 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                       <CpuIcon size={48} />
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary group-hover:text-primary/80 transition-colors">{m.provider}</span>
                    </div>
                    
                    <h4 className="font-bold text-base mb-1">{m.name}</h4>
                    <p className="text-[10px] text-muted-foreground/60 font-mono truncate mb-6">{m.id}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/20">
                       <div className="flex items-center gap-1.5">
                          <div className={`size-1.5 rounded-full ${isReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground/30'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${isReady ? 'text-green-500/80' : 'text-muted-foreground/60'}`}>
                             {isReady ? 'Authorized' : 'Locked'}
                          </span>
                       </div>
                       <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase px-2 hover:bg-primary/10 hover:text-primary">Info</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
