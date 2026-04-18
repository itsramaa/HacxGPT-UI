import { LoaderIcon } from "@/components/chat/icons";
import { SearchIcon, ZapIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModelHubConfig({
  catalog,
  isLoading,
  hubSearchQuery,
  setHubSearchQuery,
  hubPage,
  setHubPage,
  totalPages,
  modelPages,
  setModelPages,
  disabledProviders,
  disabledModels,
  toggleProviderVisibility,
  toggleModelVisibility,
  onSave,
  isUpdating,
}: {
  catalog: any[];
  isLoading: boolean;
  hubSearchQuery: string;
  setHubSearchQuery: (v: string) => void;
  hubPage: number;
  setHubPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  modelPages: Record<string, number>;
  setModelPages: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  disabledProviders: string[];
  disabledModels: string[];
  toggleProviderVisibility: (id: string) => void;
  toggleModelVisibility: (id: string) => void;
  onSave: () => void;
  isUpdating: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 text-primary">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <ZapIcon size={16} />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Model Hub Preferences
        </h2>
      </div>

      <Card className="border-border/30 bg-card/40 backdrop-blur-md rounded-[1.5rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase">
            Visibility Control
          </CardTitle>
          <CardDescription className="text-xs">
            Deactivate providers or specific models that you don't use to
            declutter your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <input
                className="w-full text-sm bg-background/50 border border-border/50 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-primary/50 text-foreground placeholder-muted-foreground/50 transition-colors"
                onChange={(e) => setHubSearchQuery(e.target.value)}
                placeholder="Search providers or models..."
                type="text"
                value={hubSearchQuery}
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                className="h-8 border-border/40"
                disabled={hubPage === 1}
                onClick={() => setHubPage((p) => p - 1)}
                size="sm"
                variant="outline"
              >
                Prev
              </Button>
              <span className="text-xs text-muted-foreground font-mono">
                {hubPage} / {totalPages}
              </span>
              <Button
                className="h-8 border-border/40"
                disabled={hubPage >= totalPages}
                onClick={() => setHubPage((p) => p + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoaderIcon className="animate-spin" />
            </div>
          ) : catalog.length === 0 ? (
            <div className="flex justify-center p-8 text-sm text-muted-foreground font-medium">
              No results found.
            </div>
          ) : (
            <div className="grid gap-4">
              {catalog?.map((p: any) => {
                if (!p) return null;
                const currentPage = modelPages[p.id] || 1;
                const MODELS_PER_PAGE = 12;
                const totalModelPages = Math.max(
                  1,
                  Math.ceil((p.models?.length || 0) / MODELS_PER_PAGE)
                );
                const paginatedModels = (p.models || []).slice(
                  (currentPage - 1) * MODELS_PER_PAGE,
                  currentPage * MODELS_PER_PAGE
                );

                return (
                  <div
                    className="p-4 rounded-2xl border border-border/20 bg-background/20 space-y-4"
                    key={p.id}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-2 rounded-full",
                            !disabledProviders.includes(p.id)
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              : "bg-muted-foreground/30"
                          )}
                        />
                        <span className="font-bold text-sm tracking-tight capitalize">
                          {p.name}
                        </span>
                      </div>
                      <Button
                        className={cn(
                          "h-7 text-[10px] font-black",
                          !disabledProviders.includes(p.id)
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                        onClick={() => toggleProviderVisibility(p.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {!disabledProviders.includes(p.id)
                          ? "ENABLED"
                          : "DISABLED"}
                      </Button>
                    </div>

                    {!disabledProviders.includes(p.id) && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-5 pt-2 border-l border-border/10 ml-1">
                          {paginatedModels.map((m: any) => {
                            if (!m) return null;
                            return (
                              <div
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer",
                                  !disabledModels.includes(m.id)
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-muted/10 border-border/10 opacity-50"
                              )}
                              key={m.id}
                              onClick={() => toggleModelVisibility(m.id)}
                            >
                              <span className="text-[10px] font-medium truncate">
                                {m.alias || m.name}
                              </span>
                              <div
                                className={cn(
                                  "size-3 rounded-md border flex items-center justify-center transition-all",
                                  !disabledModels.includes(m.id)
                                    ? "bg-primary border-primary text-white"
                                    : "border-border/40"
                                )}
                              >
                                {!disabledModels.includes(m.id) && (
                                  <div className="size-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />
                                )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {totalModelPages > 1 && (
                          <div className="flex justify-end items-center gap-2 pr-2">
                            <Button
                              className="h-6 px-2 text-[10px] hover:bg-white/5"
                              disabled={currentPage === 1}
                              onClick={() =>
                                setModelPages((prev) => ({
                                  ...prev,
                                  [p.id]: currentPage - 1,
                                }))
                              }
                              size="sm"
                              variant="ghost"
                            >
                              Prev
                            </Button>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {currentPage} / {totalModelPages}
                            </span>
                            <Button
                              className="h-6 px-2 text-[10px] hover:bg-white/5"
                              disabled={currentPage >= totalModelPages}
                              onClick={() =>
                                setModelPages((prev) => ({
                                  ...prev,
                                  [p.id]: currentPage + 1,
                                }))
                              }
                              size="sm"
                              variant="ghost"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-border/10 flex justify-end">
            <Button
              className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-6 shadow-lg shadow-primary/20"
              disabled={isUpdating}
              onClick={onSave}
            >
              {isUpdating ? (
                <LoaderIcon className="animate-spin mr-2" />
              ) : (
                <ZapIcon className="mr-2" size={14} />
              )}
              SAVE_VISIBILITY_STATE
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
