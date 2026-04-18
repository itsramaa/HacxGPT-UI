import {
  BanIcon,
  UnlockIcon,
  UserPlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UserTable({
  users,
  onOpenTokenDialog,
  onInitiateRoleUpdate,
  onUpdateStatus,
}: {
  users: any[];
  onOpenTokenDialog: (id: string, usage: number) => void;
  onInitiateRoleUpdate: (id: string, role: string) => void;
  onUpdateStatus: (id: string, status: boolean) => void;
}) {
  return (
    <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/30 shadow-xl">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
          <tr>
            <th className="px-5 py-4">Node_Identity</th>
            <th className="px-5 py-4">Legal_Name</th>
            <th className="px-5 py-4">Access_Level</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Protocol_Start</th>
            <th className="px-5 py-4 font-mono text-primary/70">Usage_HEX</th>
            <th className="px-5 py-4 text-right">Operations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {users?.map((u: any) => (
            <tr className="hover:bg-primary/5 transition-colors group" key={u.id}>
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-foreground/90">{u.username}</span>
                  <span className="text-[10px] text-muted-foreground font-mono opacity-60 italic">
                    {u.email}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 text-[11px] font-bold text-muted-foreground tracking-tight">
                {u.full_name || <span className="opacity-20">NOT_DISCLOSED</span>}
              </td>
              <td className="px-5 py-4">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black tracking-widest border",
                    u.role === "admin"
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {u.role.toUpperCase()}
                </span>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                >
                  <div className={`size-1 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                  {u.is_active ? "ACTIVE" : "BANNED"}
                </span>
              </td>
              <td className="px-5 py-4 text-[10px] text-muted-foreground font-mono italic">
                {new Date(u.created_at).toISOString().split("T")[0]}
              </td>
              <td className="px-5 py-4 font-mono text-muted-foreground/80 text-xs">
                <button
                  className="hover:text-primary transition-colors border-b border-dotted border-muted-foreground/30"
                  onClick={() => onOpenTokenDialog(u.id, u.total_usage)}
                >
                  0x{u.total_usage.toString(16).toUpperCase()}
                </button>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all"
                    onClick={() => onInitiateRoleUpdate(u.id, u.role)}
                  >
                    <UserPlusIcon className="size-3.5" />
                  </button>
                  <button
                    className={`p-1.5 rounded-lg border transition-all ${u.is_active ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"}`}
                    onClick={() => onUpdateStatus(u.id, !u.is_active)}
                  >
                    {u.is_active ? <BanIcon className="size-3.5" /> : <UnlockIcon className="size-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
