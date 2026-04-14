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

  // NOTE: Do NOT hard redirect("/login") here — that creates a loop with middleware.
  // Middleware already guards unauthenticated routes. The only case we reach here
  // without a session is if the backend is temporarily unavailable (auth() fails
  // to validate the token). In that case, show a fallback instead of looping.
  if (!session?.user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-sidebar">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Session could not be loaded. Please{" "}
            <a className="underline" href="/login">
              sign in again
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

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
      <ActiveChatProvider>
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
