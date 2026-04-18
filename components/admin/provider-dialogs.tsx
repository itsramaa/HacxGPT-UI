import { CpuIcon, PencilIcon } from "lucide-react";
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

export function ModelRegistrationDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onAdd,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  onAdd: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CpuIcon className="size-4 text-primary" /> Link Neural Model
          </DialogTitle>
          <DialogDescription>
            Register a new model endpoint for this provider. Alias is optional
            for UI display.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Model ID
            </label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. gpt-4o"
              value={formData.name}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              UI Alias
            </label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) =>
                setFormData({ ...formData, alias: e.target.value })
              }
              placeholder="e.g. GPT-4 Omni"
              value={formData.alias}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            CANCEL
          </Button>
          <Button onClick={onAdd}>LINK_NEURAL_UNIT</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditProviderDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilIcon className="size-4 text-primary" /> Modify Infrastructure Node
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Provider Name</label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              value={formData?.name || ""}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Base URL</label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              value={formData?.base_url || ""}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Default Model</label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
              value={formData?.default_model || ""}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">CANCEL</Button>
          <Button onClick={onConfirm}>SYNC_CHANGES</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditModelDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CpuIcon className="size-4 text-primary" /> Calibrate Neural Unit
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Model Name (Backend ID)</label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              value={formData?.name || ""}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">UI Alias</label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              value={formData?.alias || ""}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">CANCEL</Button>
          <Button onClick={onConfirm}>CONFIRM_REMAP</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
