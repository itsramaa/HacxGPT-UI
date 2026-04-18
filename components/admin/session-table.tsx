import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

export function SessionTable({ sessions }: { sessions: any[] }) {
  return (
    <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/30 shadow-2xl backdrop-blur-md">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
          <tr>
            <th className="px-6 py-4">Context_Registry</th>
            <th className="px-6 py-4">Owner_Node</th>
            <th className="px-6 py-4">Operational_Protocol</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-center">Sync_Timeline</th>
            <th className="px-6 py-4 text-right">Access</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {sessions?.map((s: any) => (
            <tr className="hover:bg-primary/5 transition-colors group" key={s.id}>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-foreground/90 truncate max-w-[200px]">
                    {s.title}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono opacity-50 uppercase tracking-tighter shrink-0">
                    {s.id}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-[10px] font-mono text-muted-foreground/80 border border-border/20 px-2 py-0.5 rounded bg-muted/5">
                  NODE_{s.user_id.toString().slice(0, 8)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black font-mono uppercase text-primary">
                    {s.provider?.name || "EXTERNAL"}_{s.model_name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black border ${s.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}`}
                >
                  <div
                    className={`size-1 rounded-full ${s.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`}
                  />
                  {s.is_active ? "LIVE" : "IDLE"}
                </div>
              </td>
              <td className="px-6 py-4 text-[10px] text-muted-foreground font-mono text-center">
                <div className="flex flex-col">
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  <span className="opacity-40 italic text-[9px]">
                    Last:{" "}
                    {new Date(s.updated_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <Link className="flex justify-center" href={`/admin/sessions/${s.id}`}>
                  <ExternalLinkIcon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
