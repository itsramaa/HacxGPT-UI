import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "primary" | "orange" | "emerald";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <div className="p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl flex items-center justify-between shadow-lg group hover:border-primary/30 transition-all">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {label}
        </span>
        <span className="text-2xl font-black tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
      <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
}

export function HealthBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "primary" | "orange" | "emerald";
}) {
  const colorClasses = {
    primary: "bg-primary shadow-[0_0_10px_rgba(249,115,22,0.3)]",
    orange: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]",
    emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-muted-foreground uppercase tracking-tighter">
          {label}
        </span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colorClasses[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
