"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, cloneElement } from "react";
import useSWR from "swr";
import { 
  UsersIcon, 
  SettingsIcon, 
  ShieldCheckIcon, 
  CoinsIcon, 
  BarChart3Icon,
  SearchIcon,
  BanIcon,
  UnlockIcon,
  UserPlusIcon,
  RefreshCwIcon
} from "lucide-react";
import { toast } from "@/components/chat/toast";
import { LoaderIcon } from "@/components/chat/icons";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Unauthorized or not found");
  return res.json();
});

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users, mutate: mutateUsers, isLoading: isLoadingUsers } = useSWR(
    status === "authenticated" ? "/api/admin/users" : null,
    fetcher
  );

  const { data: stats, isLoading: isLoadingStats } = useSWR(
    status === "authenticated" ? "/api/admin/stats" : null,
    fetcher
  );

  useEffect(() => {
    if (status === "unauthenticated" || (session?.user && (session.user as any).role !== "admin")) {
        // Double check via me API if role is not in JWT yet
        fetch("/api/auth/me")
          .then(res => res.json())
          .then(data => {
            if (data.role !== "admin") router.push("/");
          })
          .catch(() => router.push("/"));
    }
  }, [status, session, router]);

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status?is_active=${isActive}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ type: "success", description: `User ${isActive ? "unbanned" : "banned"} successfully.` });
      mutateUsers();
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  const updateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Are you sure you want to change user role to ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/role?role=${newRole}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast({ type: "success", description: `User promoted to ${newRole} successfully.` });
      mutateUsers();
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  const updateUserTokens = async (userId: string) => {
    const amountStr = prompt("Enter new usage tokens amount:");
    if (amountStr === null) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount)) return toast({ type: "error", description: "Invalid amount" });

    try {
      const res = await fetch(`/api/admin/users/${userId}/tokens?amount=${amount}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to update tokens");
      toast({ type: "success", description: "Tokens updated successfully." });
      mutateUsers();
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    }
  };

  const filteredUsers = users?.filter((u: any) => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || isLoadingUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <div className="animate-spin"><LoaderIcon /></div>
        <p className="text-sm font-mono tracking-tighter">INITIALIZING ADMIN CONTROL INTERFACE...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* Header & Stats */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-6" />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Mainframe Administration</h1>
                <p className="text-muted-foreground text-sm">System metrics and user node management</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <StatCard icon={<UsersIcon />} label="Active Nodes" value={stats?.total_users ?? 0} color="primary" />
           <StatCard icon={<BarChart3Icon />} label="Total sessions" value={stats?.total_sessions ?? 0} color="emerald" />
           <StatCard icon={<SettingsIcon />} label="System Load" value="OPTIMAL" color="orange" />
        </div>

        {/* User Management */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <UsersIcon className="size-4" /> Node Registry
                </h2>
                <div className="relative max-w-sm w-full">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search nodes by alias or email..." 
                      className="w-full bg-muted/50 border border-border/40 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="border border-border/40 rounded-xl overflow-hidden bg-card/30">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-4 py-3 border-b border-border/20">Identity</th>
                            <th className="px-4 py-3 border-b border-border/20">Role</th>
                            <th className="px-4 py-3 border-b border-border/20">Status</th>
                            <th className="px-4 py-3 border-b border-border/20">Usage Token</th>
                            <th className="px-4 py-3 border-b border-border/20 text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                        {filteredUsers?.map((u: any) => (
                            <tr key={u.id} className="hover:bg-muted/10 transition-colors group">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{u.username}</span>
                                        <span className="text-[11px] text-muted-foreground">{u.email}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                        <span className={u.is_active ? 'text-emerald-400' : 'text-red-400'}>
                                            {u.is_active ? 'ACTIVE' : 'BANNED'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <button 
                                      onClick={() => updateUserTokens(u.id)}
                                      className="flex items-center gap-1.5 font-mono text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <RefreshCwIcon className="size-3" />
                                        {u.total_usage?.toLocaleString()}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                                          onClick={() => updateUserRole(u.id, u.role)}
                                          className="p-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/10"
                                        >
                                            <UserPlusIcon className="size-4" />
                                        </button>
                                        <button 
                                          title={u.is_active ? "Ban User" : "Unban User"}
                                          onClick={() => updateUserStatus(u.id, !u.is_active)}
                                          className={`p-1.5 rounded-md border ${u.is_active ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
                                        >
                                            {u.is_active ? <BanIcon className="size-4" /> : <UnlockIcon className="size-4" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    const colorMap: any = {
        primary: "bg-primary/10 text-primary border-primary/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    }
    return (
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${colorMap[color] || colorMap.primary}`}>
            <div className="p-2 rounded-lg bg-background/50">
                {cloneElement(icon, { className: "size-5" })}
            </div>
            <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">{label}</span>
                <span className="text-xl font-bold font-mono">{value}</span>
            </div>
        </div>
    )
}

