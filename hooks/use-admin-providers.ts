import useSWR from "swr";
import { useState } from "react";
import { toast } from "@/components/toast";
import { fetcher } from "@/lib/utils";

export function useAdminProviders() {
  const [page, setPage] = useState(1);
  const size = 4;

  const {
    data,
    mutate: mutateProviders,
    isLoading,
  } = useSWR(`/api/admin/providers?page=${page}&size=${size}`, fetcher);

  const providers = (Array.isArray(data) ? data : data?.items) || [];
  const total = data?.total || (Array.isArray(data) ? data.length : 0);
  const totalPages = Math.ceil(total / size);

  // Modal State
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [targetProviderId, setTargetProviderId] = useState<string | null>(null);
  const [newModelData, setNewModelData] = useState({ name: "", alias: "" });

  const [editProviderDialogOpen, setEditProviderDialogOpen] = useState(false);
  const [editProviderData, setEditProviderData] = useState<any>(null);

  const [editModelDialogOpen, setEditModelDialogOpen] = useState(false);
  const [editModelData, setEditModelData] = useState<any>(null);

  const addProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name");
    const base_url = formData.get("base_url");
    const default_model = formData.get("default_model");

    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, base_url, default_model }),
      });
      if (!res.ok) { throw new Error("Failed to add provider"); }
      toast({ type: "success", description: "Provider added to registry." });
      mutateProviders();
      (e.target as HTMLFormElement).reset();
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    }
  };

  const openModelDialog = (providerId: string) => {
    setTargetProviderId(providerId);
    setNewModelData({ name: "", alias: "" });
    setModelDialogOpen(true);
  };

  const handleAddModel = async () => {
    if (!targetProviderId || !newModelData.name) {
      toast({ type: "error", description: "Model name is required." });
      return false;
    }

    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: targetProviderId,
          name: newModelData.name,
          alias: newModelData.alias || newModelData.name,
        }),
      });
      if (!res.ok) {
        throw new Error("Synchronization failure during neural model linking.");
      }
      toast({
        type: "success",
        description: `Model [${newModelData.name}] mapped successfully.`,
      });
      mutateProviders();
      setModelDialogOpen(false);
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("Confirm node decommissioning? All linked models will be purged.")) { return false; }
    try {
      const res = await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
      if (!res.ok) { throw new Error("Decommissioning failed."); }
      toast({ type: "success", description: "Provider purged from registry." });
      mutateProviders();
      return true;
    } catch (err: any) {
      toast({ type: "error", description: err.message });
      return false;
    }
  };

  const handleEditProvider = async () => {
    if (!editProviderData) { return false; }
    try {
      const res = await fetch(`/api/admin/providers/${editProviderData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProviderData.name,
          base_url: editProviderData.base_url,
          default_model: editProviderData.default_model,
        }),
      });
      if (!res.ok) { throw new Error("Sync failed."); }
      toast({ type: "success", description: "Registry updated." });
      mutateProviders();
      setEditProviderDialogOpen(false);
      return true;
    } catch (err: any) {
      toast({ type: "error", description: err.message });
      return false;
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm("Purge neural mapping?")) { return false; }
    try {
      const res = await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
      if (!res.ok) { throw new Error("Purge failed."); }
      toast({ type: "success", description: "Model purged." });
      mutateProviders();
      return true;
    } catch (err: any) {
      toast({ type: "error", description: err.message });
      return false;
    }
  };

  const handleEditModel = async () => {
    if (!editModelData) { return false; }
    try {
      const res = await fetch(`/api/admin/models/${editModelData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editModelData.name,
          alias: editModelData.alias,
        }),
      });
      if (!res.ok) { throw new Error("Update failed."); }
      toast({ type: "success", description: "Neural unit re-mapped." });
      mutateProviders();
      setEditModelDialogOpen(false);
      return true;
    } catch (err: any) {
      toast({ type: "error", description: err.message });
      return false;
    }
  };

  const toggleModelPublicStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/models/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !currentStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update model status.");
      }
      mutateProviders();
      toast({
        type: "success",
        description: `Model is now ${!currentStatus ? "PUBLIC" : "PRIVATE"}.`,
      });
      return true;
    } catch (err: any) {
      toast({ type: "error", description: err.message });
      return false;
    }
  };

  const toggleModelRecommended = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/models/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_recommended: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update.");
      mutateProviders();
      toast({ type: "success", description: `Model is ${!currentStatus ? "now recommended" : "no longer recommended"}.` });
      return true;
    } catch (err: any) {
      toast({ type: "error", description: err.message });
      return false;
    }
  };

  const toggleModelFree = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/models/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_free: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update.");
      mutateProviders();
      toast({ type: "success", description: `Model is now ${!currentStatus ? "FREE" : "FULL CAPACITY"}.` });
      return true;
    } catch (err: any) {
      toast({ type: "error", description: err.message });
      return false;
    }
  };

  return {
    providers,
    total,
    totalPages,
    page,
    setPage,
    isLoading,
    mutateProviders,
    modelDialogOpen,
    setModelDialogOpen,
    newModelData,
    setNewModelData,
    editProviderDialogOpen,
    setEditProviderDialogOpen,
    editProviderData,
    setEditProviderData,
    editModelDialogOpen,
    setEditModelDialogOpen,
    editModelData,
    setEditModelData,
    addProvider,
    openModelDialog,
    handleAddModel,
    deleteProvider,
    handleEditProvider,
    deleteModel,
    handleEditModel,
    toggleModelPublicStatus,
    toggleModelRecommended,
    toggleModelFree
  };
}
