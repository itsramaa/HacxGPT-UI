"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SidebarHistoryDialogsProps {
  confirmDeleteOpen: boolean;
  setConfirmDeleteOpen: (open: boolean) => void;
  confirmDeleteAllOpen: boolean;
  setConfirmDeleteAllOpen: (open: boolean) => void;
  onExecuteDelete: () => Promise<void>;
  onExecuteDeleteAll: () => Promise<void>;
}

export function SidebarHistoryDialogs({
  confirmDeleteOpen,
  setConfirmDeleteOpen,
  confirmDeleteAllOpen,
  setConfirmDeleteAllOpen,
  onExecuteDelete,
  onExecuteDeleteAll,
}: SidebarHistoryDialogsProps) {
  return (
    <>
      {/* Single Delete Confirmation */}
      <AlertDialog onOpenChange={setConfirmDeleteOpen} open={confirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onExecuteDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete All Confirmation */}
      <AlertDialog
        onOpenChange={setConfirmDeleteAllOpen}
        open={confirmDeleteAllOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onExecuteDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
