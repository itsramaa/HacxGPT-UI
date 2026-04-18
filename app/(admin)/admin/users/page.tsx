"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { LoaderIcon } from "@/components/chat/icons";
import { UserTable } from "@/components/admin/user-table";
import {
  RoleConfirmationDialog,
  TokenAdjustmentDialog,
} from "@/components/admin/user-dialogs";

export default function UsersAdminPage() {
  const {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    filteredUsers,
    tokenDialogOpen,
    setTokenDialogOpen,
    newTokenAmount,
    setNewTokenAmount,
    confirmRoleOpen,
    setConfirmRoleOpen,
    pendingRoleData,
    updateUserStatus,
    initiateRoleUpdate,
    handleRoleUpdate,
    openTokenDialog,
    handleTokenUpdate,
  } = useAdminUsers();

  if (isLoading && !filteredUsers.length) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UsersIcon className="size-5" /> Node Registry
          </h2>
          <div className="relative max-w-sm w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              className="w-full bg-muted/40 border border-border/40 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              type="text"
              value={searchQuery}
            />
          </div>
        </div>

        <UserTable
          onInitiateRoleUpdate={initiateRoleUpdate}
          onOpenTokenDialog={openTokenDialog}
          onUpdateStatus={updateUserStatus}
          users={filteredUsers}
        />

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-5 py-4 bg-muted/20 border-t border-border/10 rounded-2xl border border-border/40">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
            Page {page} of {totalPages || 1}{" "}
            <span className="opacity-40">({total} total nodes)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <TokenAdjustmentDialog
        isOpen={tokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
        onUpdate={handleTokenUpdate}
        setTokenAmount={setNewTokenAmount}
        tokenAmount={newTokenAmount}
      />

      <RoleConfirmationDialog
        isOpen={confirmRoleOpen}
        onConfirm={handleRoleUpdate}
        onOpenChange={setConfirmRoleOpen}
        pendingRole={pendingRoleData?.newRole}
      />
    </>
  );
}
