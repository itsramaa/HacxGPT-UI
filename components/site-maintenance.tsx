"use client";

import { AlertTriangle, RefreshCcw, ShieldAlert, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteMaintenance({ 
  isVerifying, 
  onCheck 
}: { 
  isVerifying?: boolean; 
  onCheck?: () => void; 
}) {
  const handleReload = () => {
    if (onCheck) {
      onCheck();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-4">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 z-[-1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative flex flex-col items-center max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Glow Effect */}
        <div className="absolute -top-20 inset-x-0 h-40 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Icon Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative size-24 rounded-3xl bg-secondary/50 border border-primary/20 flex items-center justify-center shadow-2xl backdrop-blur-xl group">
            <WifiOff className={cn("size-12 text-primary transition-transform", isVerifying ? "animate-spin" : "animate-bounce group-hover:scale-110")} />
            <div className="absolute -top-1 -right-1">
              <span className="flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive" />
              </span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
            SYSTEM {isVerifying ? "VERIFYING" : "OFFLINE"}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {isVerifying ? (
              "Testing neural pathways for stability. Please hold for transmission validation."
            ) : (
              <>
                The neural link to the{" "}
                <span className="text-primary font-mono font-bold tracking-widest text-sm uppercase">
                  HacxGPT-Core
                </span>{" "}
                has been severed.
              </>
            )}
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col items-center gap-2">
            <ShieldAlert className={cn("size-5", isVerifying ? "text-primary animate-pulse" : "text-yellow-500")} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              API Status
            </span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {isVerifying ? "PINGING..." : "DISCONNECTED"}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col items-center gap-2">
            <AlertTriangle className="size-5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Uptime
            </span>
            <span className="text-xs font-mono text-foreground font-semibold">
              {isVerifying ? "STABILIZING" : "DOWN"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-3">
          <Button
            className="w-full h-14 rounded-2xl text-md font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3"
            onClick={handleReload}
            size="lg"
            disabled={isVerifying}
          >
            <RefreshCcw className={cn("size-5", isVerifying && "animate-spin")} />
            {isVerifying ? "Validating Uplink..." : "Re-establish Connection"}
          </Button>

          {!isVerifying && (
            <Button
              className="w-full h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors gap-2"
              onClick={() => window.open("mailto:[EMAIL_ADDRESS]")}
              size="lg"
              variant="ghost"
            >
              Contact Administrator
            </Button>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground/50 uppercase">
          Transmission Interrupted • Error Code: 0xBACKEND_UNREACHABLE
        </p>
      </div>
    </div>
  );
}
