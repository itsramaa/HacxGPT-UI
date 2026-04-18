import {
  CpuIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onAddModel,
  onEditModel,
  onDeleteModel,
  onToggleModelPublic,
  onToggleModelRecommended,
  onToggleModelFree,
}: {
  provider: any;
  onEdit: (p: any) => void;
  onDelete: (id: string) => void;
  onAddModel: (id: string) => void;
  onEditModel: (m: any) => void;
  onDeleteModel: (id: string) => void;
  onToggleModelPublic: (id: string, currentStatus: boolean) => void;
  onToggleModelRecommended: (id: string, currentStatus: boolean) => void;
  onToggleModelFree: (id: string, currentStatus: boolean) => void;
}) {
  return (
    <div className="bg-card/30 border border-border/40 rounded-3xl p-6 flex flex-col gap-4 shadow-xl hover:shadow-orange-500/5 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
            <GlobeIcon className="size-5" />
          </div>
          <h3 className="font-bold text-lg tracking-tight capitalize">
            {provider.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(provider)}
          >
            <PencilIcon className="size-3.5" />
          </button>
          <button
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-500"
            onClick={() => onDelete(provider.id)}
          >
            <Trash2Icon className="size-3.5" />
          </button>
          <div className="w-px h-4 bg-border/40 mx-1" />
          <button
            className="p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 transition-all text-orange-500"
            onClick={() => onAddModel(provider.id)}
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 font-mono text-[10px] text-muted-foreground bg-muted/10 p-3 rounded-2xl border border-border/10">
        <div className="flex justify-between items-center">
          <span>BASE_URL:</span>
          <span className="text-foreground/80 truncate ml-2">
            {provider.base_url}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-border/5">
          <span>PRIMARY_MODEL:</span>
          <span className="text-primary font-bold ml-2 italic">
            {provider.default_model}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-background/40 border border-border/20">
        <div className="flex items-center gap-2">
          <div
            className={`size-1.5 rounded-full ${provider.has_key ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {provider.has_key ? "Key_Linked" : "No_Secret_Key"}
          </span>
        </div>
        <span className="text-[9px] font-medium text-muted-foreground italic">
          NODE_{provider.id.toString().slice(0, 8)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {provider.models?.map((m: any) => (
          <div
            className={`group/model relative flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${m.is_public ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted/30 border-border/20 text-muted-foreground"}`}
            key={m.id}
          >
            <div
              className="flex items-center gap-2 cursor-pointer flex-1"
              onClick={() => onToggleModelPublic(m.id, m.is_public)}
            >
              <CpuIcon
                className={`size-3 ${m.is_public ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className="truncate max-w-[80px]" title={m.name}>
                {m.alias || m.name}
              </span>
              <div
                className={`size-1.5 rounded-full ${m.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground opacity-30 font-bold font-mono"}`}
              />
            </div>

            <div className="flex items-center ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-all opacity-0 group-hover/model:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-foreground/10 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontalIcon className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-card backdrop-blur-xl border-white/10 rounded-xl p-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50"
                >
                  <DropdownMenuItem
                    className={`flex items-center gap-2 cursor-pointer rounded-lg text-xs font-bold transition-all ${m.is_recommended ? "text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/20" : "text-muted-foreground focus:text-foreground focus:bg-white/5"}`}
                    onClick={() => onToggleModelRecommended(m.id, m.is_recommended)}
                  >
                    <StarIcon className="size-3.5" />
                    {m.is_recommended ? "Remove Recommend" : "Set Recommended"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={`flex items-center gap-2 cursor-pointer rounded-lg text-xs font-bold transition-all ${m.is_free ? "text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/20" : "text-muted-foreground focus:text-foreground focus:bg-white/5"}`}
                    onClick={() => onToggleModelFree(m.id, m.is_free)}
                  >
                    <ZapIcon className="size-3.5" />
                    {m.is_free ? "Set Full Capacity" : "Set Free Engine"}
                  </DropdownMenuItem>

                  <div className="h-px bg-border/50 my-1 -mx-1" />

                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer rounded-lg text-xs font-bold text-muted-foreground focus:text-foreground focus:bg-white/5 transition-all"
                    onClick={() => onEditModel(m)}
                  >
                    <PencilIcon className="size-3.5" />
                    Edit Model
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer rounded-lg text-xs font-bold text-red-500/70 focus:text-red-500 focus:bg-red-500/20 transition-all"
                    onClick={() => onDeleteModel(m.id)}
                  >
                    <Trash2Icon className="size-3.5" />
                    Delete Model
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
