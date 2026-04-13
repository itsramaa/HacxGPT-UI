"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/chat/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { UserIcon, ShieldCheckIcon, KeyIcon, LogOutIcon } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ type: "success", description: "Profile updated successfully!" });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ type: "success", description: "Password changed successfully!" });
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background/50">
      <div className="container mx-auto max-w-5xl py-10 px-6 space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">Account Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your identity and security preferences.</p>
          </div>
          <div className="hidden sm:flex size-14 rounded-full bg-primary/10 items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
            <UserIcon size={28} />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
             <nav className="flex flex-col gap-1 p-2 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm">
                <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary transition-colors">
                   <UserIcon size={16} />
                   Identity
                </button>
                <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors">
                   <ShieldCheckIcon size={16} />
                   Security
                </button>
             </nav>
             
             <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[13px] text-amber-500/80 space-y-2">
                <p className="font-semibold flex items-center gap-2">
                   <KeyIcon size={14} />
                   Security Note
                </p>
                <p>Ensure your account uses a strong, unique password to prevent unauthorized access to your chat history.</p>
             </div>
          </div>

          <div className="space-y-8">
            <Card className="border-border/60 shadow-xl shadow-foreground/5">
              <CardHeader className="pb-8">
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your public identity on HacxGPT.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs uppercase tracking-widest font-bold text-muted-foreground opacity-70">Full Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Master Hacker"
                        className="bg-background/80 border-border/20 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-muted-foreground opacity-70">Email Address</Label>
                      <Input 
                        id="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        disabled 
                        className="bg-muted/30 border-border/10 cursor-not-allowed italic text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="px-8 shadow-lg shadow-primary/20">Save Profile</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xl shadow-foreground/5 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader className="pb-8">
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your account protected with a fresh secret.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                       <Label htmlFor="current" className="text-xs uppercase tracking-widest font-bold text-muted-foreground opacity-70">Current Password</Label>
                       <Input 
                         id="current" 
                         type="password" 
                         value={currentPassword} 
                         onChange={(e) => setCurrentPassword(e.target.value)}
                         className="bg-background/80 border-border/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="new" className="text-xs uppercase tracking-widest font-bold text-muted-foreground opacity-70">New Password</Label>
                       <Input 
                         id="new" 
                         type="password" 
                         value={newPassword} 
                         onChange={(e) => setNewPassword(e.target.value)}
                         className="bg-background/80 border-border/20"
                       />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="outline" className="px-8 border-amber-500/50 text-amber-500 hover:bg-amber-500/10">Update Password</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
