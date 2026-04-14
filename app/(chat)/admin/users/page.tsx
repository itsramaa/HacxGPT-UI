"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import {
  UsersIcon,
  SearchIcon,
  BanIcon,
  UnlockIcon,
  UserPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  ZapIcon
} from "lucide-react";
import { toast } from "@/components/chat/toast";
import { LoaderIcon } from "@/components/chat/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const size = 10;

  const { data, mutate: mutateUsers, isLoading } = useSWR(
    `/api/admin/users?page=${page}&size=${size}`,
    fetcher
  );

  const users = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / size);

  // Action States
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [newTokenAmount, setNewTokenAmount] = useState("");
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [pendingRoleData, setPendingRoleData] = useState<{ id: string, newRole: string } | null>(null);

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status?is_active=${isActive}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ type: "success", description: `Node identity ${isActive ? "unlocked" : "locked"} in cluster.` });
      mutateUsers();
    } catch (error: any) { toast({ type: "error", description: error.message }); }
  };

  const initiateRoleUpdate = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setPendingRoleData({ id: userId, newRole });
    setConfirmRoleOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!pendingRoleData) return;
    try {
      const res = await fetch(`/api/admin/users/${pendingRoleData.id}/role?role=${pendingRoleData.newRole}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to update role");
      toast({ type: "success", description: `Node privilege ${pendingRoleData.newRole === 'admin' ? 'escalated' : 'de-escalated'}.` });
      mutateUsers();
    } catch (error: any) { toast({ type: "error", description: error.message }); }
    finally { setConfirmRoleOpen(false); setPendingRoleData(null); }
  };

  const openTokenDialog = (userId: string, currentAmount: number) => {
    setTargetUserId(userId);
    setNewTokenAmount(currentAmount.toString());
    setTokenDialogOpen(true);
  };

  const handleTokenUpdate = async () => {
    if (!targetUserId) return;
    const amount = parseInt(newTokenAmount);
    if (isNaN(amount)) {
      toast({ type: "error", description: "Invalid numerical sequence." });
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/tokens?amount=${amount}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Synchronization failure.");
      toast({ type: "success", description: "Token reservoir updated." });
      mutateUsers();
      setTokenDialogOpen(false);
    } catch (error: any) { toast({ type: "error", description: error.message }); }
  };

  const { data: session } = useSession();

  if (isLoading && !data) return <div className="flex justify-center p-20"><LoaderIcon className="animate-spin text-primary" /></div>;

  const filteredUsers = users?.filter((u: any) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const isSelf = u.id === session?.user?.id;
    return matchesSearch && !isSelf;
  });

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UsersIcon className="size-5" /> Node Registry
          </h2>
          <div className="relative max-w-sm w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full bg-muted/40 border border-border/40 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

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
              {filteredUsers?.map((u: any) => (
                <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground/90">{u.username}</span>
                      <span className="text-[10px] text-muted-foreground font-mono opacity-60 italic">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[11px] font-bold text-muted-foreground tracking-tight">
                    {u.full_name || <span className="opacity-20">NOT_DISCLOSED</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black tracking-widest border",
                      u.role === 'admin'
                        ? "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      <div className={`size-1 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {u.is_active ? 'ACTIVE' : 'BANNED'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[10px] text-muted-foreground font-mono italic">
                    {new Date(u.created_at).toISOString().split('T')[0]}
                  </td>
                  <td className="px-5 py-4 font-mono text-muted-foreground/80 text-xs">
                    <button onClick={() => openTokenDialog(u.id, u.total_usage)} className="hover:text-primary transition-colors border-b border-dotted border-muted-foreground/30">
                      0x{u.total_usage.toString(16).toUpperCase()}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => initiateRoleUpdate(u.id, u.role)} className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all">
                        <UserPlusIcon className="size-3.5" />
                      </button>
                      <button onClick={() => updateUserStatus(u.id, !u.is_active)} className={`p-1.5 rounded-lg border transition-all ${u.is_active ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                        {u.is_active ? <BanIcon className="size-3.5" /> : <UnlockIcon className="size-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-5 py-4 bg-muted/20 border-t border-border/10">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
              Page {page} of {totalPages || 1} <span className="opacity-40">({total} total nodes)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Token Adjustment Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ZapIcon className="size-4 text-primary" /> Token Reservoir Update
            </DialogTitle>
            <DialogDescription>
              Modify the synthetic token usage for target node.
              Value must be an unsigned integer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="tokens"
              type="number"
              value={newTokenAmount}
              onChange={(e) => setNewTokenAmount(e.target.value)}
              className="col-span-3 bg-muted/20 border-border/40"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>CANCEL</Button>
            <Button onClick={handleTokenUpdate}>APPLY_CHANGES</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Confirmation Alert */}
      <AlertDialog open={confirmRoleOpen} onOpenChange={setConfirmRoleOpen}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Node Privilege Escalation?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm role transition to <span className="text-primary font-bold uppercase tracking-widest">{pendingRoleData?.newRole}</span>.
              This action modifies cluster-wide access permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/20 border-border/40">SECURE_ABORT</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleUpdate} className="bg-primary text-white" variant="destructive">
              CONFIRM_SUDO_ACCESS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
