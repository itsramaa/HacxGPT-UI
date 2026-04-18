import {
  ActivityIcon,
  CalendarIcon,
  CpuIcon,
  HashIcon,
  TerminalIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Badge({
  icon,
  label,
  color = "default",
}: {
  icon: React.ReactNode;
  label: string;
  color?: "default" | "primary";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border",
        color === "primary"
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-muted/20 text-muted-foreground border-border/40"
      )}
    >
      {icon}
      {label}
    </div>
  );
}

export function SessionHeader({
  session,
  messagesCount,
  isDeleting,
  onDelete,
}: {
  session: any;
  messagesCount: number;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="p-8 rounded-3xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <ActivityIcon className="size-48" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tighter text-foreground/90">
            {session.title}
          </h1>
          <div className="flex flex-wrap gap-3">
            <Badge
              icon={<UserIcon className="size-3" />}
              label={`Owner: NODE_${session.user_id.slice(0, 8)}`}
            />
            <Badge
              color="primary"
              icon={<CpuIcon className="size-3" />}
              label={`Model: ${session.model_name}`}
            />
            <Badge
              icon={<CalendarIcon className="size-3" />}
              label={`Established: ${new Date(session.created_at).toLocaleString()}`}
            />
            <Badge
              icon={<HashIcon className="size-3" />}
              label={`${messagesCount} Transactions`}
            />
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-black text-[10px] uppercase tracking-widest gap-2 h-10 px-6 rounded-xl"
              disabled={isDeleting || !session.is_active}
              variant="outline"
            >
              <TrashIcon className="size-3.5" />
              {isDeleting
                ? "PURGING..."
                : session.is_active
                  ? "ARCHIVE_SESSION"
                  : "ARCHIVED"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-500 italic uppercase">
                Confirm Context Purge?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This protocol will permanently disrupt this neural session and
                move it to the IDLE state. This action cannot be undone within
                the active registry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted/10">
                SECURE_ABORT
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 text-white font-bold hover:bg-red-600"
                onClick={onDelete}
              >
                EXECUTE_PURGE
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="bg-muted/10 border border-border/10 p-4 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] font-black text-muted-foreground uppercase">
            Provider Infrastructure
          </span>
          <span className="text-sm font-bold text-primary italic uppercase tracking-wider">
            {session.provider?.name || "External_Cluster"}
          </span>
        </div>
        <div className="bg-muted/10 border border-border/10 p-4 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] font-black text-muted-foreground uppercase">
            Registry_Status
          </span>
          <span
            className={cn(
              "text-sm font-bold uppercase",
              session.is_active ? "text-emerald-400" : "text-zinc-500"
            )}
          >
            {session.is_active ? "ACTIVE_STATE" : "ARCHIVED / IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MessageLog({ messages, isLoading }: { messages: any[]; isLoading: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-2">
        <TerminalIcon className="size-4 text-primary" />
        <h2 className="text-xs font-black uppercase tracking-widest">
          Neural Interaction Log
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {messages?.map((msg: any) => (
          <div
            className={cn(
              "p-6 rounded-2xl border transition-all hover:shadow-lg",
              msg.role === "user"
                ? "bg-muted/20 border-border/40 ml-8"
                : "bg-primary/5 border-primary/20 mr-8"
            )}
            key={msg.id}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                  msg.role === "user"
                    ? "bg-muted/20 text-muted-foreground"
                    : "bg-primary/20 text-primary"
                )}
              >
                {msg.role === "user" ? "NODE_INPUT" : "MODELS_RESPONSE"}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground opacity-50">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
              {msg.content}
            </div>
            {msg.total_tokens && (
              <div className="mt-4 pt-4 border-t border-border/10 flex gap-4 text-[10px] font-mono text-muted-foreground opacity-60">
                <span>PROMPT: {msg.prompt_tokens}</span>
                <span>COMPLETION: {msg.completion_tokens}</span>
                <span className="text-primary font-bold">
                  TOTAL: {msg.total_tokens}
                </span>
              </div>
            )}
          </div>
        ))}

        {(!messages || messages.length === 0) && !isLoading && (
          <div className="p-12 text-center bg-muted/5 border border-dashed border-border/20 rounded-3xl text-muted-foreground italic text-sm">
            Buffer stream empty. No neural interactions recorded for this
            session.
          </div>
        )}
      </div>
    </div>
  );
}
