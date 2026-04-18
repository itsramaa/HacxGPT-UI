import useSWR from "swr";
import { toast } from "sonner";
import { fetcher } from "@/lib/utils";

export function useSettingsProfile() {
  const { data: profile, mutate: mutateProfile, isLoading } = useSWR("/api/auth/me", fetcher);

  const updateLanguagePreference = async (val: string) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_preference: val }),
      });
      if (res.ok) {
        toast.success(`Interface language locked to ${val === "auto" ? "Detect" : val}`);
        mutateProfile();
        return true;
      } else {
        toast.error("Failed to update language mapping.");
        return false;
      }
    } catch (_err) {
      toast.error("Protocol error.");
      return false;
    }
  };

  return {
    profile,
    updateLanguagePreference,
    isLoading,
  };
}
