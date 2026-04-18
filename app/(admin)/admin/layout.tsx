"use client";

import {
  BarChart3Icon,
  CpuIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cloneElement, useEffect } from "react";
import useSWR from "swr";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: stats } = useSWR(
    status === "authenticated" ? "/api/admin/stats" : null,
    fetcher
  );

  const { update: updateSessionData } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    // Defensive check: if session says not admin, verify with backend
    if (session?.user && (session.user as any).role !== "admin") {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.role === "admin") {
            // Role was updated in DB but not in session! 
            // Trigger a session refresh with the new data.
            updateSessionData(data);
          } else {
            router.push("/");
          }
        })
        .catch(() => router.push("/"));
    }
  }, [status, session, router, updateSessionData]);

  if (status === "loading") { return null; }

  return (
    <SidebarProvider>
      <AppSidebar user={session?.user} />
      <SidebarInset>
        <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
          <MobileHeader title="Admin Mainframe" />
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-20">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    <ShieldCheckIcon className="size-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      System Mainframe
                    </h1>
                    <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest opacity-70">
                      Privileged Access Level 4
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  color="primary"
                  icon={<UsersIcon />}
                  label="Global Nodes"
                  value={stats?.total_users ?? 0}
                />
                <StatCard
                  color="emerald"
                  icon={<BarChart3Icon />}
                  label="Live Sessions"
                  value={stats?.total_sessions ?? 0}
                />
                <StatCard
                  color="orange"
                  icon={<CpuIcon />}
                  label="Active models"
                  value={stats?.total_models ?? 0}
                />
                <StatCard
                  color="emerald"
                  icon={<SettingsIcon />}
                  label="API Status"
                  value="ONLINE"
                />
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: any = {
    primary: "bg-primary/5 text-primary border-primary/10",
    emerald: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
    orange: "bg-orange-500/5 text-orange-400 border-orange-500/10",
  };
  return (
    <div
      className={`p-4 rounded-2xl border backdrop-blur-sm flex items-center gap-4 ${colorMap[color] || colorMap.primary}`}
    >
      <div className="p-2.5 rounded-xl bg-background/50 border border-border/20">
        {cloneElement(icon, { className: "size-5" })}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-tight">
          {label}
        </span>
        <span className="text-xl font-bold font-mono tracking-tighter">
          {value}
        </span>
      </div>
    </div>
  );
}
