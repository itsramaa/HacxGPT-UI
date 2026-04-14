"use client";

import {
  ActivityIcon,
  CpuIcon,
  GlobeIcon,
  ShieldAlertIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "@/components/chat/toast";
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
import { reportAuditLog } from "@/lib/audit";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
  useEffect(() => {
    reportAuditLog(
      "SECURITY",
      "MACHINE",
      "Administrative session established. Remote node connected to Mainframe."
    );
  }, []);

  const { data: stats, isLoading: statsLoading } = useSWR(
    "/api/admin/stats",
    fetcher,
    { refreshInterval: 5000 }
  );
  const { data: logs, isLoading: logsLoading } = useSWR(
    "/api/admin/logs",
    fetcher,
    { refreshInterval: 10_000 }
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      if (!res.ok) { throw new Error("Sync failed"); }
      toast({
        type: "success",
        description: "Global sync protocol completed.",
      });
    } catch (err: any) {
      toast({ type: "error", description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 animate-in fade-in duration-700">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-1000 group-hover:scale-110">
              <ShieldAlertIcon className="size-64" />
            </div>
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  Quantum_Link: Operational
                </div>
                <div className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                  AES-256 Enabled
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-5xl font-black tracking-tighter leading-tight">
                  Command <span className="text-primary italic">Mainframe</span>
                </h2>
                <p className="text-muted-foreground max-w-lg text-base leading-relaxed opacity-80 font-medium">
                  Centralized orchestration hub for the HacxGPT ecosystem.
                  Real-time control of neural nodes, LLM infrastructure, and
                  global system observability.
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      className="size-8 rounded-full border-2 border-background bg-muted-foreground/20"
                      key={i}
                    />
                  ))}
                  <div className="size-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    +{stats?.active_admins || 0}
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  Active Admin Sessions
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl flex flex-col gap-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                System Health
              </h3>
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>
            <div className="flex flex-col gap-4">
              <HealthBar
                color="primary"
                label="Kernel CPU"
                value={stats?.health?.cpu || 0}
              />
              <HealthBar
                color="orange"
                label="Neural Memory"
                value={stats?.health?.memory || 0}
              />
              <HealthBar
                color="emerald"
                label="I/O Throughput"
                value={stats?.health?.io || 0}
              />
              <HealthBar
                color="primary"
                label="Token Reservoir"
                value={stats?.health?.tokens || 0}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            color="primary"
            icon={<UsersIcon className="size-4" />}
            label="Global Nodes"
            value={stats?.total_users || 0}
          />
          <StatCard
            color="emerald"
            icon={<ActivityIcon className="size-4" />}
            label="Live Sessions"
            value={stats?.total_sessions || 0}
          />
          <StatCard
            color="orange"
            icon={<CpuIcon className="size-4" />}
            label="Active Models"
            value={stats?.total_models || 0}
          />
          <StatCard
            color="primary"
            icon={<GlobeIcon className="size-4" />}
            label="LLM Providers"
            value={stats?.total_providers || 0}
          />
          <StatCard
            color="emerald"
            icon={<ShieldAlertIcon className="size-4" />}
            label="Admin Access"
            value={stats?.active_admins || 0}
          />
        </div>

        {/* Console & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-border/40 font-mono overflow-hidden relative group">
            <div className="absolute top-4 right-4 text-[10px] text-primary/30 uppercase font-black">
              Buffer_Stream
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-4 border-b border-border/10 pb-2">
              Recent System Activity
            </h3>
            <div className="flex flex-col gap-1.5 text-[11px] h-32 overflow-y-auto scrollbar-hide">
              {(Array.isArray(logs) ? logs : logs?.items || [])?.map(
                (log: any, i: number) => (
                  <p className="tracking-tighter flex gap-2" key={i}>
                    <span className="opacity-40">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span
                      className={
                        log.level === "ERROR"
                          ? "text-red-400"
                          : log.level === "WARN"
                            ? "text-orange-400"
                            : "text-emerald-400"
                      }
                    >
                      &gt; {log.module}_{log.level}:
                    </span>
                    <span className="text-muted-foreground/80">
                      {log.message}
                    </span>
                  </p>
                )
              )}
              {!logsLoading &&
                !(Array.isArray(logs) ? logs.length : logs?.items?.length) && (
                  <p className="text-muted-foreground/30 italic">
                    No activity detected.
                  </p>
                )}
            </div>
            <div className="absolute bottom-4 left-6 text-primary animate-pulse">
              _
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm flex flex-col items-center justify-center text-center gap-4 group">
            <div className="p-4 rounded-full bg-primary/5 border border-primary/10 group-hover:scale-110 transition-transform duration-500">
              <ZapIcon
                className={`size-10 text-primary drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] ${isSyncing ? "animate-spin" : ""}`}
              />
            </div>
            <div>
              <h4 className="font-bold text-lg">Quick Action: Global Sync</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Re-validate all neural nodes and LLM caches across the global
                cluster.
              </p>
            </div>
            <button
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:scale-100"
              disabled={isSyncing}
              onClick={() => setConfirmSyncOpen(true)}
            >
              {isSyncing ? "Syncing..." : "Initiate Sync Protocol"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Protocol */}
      <AlertDialog onOpenChange={setConfirmSyncOpen} open={confirmSyncOpen}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary flex items-center gap-2 italic uppercase tracking-tighter">
              <ZapIcon size={18} /> Initiate Global_Sync?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This protocol will disrupt neural pathways briefly to re-align all
              cluster nodes and purge stale edge caches. Proceed with full
              re-validation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/10 border-border/40">
              SECURE_ABORT
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-white font-bold"
              onClick={handleSync}
            >
              EXECUTE_SYNC
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "primary" | "orange" | "emerald";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <div className="p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl flex items-center justify-between shadow-lg group hover:border-primary/30 transition-all">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {label}
        </span>
        <span className="text-2xl font-black tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
      <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
}

function HealthBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "primary" | "orange" | "emerald";
}) {
  const colorClasses = {
    primary: "bg-primary shadow-[0_0_10px_rgba(249,115,22,0.3)]",
    orange: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]",
    emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-muted-foreground uppercase tracking-tighter">
          {label}
        </span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colorClasses[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
