import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { fetcher } from "@/lib/utils";

export function useSettingsConfig() {
  const { data: providersData, isLoading: providersLoading, mutate: mutateProviders } = useSWR<any>(
    "/api/providers",
    fetcher
  );

  const { data: modelsData } = useSWR("/api/models", fetcher, {
    dedupingInterval: 3600000,
    revalidateOnFocus: false,
  });

  // Model Hub Pagination & Search
  const [modelPages, setModelPages] = useState<Record<string, number>>({});
  const [hubSearchQuery, setHubSearchQuery] = useState("");
  const [hubDebouncedQuery, setHubDebouncedQuery] = useState("");
  const [hubPage, setHubPage] = useState(1);
  const HUB_ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHubDebouncedQuery(hubSearchQuery);
      setHubPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [hubSearchQuery]);

  const { data: catalogData, isLoading: catalogLoading } = useSWR<any>(
    `/api/providers?all=true&page=${hubPage}&size=${HUB_ITEMS_PER_PAGE}&q=${encodeURIComponent(hubDebouncedQuery)}`,
    fetcher
  );

  const { data: preferences, mutate: mutatePrefs } = useSWR(
    "/api/providers/preferences",
    fetcher
  );

  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [disabledProviders, setDisabledProviders] = useState<string[]>([]);
  const [disabledModels, setDisabledModels] = useState<string[]>([]);

  const hasSyncedPrefs = useRef(false);
  useEffect(() => {
    if (preferences && !hasSyncedPrefs.current) {
      setDisabledProviders(preferences.disabled_provider_ids || []);
      setDisabledModels(preferences.disabled_model_ids || []);
      hasSyncedPrefs.current = true;
    }
  }, [preferences]);

  const savePreferences = async () => {
    setIsUpdatingPrefs(true);
    try {
      const res = await fetch("/api/providers/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disabled_provider_ids: disabledProviders,
          disabled_model_ids: disabledModels,
        }),
      });
      if (res.ok) {
        toast.success("Model Hub visibility updated.");
        mutatePrefs();
        mutateProviders();
      } else {
        toast.error("Failed to update preferences.");
      }
    } catch (_err) {
      toast.error("Sync failed.");
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const toggleProviderVisibility = (id: string) => {
    setDisabledProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleModelVisibility = (id: string) => {
    setDisabledModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return {
    providers: Array.isArray(providersData?.items) ? providersData.items : Array.isArray(providersData) ? providersData : [],
    providersLoading,
    models: modelsData?.models || [],
    catalog: Array.isArray(catalogData?.items) ? catalogData.items : Array.isArray(catalogData) ? catalogData : [],
    catalogLoading,
    catalogTotal: catalogData?.total || 0,
    hubPage,
    setHubPage,
    modelPages,
    setModelPages,
    hubSearchQuery,
    setHubSearchQuery,
    isUpdatingPrefs,
    disabledProviders,
    disabledModels,
    savePreferences,
    toggleProviderVisibility,
    toggleModelVisibility,
    hubItemsPerPage: HUB_ITEMS_PER_PAGE,
  };
}
