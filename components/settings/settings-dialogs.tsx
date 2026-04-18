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

export function SettingsDialogs({
  confirmDeleteOpen,
  setConfirmDeleteOpen,
  confirmPurgeOpen,
  setConfirmPurgeOpen,
  confirmBulkOpen,
  setConfirmBulkOpen,
  pendingDeleteData,
  selectedKeyIdsCount,
  onExecuteDelete,
  onExecuteBulkDelete,
  onExecutePurgeAll,
}: {
  confirmDeleteOpen: boolean;
  setConfirmDeleteOpen: (v: boolean) => void;
  confirmPurgeOpen: boolean;
  setConfirmPurgeOpen: (v: boolean) => void;
  confirmBulkOpen: boolean;
  setConfirmBulkOpen: (v: boolean) => void;
  pendingDeleteData: { id: string; name: string } | null;
  selectedKeyIdsCount: number;
  onExecuteDelete: (id: string, name: string) => void;
  onExecuteBulkDelete: () => void;
  onExecutePurgeAll: () => void;
}) {
  return (
    <>
      <AlertDialog onOpenChange={setConfirmDeleteOpen} open={confirmDeleteOpen}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Neural Channel?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to purge{" "}
              <span className="text-primary font-bold">
                "{pendingDeleteData?.name}"
              </span>
              ? This will disable communication with the target provider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ABORT</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() =>
                onExecuteDelete(pendingDeleteData!.id, pendingDeleteData!.name)
              }
            >
              PURGE_NODE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setConfirmBulkOpen} open={confirmBulkOpen}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Execute Cluster Wipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Wipe{" "}
              <span className="text-primary font-bold">
                {selectedKeyIdsCount} selected connections
              </span>
              . This batch operation cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ABORT</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={onExecuteBulkDelete}
            >
              EXECUTE_BATCH_PURGE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setConfirmPurgeOpen} open={confirmPurgeOpen}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Initialize Total Reset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will destroy ALL credentials in your vault. Your environment
              will be completely disconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ABORT</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={onExecutePurgeAll}
            >
              CONFIRM_TOTAL_DESTRUCTION
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
