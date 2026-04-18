import { KeyIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LinkKeyDialog({
  isOpen,
  onOpenChange,
  providerList,
  formData,
  setFormData,
  onAdd,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  providerList: any[];
  formData: any;
  setFormData: (data: any) => void;
  onAdd: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyIcon className="size-4 text-emerald-500" /> Link Cluster Secret
          </DialogTitle>
          <DialogDescription>
            Configure a system-wide API key for demo access. This key will be
            used by unauthenticated users.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Provider Node
            </label>
            <Select
              onValueChange={(v) =>
                setFormData({ ...formData, provider_id: v })
              }
            >
              <SelectTrigger className="bg-muted/20 border-border/40 w-full capitalize">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {providerList.map((p: any) => (
                  <SelectItem className="capitalize" key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Internal Name
            </label>
            <Input
              className="bg-muted/20 border-border/40"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Master Demo Key"
              value={formData.name}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Secret API Key
            </label>
            <Input
              className="bg-muted/20 border-border/40 font-mono"
              onChange={(e) =>
                setFormData({ ...formData, api_key: e.target.value })
              }
              placeholder="..."
              type="password"
              value={formData.api_key}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            SECURE_ABORT
          </Button>
          <Button onClick={onAdd}>INITIALIZE_SECRET</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
