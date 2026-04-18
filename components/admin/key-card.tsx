import { KeyIcon, RefreshCwIcon, TrashIcon } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  provider: { name: string };
  is_active: boolean;
  last_used_at?: string;
  last_error?: string;
}

export function KeyCard({
  apiKey,
  onDelete,
}: {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-card/30 border border-border/40 rounded-3xl p-6 flex flex-col gap-4 shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
        <KeyIcon className="size-16" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <KeyIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">{apiKey.name}</h3>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              {apiKey.provider?.name}
            </p>
          </div>
        </div>
        <button
          className="p-2 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
          onClick={() => onDelete(apiKey.id)}
        >
          <TrashIcon className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 font-mono text-[10px] text-muted-foreground bg-muted/10 p-3 rounded-2xl border border-border/10">
        <div className="flex justify-between items-center">
          <span>STATUS:</span>
          <span
            className={`font-bold ${apiKey.is_active ? "text-emerald-500" : "text-red-500"}`}
          >
            {apiKey.is_active ? "READY" : "SUSPENDED"}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-border/5">
          <span>USED_AT:</span>
          <span className="text-foreground/80">
            {apiKey.last_used_at
              ? new Date(apiKey.last_used_at).toLocaleTimeString()
              : "NEVER"}
          </span>
        </div>
      </div>

      {apiKey.last_error && (
        <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-medium italic">
          ERROR: {apiKey.last_error}
        </div>
      )}

      {!apiKey.last_error && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
            Security_Level: PUBLIC_DEMO
          </span>
          <RefreshCwIcon className="size-3 opacity-20" />
        </div>
      )}
    </div>
  );
}
