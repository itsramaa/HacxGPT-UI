"use client";

import { 
  ShieldCheckIcon, 
  UsersIcon, 
  DatabaseIcon, 
  TerminalIcon,
  ActivityIcon
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function SidebarAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Real-time role check
  const { data: profile } = useSWR("/api/auth/me", (url) => fetch(url).then(res => res.json()));

  if (profile?.role !== "admin") return null;

  const adminItems = [
    {
      title: "Mainframe",
      url: "/admin",
      icon: ShieldCheckIcon,
    },
    {
       title: "Nodes Registry",
       url: "/admin",
       icon: UsersIcon,
    },
    {
        title: "System Logs",
        url: "#",
        icon: TerminalIcon,
        disabled: true,
    }
  ];

  return (
    <SidebarGroup className="mt-4">
      <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-orange-500/70">
        System Control
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {adminItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                className={`transition-all duration-200 ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-orange-500/10 hover:text-orange-400'}`}
                onClick={(e) => {
                    if (item.disabled) {
                        e.preventDefault();
                        return;
                    }
                    router.push(item.url);
                }}
              >
                <div className="flex items-center gap-2">
                   <item.icon className={`size-4 ${pathname === item.url ? 'text-orange-500' : ''}`} />
                   <span className="text-[13px] font-medium">{item.title}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
