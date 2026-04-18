import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAdminSessionDetail(id: string) {
  const router = useRouter();
  const { data, mutate, isLoading } = useSWR(
    id ? `/api/admin/sessions/${id}` : null,
    fetcher
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Synchronization failure during context purge.");
      }
      toast({
        type: "success",
        description: "Node session archived successfully.",
      });
      router.push("/admin/sessions");
    } catch (error: any) {
      toast({ type: "error", description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    session: data?.session,
    messages: data?.messages,
    isLoading,
    isDeleting,
    handleDelete,
    mutate,
  };
}
