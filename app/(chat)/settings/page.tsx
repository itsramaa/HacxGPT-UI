"use client";

import {
  Settings2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { MobileHeader } from "@/components/mobile-header";
import { useSettingsVault } from "@/hooks/use-settings-vault";
import { useSettingsConfig } from "@/hooks/use-settings-config";
import { useSettingsProfile } from "@/hooks/use-settings-profile";

import { RegisterKeyForm } from "@/components/settings/register-key-form";
import { LanguageSelector } from "@/components/settings/language-selector";
import { KeyVaultList } from "@/components/settings/key-vault-list";
import { ModelHubConfig } from "@/components/settings/model-hub-config";
import { SettingsDialogs } from "@/components/settings/settings-dialogs";

export default function SettingsPage() {
  const { data: session } = useSession();

  const {
    keys,
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
  } = useSettingsVault();

  const {
    providers,
    catalog,
    catalogLoading,
    catalogTotal,
    hubPage,
    setHubPage,
    modelPages,
    setModelPages,
    hubSearchQuery,
    setHubSearchQuery,
    isUpdatingPrefs,
    disabledProviders,
    disabledModels,
    savePreferences,
    toggleProviderVisibility,
    toggleModelVisibility,
    hubItemsPerPage,
  } = useSettingsConfig();

  const {
    profile,
    updateLanguagePreference,
  } = useSettingsProfile();

  // Pagination Local State
  const ITEMS_PER_PAGE = 4;
  const [keyPage, setKeyPage] = useState(1);

  // Confirmation States
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [pendingDeleteData, setPendingDeleteData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const activeKeys = keys || [];
  const catalogTotalPages = Math.max(1, Math.ceil(catalogTotal / hubItemsPerPage));

  // Paginated Data
  const paginatedKeys = activeKeys.slice(
    (keyPage - 1) * ITEMS_PER_PAGE,
    keyPage * ITEMS_PER_PAGE
  );
  const totalKeyPages = Math.ceil(activeKeys.length / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background/30 backdrop-blur-sm border-l border-border/10">
      <MobileHeader title="API Settings" />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-6xl py-6 md:py-12 px-4 md:px-6 space-y-12 md:space-y-16 overflow-x-hidden">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 md:px-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-[10px] uppercase">
                <ShieldCheckIcon size={12} />
                Secured Vault
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40 italic">
                COMMAND CENTER
              </h1>
              <p className="text-muted-foreground font-medium max-w-lg text-sm md:text-base leading-relaxed opacity-80">
                Architect your AI ecosystem. Manage provider collections,
                encrypted credentials, and global model landscape.
              </p>
            </div>
            <div className="flex items-center gap-3 md:gap-4 self-start md:self-auto bg-card/20 p-2 rounded-2xl border border-border/10 md:bg-transparent md:p-0 md:border-0">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-foreground/80">
                  {session?.user?.name || "Architect"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                  System Administrator
                </span>
              </div>
              <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                <Settings2Icon className="size-5 md:size-6" />
              </div>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-3 px-1 md:px-0">
            {/* Form Side - Left 1 col */}
            <div className="lg:col-span-1 space-y-8">
              <RegisterKeyForm
                apiKeyValue={apiKeyValue}
                isSaving={isSaving}
                keyName={keyName}
                onRegister={handleSubmitKey}
                providers={providers}
                selectedProviderId={selectedProviderId}
                setApiKeyValue={setApiKeyValue}
                setKeyName={setKeyName}
                setSelectedProviderId={setSelectedProviderId}
              />

              <LanguageSelector
                onValueChange={updateLanguagePreference}
                value={profile?.language_preference || "auto"}
              />
            </div>

            {/* List Side - Right 2 cols */}
            <div className="lg:col-span-2 space-y-12">
              <KeyVaultList
                isLoading={keysLoading}
                isRevalidatingVault={isRevalidatingSelf}
                keys={paginatedKeys}
                onBulkDelete={() => setConfirmBulkOpen(true)}
                onDeleteKey={(id, name) => {
                  setPendingDeleteData({ id, name });
                  setConfirmDeleteOpen(true);
                }}
                onPurgeAll={() => setConfirmPurgeOpen(true)}
                onRevalidateKey={handleRevalidateKey}
                onRevalidateVault={handleRevalidateVault}
                onToggleSelectAll={toggleSelectAll}
                onToggleSelectOne={toggleSelectOne}
                page={keyPage}
                revalidatingKeyId={revalidatingKeyId}
                selectedKeyIds={selectedKeyIds}
                setPage={setKeyPage}
                totalPages={totalKeyPages}
              />

              <ModelHubConfig
                catalog={catalog}
                disabledModels={disabledModels}
                disabledProviders={disabledProviders}
                hubPage={hubPage}
                hubSearchQuery={hubSearchQuery}
                isLoading={catalogLoading}
                isUpdating={isUpdatingPrefs}
                modelPages={modelPages}
                onSave={savePreferences}
                setHubPage={setHubPage}
                setHubSearchQuery={setHubSearchQuery}
                setModelPages={setModelPages}
                toggleModelVisibility={toggleModelVisibility}
                toggleProviderVisibility={toggleProviderVisibility}
                totalPages={catalogTotalPages}
              />
            </div>
          </div>
        </div>

        <SettingsDialogs
          confirmBulkOpen={confirmBulkOpen}
          confirmDeleteOpen={confirmDeleteOpen}
          confirmPurgeOpen={confirmPurgeOpen}
          onExecuteBulkDelete={executeBulkDelete}
          onExecuteDelete={executeDeleteKey}
          onExecutePurgeAll={executePurgeAll}
          pendingDeleteData={pendingDeleteData}
          selectedKeyIdsCount={selectedKeyIds.size}
          setConfirmBulkOpen={setConfirmBulkOpen}
          setConfirmDeleteOpen={setConfirmDeleteOpen}
          setConfirmPurgeOpen={setConfirmPurgeOpen}
        />
      </div>
    </div>
  );
}
