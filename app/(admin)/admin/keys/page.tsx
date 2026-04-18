"use client";

import {
  KeyIcon,
  LoaderIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAdminKeys } from "@/hooks/use-admin-keys";
import { KeyCard } from "@/components/admin/key-card";
import { LinkKeyDialog } from "@/components/admin/key-dialogs";

export default function PublicKeysAdminPage() {
  const {
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
  } = useAdminKeys();

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheckIcon className="size-5 text-emerald-500" /> System Neural
          Vault
        </h2>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
            disabled={isRevalidating}
            onClick={handleRevalidate}
            size="sm"
            variant="outline"
          >
            {isRevalidating ? (
              <LoaderIcon className="size-3 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-3" />
            )}
            REVALIDATE_KEYS
          </Button>
          <Button
            className="rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
            onClick={() => setIsAddOpen(true)}
            size="sm"
          >
            <PlusIcon className="size-3" /> LINK_SYSTEM_KEY
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keys?.map((key: any) => (
          <KeyCard
            apiKey={key}
            key={key.id}
            onDelete={handleDeleteKey}
          />
        ))}
      </div>

      {keys?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-border/40 rounded-3xl bg-muted/5 text-muted-foreground gap-4">
          <KeyIcon className="size-10 opacity-20" />
          <p className="text-sm italic">
            No system keys discovered in the neural vault.
          </p>
        </div>
      )}

      <LinkKeyDialog
        formData={formData}
        isOpen={isAddOpen}
        onAdd={handleAddKey}
        onOpenChange={setIsAddOpen}
        providerList={providerList}
        setFormData={setFormData}
      />
    </div>
  );
}
