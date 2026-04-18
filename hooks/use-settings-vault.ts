import { useState, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { fetcher } from "@/lib/utils";

export function useSettingsVault() {
  const { data: keys, isLoading: keysLoading, mutate: mutateKeys } = useSWR<any[]>(
    "/api/keys",
    fetcher
  );

  const [isSaving, setIsSaving] = useState(false);
  const [selectedKeyIds, setSelectedKeyIds] = useState<Set<string>>(new Set());
  const [isRevalidatingSelf, setIsRevalidatingSelf] = useState(false);
  const [revalidatingKeyId, setRevalidatingKeyId] = useState<string | null>(null);

  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [keyName, setKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");

  const handleSubmitKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !keyName || !apiKeyValue) {
      toast.error("Please fill all deployment parameters.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selectedProviderId,
          name: keyName,
          api_key: apiKeyValue,
        }),
      });

      if (res.ok) {
        toast.success(`Key "${keyName}" registered successfully`);
        setKeyName("");
        setApiKeyValue("");
        mutateKeys();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to register key");
      }
    } catch (_err) {
      toast.error("Execution failed. Check your network.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeBulkDelete = async () => {
    if (selectedKeyIds.size === 0) return;
    try {
      const ids = Array.from(selectedKeyIds);
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        toast.success(`${selectedKeyIds.size} connections purged`);
        setSelectedKeyIds(new Set());
        mutateKeys();
      }
    } catch (_err) {
      toast.error("Bulk deletion failed");
    }
  };

  const executePurgeAll = async () => {
    try {
      const res = await fetch("/api/keys?all=true", { method: "DELETE" });
      if (res.ok) {
        toast.success("Vault wiped successfully");
        setSelectedKeyIds(new Set());
        mutateKeys();
      }
    } catch (_err) {
      toast.error("Failed to wipe vault");
    }
  };

  const executeDeleteKey = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Connection "${name}" removed`);
        mutateKeys();
      } else {
        toast.error("Failed to delete connection");
      }
    } catch (_err) {
      toast.error("Deletion failed");
    }
  };

  const handleRevalidateVault = async () => {
    setIsRevalidatingSelf(true);
    try {
      const res = await fetch("/api/keys/revalidate", { method: "POST" });
      if (!res.ok) throw new Error("Revalidation protocol failed.");
      toast.success("Vault re-validation initiated in background.");
      setTimeout(() => mutateKeys(), 5000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRevalidatingSelf(false);
    }
  };

  const handleRevalidateKey = async (id: string) => {
    setRevalidatingKeyId(id);
    try {
      const res = await fetch(`/api/keys/${id}/revalidate`, { method: "POST" });
      if (!res.ok) throw new Error("Target probe failed.");
      toast.success("Single-node probe queued.");
      setTimeout(() => mutateKeys(), 3000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRevalidatingKeyId(null);
    }
  };

  const toggleSelectAll = useCallback((allIds: string[]) => {
    if (selectedKeyIds.size === allIds.length) {
      setSelectedKeyIds(new Set());
    } else {
      setSelectedKeyIds(new Set(allIds));
    }
  }, [selectedKeyIds]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    keys: keys || [],
    keysLoading,
    isSaving,
    selectedKeyIds,
    isRevalidatingSelf,
    revalidatingKeyId,
    selectedProviderId,
    setSelectedProviderId,
    keyName,
    setKeyName,
    apiKeyValue,
    setApiKeyValue,
    handleSubmitKey,
    executeBulkDelete,
    executePurgeAll,
    executeDeleteKey,
    handleRevalidateVault,
    handleRevalidateKey,
    toggleSelectAll,
    toggleSelectOne,
  };
}
