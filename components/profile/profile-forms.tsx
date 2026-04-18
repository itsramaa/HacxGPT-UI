import {
  CheckCircle2Icon,
  KeyIcon,
  Loader2Icon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IdentityForm({
  user,
  fullName,
  setFullName,
  username,
  setUsername,
  onUpdate,
  isUpdating,
}: {
  user: any;
  fullName: string;
  setFullName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  onUpdate: (e: React.FormEvent) => void;
  isUpdating: boolean;
}) {
  return (
    <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden rounded-[1.5rem]">
      <CardHeader className="p-8 border-b border-border/10 bg-white/5">
        <CardTitle className="text-xl font-bold">Personal Profile</CardTitle>
        <CardDescription>
          Update your display name and identification
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <form className="space-y-6" onSubmit={onUpdate}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2.5">
              <Label
                className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1"
                htmlFor="fullname"
              >
                Full Legal Name
              </Label>
              <Input
                className="h-12 bg-background/50 border-border/20 rounded-xl focus:ring-primary/20 transition-all"
                id="fullname"
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                value={fullName}
              />
            </div>
            <div className="space-y-2.5">
              <Label
                className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1"
                htmlFor="username"
              >
                Codename / Username
              </Label>
              <Input
                className="h-12 bg-background/50 border-border/20 rounded-xl focus:ring-primary/20"
                id="username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Hacker handle"
                value={username}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1">
              Registered Email
            </Label>
            <div className="flex items-center gap-3 h-12 px-4 rounded-xl bg-muted/20 border border-border/10 text-muted-foreground text-sm italic">
              <MailIcon size={16} />
              {user.email}
              <div className="ml-auto">
                <CheckCircle2Icon className="text-emerald-500/50" size={16} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="rounded-xl px-10 h-11 bg-primary text-primary-foreground font-bold shadow-[0_8_30px_rgb(var(--primary),0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isUpdating}
              size="lg"
            >
              {isUpdating ? (
                <Loader2Icon className="animate-spin mr-2" size={18} />
              ) : (
                "Sync Profile"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SecurityForm({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  onUpdate,
  isUpdating,
}: {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  onUpdate: (e: React.FormEvent) => void;
  isUpdating: boolean;
}) {
  return (
    <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden rounded-[1.5rem]">
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
      <CardHeader className="p-8 border-b border-border/10 bg-white/5">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <KeyIcon className="text-orange-500" size={20} />
          Credentials Security
        </CardTitle>
        <CardDescription>
          Rotate your keys to keep your environment secure
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <form className="space-y-6" onSubmit={onUpdate}>
          <div className="space-y-2.5">
            <Label
              className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1"
              htmlFor="curr_pass"
            >
              Current Password
            </Label>
            <Input
              className="h-12 bg-background/50 border-border/20 rounded-xl"
              id="curr_pass"
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              type="password"
              value={currentPassword}
            />
          </div>
          <div className="space-y-2.5">
            <Label
              className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1"
              htmlFor="new_pass"
            >
              New Secure Password
            </Label>
            <Input
              className="h-12 bg-background/50 border-border/20 rounded-xl"
              id="new_pass"
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              type="password"
              value={newPassword}
            />
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex gap-4">
            <ShieldCheckIcon className="text-amber-500 shrink-0" size={20} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                Enhanced Protection
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your password is encrypted with salt-rounds before storage.
                Changing your password will not log you out of current sessions.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="rounded-xl px-10 h-11 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 font-bold transition-all hover:scale-[1.02]"
              disabled={isUpdating}
              size="lg"
              variant="outline"
            >
              {isUpdating ? (
                <Loader2Icon className="animate-spin mr-2" size={18} />
              ) : (
                "Update Credentials"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
