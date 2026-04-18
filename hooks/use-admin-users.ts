import useSWR from "swr";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/components/toast";
import { fetcher } from "@/lib/utils";

export function useAdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const size = 10;
  
  const { data: session } = useSession();

  const {
    data,
    mutate: mutateUsers,
    isLoading,
  } = useSWR(`/api/admin/users?page=${page}&size=${size}`, fetcher);

  const users = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / size);

  // Action States
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [newTokenAmount, setNewTokenAmount] = useState("");
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [pendingRoleData, setPendingRoleData] = useState<{
    id: string;
    newRole: string;
  } | null>(null);

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(
        `/api/admin/users/${userId}/status?is_active=${isActive}`,
        { method: "PATCH" }
      );
      if (!res.ok) { throw new Error("Failed to update status"); }
      toast({
        type: "success",
        description: `Node identity ${isActive ? "unlocked" : "locked"} in cluster.`,
      });
      mutateUsers();
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    }
  };

  const initiateRoleUpdate = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setPendingRoleData({ id: userId, newRole });
    setConfirmRoleOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!pendingRoleData) { return false; }
    try {
      const res = await fetch(
        `/api/admin/users/${pendingRoleData.id}/role?role=${pendingRoleData.newRole}`,
        { method: "PATCH" }
      );
      if (!res.ok) { throw new Error("Failed to update role"); }
      toast({
        type: "success",
        description: `Node privilege ${pendingRoleData.newRole === "admin" ? "escalated" : "de-escalated"}.`,
      });
      mutateUsers();
      setConfirmRoleOpen(false);
      setPendingRoleData(null);
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    }
  };

  const openTokenDialog = (userId: string, currentAmount: number) => {
    setTargetUserId(userId);
    setNewTokenAmount(currentAmount.toString());
    setTokenDialogOpen(true);
  };

  const handleTokenUpdate = async () => {
    if (!targetUserId) { return false; }
    const amount = parseInt(newTokenAmount, 10);
    if (isNaN(amount)) {
      toast({ type: "error", description: "Invalid numerical sequence." });
      return false;
    }
    try {
      const res = await fetch(
        `/api/admin/users/${targetUserId}/tokens?amount=${amount}`,
        { method: "PATCH" }
      );
      if (!res.ok) { throw new Error("Synchronization failure."); }
      toast({ type: "success", description: "Token reservoir updated." });
      mutateUsers();
      setTokenDialogOpen(false);
      return true;
    } catch (error: any) {
      toast({ type: "error", description: error.message });
      return false;
    }
  };

  const filteredUsers = users?.filter((u: any) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const isSelf = u.id === session?.user?.id;
    return matchesSearch && !isSelf;
  });

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    filteredUsers,
    tokenDialogOpen,
    setTokenDialogOpen,
    newTokenAmount,
    setNewTokenAmount,
    confirmRoleOpen,
    setConfirmRoleOpen,
    pendingRoleData,
    updateUserStatus,
    initiateRoleUpdate,
    handleRoleUpdate,
    openTokenDialog,
    handleTokenUpdate,
  };
}
