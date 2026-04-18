import useSWR from "swr";
import { useState } from "react";
import { toast } from "@/components/toast";
import { fetcher } from "@/lib/utils";

export function useAdminKeys() {
  const {
    data: keys,
    mutate: mutateKeys,
    isLoading,
  } = useSWR("/api/admin/keys", fetcher);
  
  const { data: providers } = useSWR("/api/admin/providers", fetcher);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    api_key: "",
    provider_id: "",
  });

  const handleAddKey = async () => {
    if (!formData.name || !formData.api_key || !formData.provider_id) {
      toast({
        type: "error",
        description: "All fields are required for cluster key registration.",
      });
      return false;
    }

    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        throw new Error("Failed to register system-wide key.");
      }
      
      toast({ type: "success", description: "Public key linked to cluster." });
      mutateKeys();
      setIsAddOpen(false);
      setFormData({ name: "", api_key: "", provider_id: "" });
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this system key? Demo mode for this provider may fail."
      )
    ) {
      return false;
    }
    
    try {
      const res = await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to revoke key.");
      }
      
      toast({ type: "success", description: "System key revoked." });
      mutateKeys();
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    }
  };

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await fetch("/api/admin/revalidate-keys", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to trigger revalidation.");
      }
      
      toast({
        type: "success",
        description: "Key re-validation protocol initiated in the background.",
      });
      
      // Optionally mutate keys to see updates if they happen fast
      setTimeout(mutateKeys, 5000);
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    } finally {
      setIsRevalidating(false);
    }
  };

  const providerList =
    (Array.isArray(providers) ? providers : providers?.items) || [];

  return {
    keys,
    isLoading,
    providerList,
    isAddOpen,
    setIsAddOpen,
    isRevalidating,
    formData,
    setFormData,
    handleAddKey,
    handleDeleteKey,
    handleRevalidate,
  };
}
