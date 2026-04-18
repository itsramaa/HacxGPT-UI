import { LoaderIcon } from "@/components/chat/icons";
import { PlusIcon, ZapIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegisterKeyForm({
  providers,
  selectedProviderId,
  setSelectedProviderId,
  keyName,
  setKeyName,
  apiKeyValue,
  setApiKeyValue,
  onRegister,
  isSaving,
}: {
  providers: any[];
  selectedProviderId: string;
  setSelectedProviderId: (v: string) => void;
  keyName: string;
  setKeyName: (v: string) => void;
  apiKeyValue: string;
  setApiKeyValue: (v: string) => void;
  onRegister: (e: React.FormEvent) => void;
  isSaving: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <PlusIcon size={16} />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Expand Collections</h2>
      </div>

      <Card className="border-border/30 bg-card/40 backdrop-blur-md shadow-2xl shadow-primary/5 rounded-[1.5rem]">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-90">
            New Credential
          </CardTitle>
          <CardDescription className="text-[11px] leading-relaxed">
            Link a new API key to your secure vault.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onRegister}>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Provider Platform
              </Label>
              <Select
                onValueChange={setSelectedProviderId}
                value={selectedProviderId}
              >
                <SelectTrigger className="h-11 bg-background/50 border-border/20 w-full rounded-xl">
                  <SelectValue placeholder="Select Platform..." />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-2xl border-border/40">
                  {providers?.map((p: any) => {
                    if (!p) return null;
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Connection Name
              </Label>
              <Input
                className="h-11 bg-background/50 border-border/20 rounded-xl"
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. My Primary Workspace"
                value={keyName}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Secret Key
              </Label>
              <Input
                className="h-11 bg-background/50 border-border/20 rounded-xl"
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="••••••••••••••••"
                type="password"
                value={apiKeyValue}
              />
            </div>

            <Button
              className="w-full h-11 font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl bg-primary text-primary-foreground hover:scale-[1.01] active:scale-95 transition-all"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <LoaderIcon className="animate-spin mr-2" size={16} />
              ) : (
                <ZapIcon className="mr-2" size={14} />
              )}
              Authorize Connection
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
