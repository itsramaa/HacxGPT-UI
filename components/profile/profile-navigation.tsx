import { motion } from "framer-motion";
import { ShieldCheckIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all relative overflow-hidden group",
        active
          ? "bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary),0.2)]"
          : "text-muted-foreground hover:bg-white/5"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "transition-colors",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {icon}
      </div>
      {label}
      {active && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 rounded-l-full"
          layoutId="nav-glow"
        />
      )}
    </button>
  );
}

export function ProfileNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: "identity" | "security";
  onTabChange: (tab: "identity" | "security") => void;
}) {
  return (
    <aside className="space-y-6">
      <nav className="flex flex-col gap-1.5">
        <NavButton
          active={activeTab === "identity"}
          icon={<UserIcon size={18} />}
          label="Identity"
          onClick={() => onTabChange("identity")}
        />
        <NavButton
          active={activeTab === "security"}
          icon={<ShieldCheckIcon size={18} />}
          label="Security"
          onClick={() => onTabChange("security")}
        />
      </nav>

      <Separator className="bg-border/20" />

      <div className="p-5 rounded-2xl border border-border/20 bg-card/40 space-y-3 relative overflow-hidden group">
        <p className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">
          Account Status
        </p>
        <h3 className="text-xl font-black text-emerald-400">VERIFIED</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your account is fully synchronized with AI providers.
        </p>
      </div>
    </aside>
  );
}
