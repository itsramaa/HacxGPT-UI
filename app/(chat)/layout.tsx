import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { ChatShell } from "@/components/chat/shell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      <DataStreamProvider>
        <Suspense fallback={<div className="flex h-dvh bg-sidebar" />}>
          <ChatContainer>{children}</ChatContainer>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

async function ChatContainer({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <SidebarShell session={session}>{children}</SidebarShell>;
}

async function SidebarShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <ActiveChatProvider session={session}>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <Toaster
            key="toaster"
            position="top-center"
            theme="system"
            toastOptions={{
              className:
                "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
            }}
          />
          <Suspense fallback={<div className="flex h-dvh" />} key="shell">
            <ChatShell />
          </Suspense>
          <div className="contents" key="page-children">
            {children}
          </div>
        </SidebarInset>
      </ActiveChatProvider>
    </SidebarProvider>
  );
}
