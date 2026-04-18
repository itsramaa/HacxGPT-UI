"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ServerIcon,
} from "lucide-react";
import { useAdminProviders } from "@/hooks/use-admin-providers";
import { LoaderIcon } from "@/components/chat/icons";
import { ProviderCard } from "@/components/admin/provider-card";
import {
  EditModelDialog,
  EditProviderDialog,
  ModelRegistrationDialog,
} from "@/components/admin/provider-dialogs";

export default function ProvidersAdminPage() {
  const {
    providers,
    total,
    totalPages,
    page,
    setPage,
    isLoading,
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
  } = useAdminProviders();

  if (isLoading && !providers.length) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ServerIcon className="size-5 text-orange-500" /> LLM Infrastructure
          </h2>
          <form
            className="flex flex-wrap gap-2 bg-muted/20 p-2 rounded-2xl border border-border/40 w-full md:w-auto"
            onSubmit={addProvider}
          >
            <input
              className="bg-background/50 border border-border/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              name="name"
              placeholder="Provider Name"
              required
            />
            <input
              className="bg-background/50 border border-border/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              name="base_url"
              placeholder="API Base URL"
              required
            />
            <input
              className="bg-background/50 border border-border/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              name="default_model"
              placeholder="Default Model"
              required
            />
            <button
              className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
              type="submit"
            >
              <PlusIcon className="size-3" /> REGISTER_NODE
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers?.map((p: any) => (
            <ProviderCard
              key={p.id}
              onAddModel={openModelDialog}
              onDelete={deleteProvider}
              onDeleteModel={deleteModel}
              onEdit={(data) => {
                setEditProviderData(data);
                setEditProviderDialogOpen(true);
              }}
              onEditModel={(data) => {
                setEditModelData(data);
                setEditModelDialogOpen(true);
              }}
              onToggleModelFree={toggleModelFree}
              onToggleModelPublic={toggleModelPublicStatus}
              onToggleModelRecommended={toggleModelRecommended}
              provider={p}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/40">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-80">
            PAGE {page} / {totalPages || 1}{" "}
            <span className="mx-2 opacity-30">|</span> TOTAL_PROVIDERS: {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-xl border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-20 disabled:pointer-events-none"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              className="p-2 rounded-xl border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-20 disabled:pointer-events-none"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <ModelRegistrationDialog
        formData={newModelData}
        isOpen={modelDialogOpen}
        onAdd={handleAddModel}
        onOpenChange={setModelDialogOpen}
        setFormData={setNewModelData}
      />

      <EditProviderDialog
        formData={editProviderData}
        isOpen={editProviderDialogOpen}
        onConfirm={handleEditProvider}
        onOpenChange={setEditProviderDialogOpen}
        setFormData={setEditProviderData}
      />

      <EditModelDialog
        formData={editModelData}
        isOpen={editModelDialogOpen}
        onConfirm={handleEditModel}
        onOpenChange={setEditModelDialogOpen}
        setFormData={setEditModelData}
      />
    </>
  );
}
