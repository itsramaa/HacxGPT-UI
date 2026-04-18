import useSWR from "swr";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/toast";
import { fetcher } from "@/lib/utils";

export function useAdminLogs() {
  const [page, setPage] = useState(1);
  const size = 20;
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data,
    mutate: mutateLogs,
    isLoading,
  } = useSWR(`/api/admin/logs?page=${page}&size=${size}`, fetcher, {
    refreshInterval: 5000,
  });

  const logs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / size);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs", { method: "DELETE" });
      if (res.ok) {
        toast({ type: "success", description: "Audit registry cleared successfully." });
        mutateLogs({ items: [], total: 0, page: 1, size }, false);
      } else {
        toast({ type: "error", description: "Failed to clear audit registry." });
      }
    } catch (err) {
      toast({ type: "error", description: "Network error while clearing logs." });
    }
  };

  const filteredLogs =
    logs?.filter(
      (l: any) =>
        l.message.toLowerCase().includes(filter.toLowerCase()) ||
        l.module.toLowerCase().includes(filter.toLowerCase())
    ) || [];

  return {
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    filter,
    setFilter,
    scrollRef,
    filteredLogs,
    clearLogs,
    mutateLogs
  };
}
