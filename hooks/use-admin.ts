import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { toast } from "@/components/toast";
import { reportAuditLog } from "@/lib/audit";
import { fetcher } from "@/lib/utils";

export function useAdmin() {
  const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useSWR(
    "/api/admin/stats",
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: logs, isLoading: logsLoading, mutate: mutateLogs } = useSWR(
    "/api/admin/logs",
    fetcher,
    { refreshInterval: 10000 }
  );

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    reportAuditLog(
      "SECURITY",
      "MACHINE",
      "Administrative session established. Remote node connected to Mainframe."
    );
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      if (!res.ok) {
        throw new Error("Sync failed");
      }
      toast({
        type: "success",
        description: "Global sync protocol completed.",
      });
      // Optionally mutate stats after sync
      mutateStats();
      mutateLogs();
    } catch (err: any) {
      toast({ type: "error", description: err.message });
    } finally {
      setIsSyncing(false);
    }
  }, [mutateStats, mutateLogs]);

  return {
    stats,
    statsLoading,
    logs,
    logsLoading,
    isSyncing,
    handleSync,
  };
}
