"use client";

import {
  ActivityIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  TerminalIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarAdmin() {
  const router = useRouter();
  const pathname = usePathname();

  // Real-time role check
  const { data: profile } = useSWR("/api/auth/me", (url) =>
    fetch(url).then((res) => res.json())
  );

  if (profile?.role !== "admin") { return null; }

  const managementItems = [
    {
      title: "Nodes Registry",
      url: "/admin/users",
      icon: UsersIcon,
    },
    {
      title: "LLM Providers",
      url: "/admin/providers",
      icon: DatabaseIcon,
    },
    {
      title: "System Keys",
      url: "/admin/keys",
      icon: ShieldCheckIcon,
    },
  ];

  const controlItems = [
    {
      title: "System Logs",
      url: "/admin/logs",
      icon: TerminalIcon,
    },
    {
      title: "Observability",
      url: "/admin/sessions",
      icon: ActivityIcon,
    },
  ];

  return (
    <>
      {/* Root Mainframe - Independent */}
      <SidebarGroup className="pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={`h-10 transition-all duration-300 ${pathname === "/admin" ? "bg-orange-500/20 text-orange-500 border border-orange-500/30" : "hover:bg-muted/50"}`}
              isActive={pathname === "/admin"}
              onClick={() => router.push("/admin")}
            >
              <div className="flex items-center gap-3 px-1">
                <ShieldCheckIcon
                  className={`size-5 ${pathname === "/admin" ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : ""}`}
                />
                <span className="text-sm font-black uppercase tracking-tighter">
                  Mainframe
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="mt-2">
        <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-primary/50 px-4">
          Management
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {managementItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  isActive={pathname === item.url}
                  onClick={() => router.push(item.url)}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="size-4" />
                    <span className="text-[13px] font-medium">
                      {item.title}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-4">
          System Control
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {controlItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="transition-all duration-200 hover:bg-muted/50"
                  isActive={pathname === item.url}
                  onClick={() => router.push(item.url)}
                >
                  <div className="flex items-center gap-2">
                    <item.icon
                      className={`size-4 ${pathname === item.url ? "text-orange-500" : ""}`}
                    />
                    <span className="text-[13px] font-medium">
                      {item.title}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
