"use client";

import {
  ChevronUp,
  MessageSquareIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { emailToHue } from "@/lib/utils";
import { useProfilePortal } from "@/hooks/use-profile-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LoaderIcon } from "@/components/chat/icons";
import { toast } from "@/components/toast";

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  const { user: profile } = useProfilePortal();

  const displayUsage = profile?.total_usage ?? session?.user?.total_usage;

  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin");

  const [open, setOpen] = useState(false);

  // Close when pathname changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={setOpen} open={open}>
          <DropdownMenuTrigger asChild>
            {status === "loading" ? (
              <SidebarMenuButton className="h-10 justify-between rounded-lg bg-transparent text-sidebar-foreground/50 transition-colors duration-150 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row items-center gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-sidebar-foreground/10" />
                  <span className="animate-pulse rounded-md bg-sidebar-foreground/10 text-transparent text-[13px]">
                    Loading...
                  </span>
                </div>
                <div className="animate-spin text-sidebar-foreground/50">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 px-3 rounded-xl bg-muted/20 text-sidebar-foreground transition-all duration-200 hover:bg-muted/40 hover:text-primary data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-border/10 hover:border-border/40"
                data-testid="user-nav-button"
              >
                <div
                  className="size-6 shrink-0 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.35 0.08 ${emailToHue(user.email ?? "")}), oklch(0.25 0.05 ${emailToHue(user.email ?? "") + 40}))`,
                  }}
                />
                <span
                  className="truncate text-sm font-medium ml-1"
                  data-testid="user-email"
                >
                  {user?.email}
                </span>
                <ChevronUp className="ml-auto size-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width) rounded-lg border border-border/60 bg-card/95 backdrop-blur-xl shadow-[var(--shadow-float)]"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer text-[13px] font-medium border-b border-border/20 rounded-b-none py-2"
              onSelect={() => router.push("/profile")}
            >
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
                  P
                </div>
                Profile
              </div>
            </DropdownMenuItem>

            {profile?.role === "admin" && (
              <DropdownMenuItem
                className={`cursor-pointer text-[13px] font-semibold py-2 border-b border-border/20 rounded-none ${isAdminPath ? "text-primary" : "text-orange-400"}`}
                onSelect={() => router.push(isAdminPath ? "/" : "/admin")}
              >
                <div className="flex items-center gap-2">
                  {isAdminPath ? (
                    <MessageSquareIcon className="size-4" />
                  ) : (
                    <ShieldCheckIcon className="size-4" />
                  )}
                  {isAdminPath ? "Back to Chat" : "Admin Dashboard"}
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="cursor-pointer text-[13px] flex items-center justify-between"
              onSelect={() =>
                setTheme(resolvedTheme === "light" ? "dark" : "light")
              }
            >
              <div className="flex items-center gap-2">
                {resolvedTheme === "light" ? (
                  <MoonIcon className="size-4" />
                ) : (
                  <SunIcon className="size-4" />
                )}
                Appearance
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-mono opacity-50">
                {resolvedTheme === "light" ? "Dark" : "Light"}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {displayUsage !== undefined && (
              <>
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Total Usage: {displayUsage.toLocaleString()} tokens
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              onSelect={() => router.push("/settings")}
            >
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer text-[13px]"
                onClick={() => {
                  if (status === "loading") {
                    toast({
                      type: "error",
                      description:
                        "Checking authentication status, please try again!",
                    });

                    return;
                  }

                  signOut({
                    redirectTo: "/",
                  });
                }}
                type="button"
              >
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
