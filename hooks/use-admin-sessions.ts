import useSWR from "swr";
import { useState } from "react";
import { fetcher } from "@/lib/utils";

export function useAdminSessions() {
  const [page, setPage] = useState(1);
  const size = 10;

  const { data, isLoading } = useSWR(
    `/api/admin/sessions?page=${page}&size=${size}`,
    fetcher
  );

  const sessions = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / size);

  return {
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    sessions,
  };
}
