"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/mobile-header";
import { useProfilePortal } from "@/hooks/use-profile-portal";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileNavigation } from "@/components/profile/profile-navigation";
import { IdentityForm, SecurityForm } from "@/components/profile/profile-forms";

export default function ProfilePage() {
  const {
    user,
    history,
    userLoading: isLoading,
    userError: error,
    isUpdating,
    fullName,
    setFullName,
    username,
    setUsername,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    handleSubmitProfile,
    handleSubmitPassword,
  } = useProfilePortal();

  const [activeTab, setActiveTab] = useState<"identity" | "security">(
    "identity"
  );

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background/30 backdrop-blur-xl">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-full w-full flex-col">
        <MobileHeader title="Profile Error" />
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <p className="text-destructive font-bold uppercase tracking-widest text-sm">
              Access Denied
            </p>
            <p className="text-muted-foreground max-w-xs">
              Authentication failed or server is offline. Please sign in again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-background to-background/20">
      <MobileHeader title="Your Profile" />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-5xl py-8 md:py-12 px-4 md:px-6 space-y-8 md:space-y-12">
          <ProfileHeader history={history} user={user} />

          <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
            <ProfileNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <main className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === "identity" ? (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    initial={{ opacity: 0, x: 20 }}
                    key="identity"
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <IdentityForm
                      fullName={fullName}
                      isUpdating={isUpdating}
                      onUpdate={handleSubmitProfile}
                      setFullName={setFullName}
                      setUsername={setUsername}
                      user={user}
                      username={username}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    initial={{ opacity: 0, x: 20 }}
                    key="security"
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <SecurityForm
                      currentPassword={currentPassword}
                      isUpdating={isUpdating}
                      newPassword={newPassword}
                      onUpdate={handleSubmitPassword}
                      setCurrentPassword={setCurrentPassword}
                      setNewPassword={setNewPassword}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
