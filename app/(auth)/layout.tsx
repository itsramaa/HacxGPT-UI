import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { SparklesIcon, VercelIcon } from "@/components/chat/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-screen bg-sidebar">
      <div className="flex w-full flex-col bg-background p-8 xl:w-[600px] xl:shrink-0 xl:rounded-r-2xl xl:border-r xl:border-border/40 md:p-16">
        <Link
          className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          href="/"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={14} />
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="hidden flex-1 flex-col overflow-hidden pl-12 xl:flex">
        <div className="flex items-center gap-1.5 pt-8 text-[13px] text-muted-foreground/50">
          Powered by
          <SparklesIcon size={14} />
          <span className="font-medium text-muted-foreground">Kawasan Digital</span>
        </div>
        <div className="flex-1 pt-4 relative">
          <div className="absolute inset-0 bg-background/50 rounded-tl-[12px] border-t border-l border-border/40 p-10 overflow-hidden shadow-sm">
            <div className="flex flex-col gap-6 opacity-30 pointer-events-none">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0" />
                <div className="flex-1 space-y-2 pt-1.5">
                  <div className="h-4 w-1/3 bg-primary/10 rounded-md" />
                  <div className="h-4 w-1/4 bg-primary/10 rounded-md" />
                </div>
              </div>
              <div className="flex items-start gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
                <div className="flex-1 space-y-2 pt-1.5 flex flex-col items-end">
                  <div className="h-4 w-1/2 bg-secondary rounded-md" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0" />
                <div className="flex-1 space-y-2 pt-1.5">
                  <div className="h-4 w-3/4 bg-primary/10 rounded-md" />
                  <div className="h-4 w-2/3 bg-primary/10 rounded-md" />
                  <div className="h-4 w-1/2 bg-primary/10 rounded-md" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-10 right-10 h-12 bg-secondary/50 rounded-lg border border-border/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
