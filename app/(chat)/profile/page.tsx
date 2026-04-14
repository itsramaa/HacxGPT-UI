"use client";

import { 
  KeyIcon, 
  ShieldCheckIcon, 
  UserIcon, 
  MailIcon, 
  CalendarIcon, 
  ZapIcon, 
  ClockIcon, 
  CheckCircle2Icon,
  Loader2Icon,
  CreditCardIcon,
  HistoryIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { BackendUser } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export default function ProfilePage() {
  const { data: user, error, isLoading } = useSWR<BackendUser>("/api/profile", fetcher);
  const { data: history } = useSWR("/api/history", fetcher);
  
  const [activeTab, setActiveTab] = useState<"identity" | "security">("identity");
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, username }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Update failed");
      }

      await mutate("/api/profile");
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }
    
    setIsUpdating(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Password change failed");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background/30 backdrop-blur-xl">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <p className="text-destructive font-bold uppercase tracking-widest text-sm">Access Denied</p>
          <p className="text-muted-foreground max-w-xs">Authentication failed or server is offline. Please sign in again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/20">
      <div className="container mx-auto max-w-5xl py-12 px-6 space-y-12">
        {/* Header Section */}
        <div className="relative overflow-hidden p-8 rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center gap-8 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative size-32 rounded-[2rem] bg-background/50 border-2 border-primary/20 flex items-center justify-center p-1 shadow-[0_0_30px_rgba(var(--primary),0.1)] transition-transform duration-500 group-hover:scale-105">
             <div className="size-full rounded-[1.8rem] bg-gradient-to-t from-primary/20 to-primary/5 flex items-center justify-center text-primary overflow-hidden relative">
                <UserIcon size={64} className="opacity-80" />
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-background/40 to-transparent" />
             </div>
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
             <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground/90">
               {user.full_name || user.username}
             </h1>
             <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  <ShieldCheckIcon size={12} />
                  {user.role}
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <MailIcon size={14} />
                  {user.email}
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <CalendarIcon size={14} />
                  Joined {format(new Date(user.created_at), "MMM yyyy")}
                </div>
             </div>
          </div>
          <div className="w-full md:w-auto">
             <StatCard label="Total Chats" value={history?.total?.toString() || "0"} icon={<HistoryIcon size={14} />} color="text-amber-400" />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <nav className="flex flex-col gap-1.5">
              <NavButton 
                active={activeTab === "identity"} 
                onClick={() => setActiveTab("identity")}
                icon={<UserIcon size={18} />}
                label="Identity"
              />
              <NavButton 
                active={activeTab === "security"} 
                onClick={() => setActiveTab("security")}
                icon={<ShieldCheckIcon size={18} />}
                label="Security"
              />
            </nav>
            
            <Separator className="bg-border/20" />
            
            <div className="p-5 rounded-2xl border border-border/20 bg-card/40 space-y-3 relative overflow-hidden group">
               <p className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">Account Status</p>
               <h3 className="text-xl font-black text-emerald-400">VERIFIED</h3>
               <p className="text-xs text-muted-foreground leading-relaxed">Your account is fully synchronized with AI providers.</p>
            </div>
          </aside>

          <main className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === "identity" ? (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden rounded-[1.5rem]">
                    <CardHeader className="p-8 border-b border-border/10 bg-white/5">
                      <CardTitle className="text-xl font-bold">Personal Profile</CardTitle>
                      <CardDescription>Update your display name and identification</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                       <form onSubmit={handleUpdateProfile} className="space-y-6">
                          <div className="grid gap-6 sm:grid-cols-2">
                             <div className="space-y-2.5">
                               <Label htmlFor="fullname" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1">Full Legal Name</Label>
                               <Input 
                                 id="fullname" 
                                 value={fullName}
                                 onChange={(e) => setFullName(e.target.value)}
                                 className="h-12 bg-background/50 border-border/20 rounded-xl focus:ring-primary/20 transition-all"
                                 placeholder="Enter your name"
                               />
                             </div>
                             <div className="space-y-2.5">
                               <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1">Codename / Username</Label>
                               <Input 
                                 id="username" 
                                 value={username}
                                 onChange={(e) => setUsername(e.target.value)}
                                 className="h-12 bg-background/50 border-border/20 rounded-xl focus:ring-primary/20"
                                 placeholder="Hacker handle"
                               />
                             </div>
                          </div>
                          
                          <div className="space-y-2.5">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1">Registered Email</Label>
                            <div className="flex items-center gap-3 h-12 px-4 rounded-xl bg-muted/20 border border-border/10 text-muted-foreground text-sm italic">
                               <MailIcon size={16} />
                               {user.email}
                               <div className="ml-auto">
                                  <CheckCircle2Icon size={16} className="text-emerald-500/50" />
                               </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-4">
                             <Button 
                               disabled={isUpdating}
                               size="lg"
                               className="rounded-xl px-10 h-11 bg-primary text-primary-foreground font-bold shadow-[0_8px_30px_rgb(var(--primary),0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                             >
                               {isUpdating ? <Loader2Icon size={18} className="animate-spin mr-2" /> : "Sync Profile"}
                             </Button>
                          </div>
                       </form>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden rounded-[1.5rem]">
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                    <CardHeader className="p-8 border-b border-border/10 bg-white/5">
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <KeyIcon size={20} className="text-orange-500" />
                        Credentials Security
                      </CardTitle>
                      <CardDescription>Rotate your keys to keep your environment secure</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                       <form onSubmit={handleChangePassword} className="space-y-6">
                         <div className="space-y-2.5">
                            <Label htmlFor="curr_pass" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1">Current Password</Label>
                            <Input 
                              id="curr_pass" 
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="h-12 bg-background/50 border-border/20 rounded-xl"
                              placeholder="Enter current password"
                            />
                         </div>
                         <div className="space-y-2.5">
                            <Label htmlFor="new_pass" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 p-1">New Secure Password</Label>
                            <Input 
                              id="new_pass" 
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="h-12 bg-background/50 border-border/20 rounded-xl"
                              placeholder="Min. 6 characters"
                            />
                         </div>
                         
                         <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex gap-4">
                            <ShieldCheckIcon size={20} className="text-amber-500 shrink-0" />
                            <div className="space-y-1">
                               <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Enhanced Protection</p>
                               <p className="text-[11px] text-muted-foreground leading-relaxed">Your password is encrypted with salt-rounds before storage. Changing your password will not log you out of current sessions.</p>
                            </div>
                         </div>

                         <div className="flex justify-end pt-4">
                            <Button 
                              variant="outline"
                              disabled={isUpdating}
                              size="lg"
                              className="rounded-xl px-10 h-11 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 font-bold transition-all hover:scale-[1.02]"
                            >
                              {isUpdating ? <Loader2Icon size={18} className="animate-spin mr-2" /> : "Update Credentials"}
                            </Button>
                         </div>
                       </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-background/40 border border-border/10 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-background/60">
      <div className={cn("size-10 rounded-xl flex items-center justify-center bg-background/50", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[1px] text-muted-foreground opacity-60 leading-none mb-1">{label}</p>
        <p className="text-base font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all relative overflow-hidden group",
        active 
          ? "bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary),0.2)]" 
          : "text-muted-foreground hover:bg-white/5"
      )}
    >
      <div className={cn("transition-colors", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")}>
        {icon}
      </div>
      {label}
      {active && (
        <motion.div 
          layoutId="nav-glow" 
          className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 rounded-l-full"
        />
      )}
    </button>
  );
}
