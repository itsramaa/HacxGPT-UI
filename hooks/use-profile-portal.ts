import { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/utils";
import type { BackendUser } from "@/lib/types";

export function useProfilePortal() {
  const {
    data: user,
    error,
    isLoading: userLoading,
    mutate: mutateUser,
  } = useSWR<BackendUser>("/api/profile", fetcher);
  const { update: updateSession } = useSession();
  
  const { data: history } = useSWR("/api/history", fetcher);

  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setUsername(user.username || "");
    }
  }, [user]);

  useEffect(() => {
    const handleUsageUpdate = () => {
      mutateUser();
    };

    window.addEventListener("hacxgpt:usage-updated" as any, handleUsageUpdate);
    return () => {
      window.removeEventListener("hacxgpt:usage-updated" as any, handleUsageUpdate);
    };
  }, [mutateUser]);

  const handleSubmitProfile = async (e: React.FormEvent) => {
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

      const updatedUser = await res.json();
      await mutateUser(updatedUser, false);
      await updateSession(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
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
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
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

  return {
    user,
    history,
    userLoading,
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
    mutate: mutateUser,
    update: updateSession,
  };
}
