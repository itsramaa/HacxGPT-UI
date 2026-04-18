import { format } from "date-fns";
import {
  CalendarIcon,
  HistoryIcon,
  MailIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { StatCard } from "./stat-card";

export function ProfileHeader({ user, history }: { user: any; history: any }) {
  return (
    <div className="relative overflow-hidden p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-8 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <div className="relative size-32 rounded-[2rem] bg-background/50 border-2 border-primary/20 flex items-center justify-center p-1 shadow-[0_0_30px_rgba(var(--primary),0.1)] transition-transform duration-500 group-hover:scale-105">
        <div className="size-full rounded-[1.8rem] bg-gradient-to-t from-primary/20 to-primary/5 flex items-center justify-center text-primary overflow-hidden relative">
          <UserIcon className="opacity-80" size={64} />
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-background/40 to-transparent" />
        </div>
      </div>
      <div className="flex-1 text-center md:text-left space-y-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground/90">
          {user.full_name || user.username}
        </h1>
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <ShieldCheckIcon size={12} />
            {user.role}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <MailIcon size={14} />
            {user.email}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CalendarIcon size={14} />
            Joined {user.created_at ? format(new Date(user.created_at), "MMM yyyy") : "N/A"}
          </div>
        </div>
      </div>
      <div className="w-full md:w-auto">
        <StatCard
          color="text-amber-400"
          icon={<HistoryIcon size={14} />}
          label="Total Chats"
          value={history?.total?.toString() || "0"}
        />
      </div>
    </div>
  );
}
