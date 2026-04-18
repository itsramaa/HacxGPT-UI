import { ZapIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function TokenAdjustmentDialog({
  isOpen,
  onOpenChange,
  tokenAmount,
  setTokenAmount,
  onUpdate,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tokenAmount: string;
  setTokenAmount: (v: string) => void;
  onUpdate: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ZapIcon className="size-4 text-primary" /> Token Reservoir Update
          </DialogTitle>
          <DialogDescription>
            Modify the synthetic token usage for target node. Value must be an
            unsigned integer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            className="col-span-3 bg-muted/20 border-border/40"
            id="tokens"
            onChange={(e) => setTokenAmount(e.target.value)}
            type="number"
            value={tokenAmount}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            CANCEL
          </Button>
          <Button onClick={onUpdate}>APPLY_CHANGES</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RoleConfirmationDialog({
  isOpen,
  onOpenChange,
  pendingRole,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pendingRole?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={isOpen}>
      <AlertDialogContent className="bg-card border-border/40">
        <AlertDialogHeader>
          <AlertDialogTitle>Node Privilege Escalation?</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm role transition to{" "}
            <span className="text-primary font-bold uppercase tracking-widest">
              {pendingRole}
            </span>
            . This action modifies cluster-wide access permissions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted/20 border-border/40">
            SECURE_ABORT
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-primary text-white"
            onClick={onConfirm}
            variant="destructive"
          >
            CONFIRM_SUDO_ACCESS
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
