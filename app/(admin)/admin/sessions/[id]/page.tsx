"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { LoaderIcon } from "@/components/chat/icons";
import { useAdminSessionDetail } from "@/hooks/use-admin-session-detail";
import {
  MessageLog,
  SessionHeader,
} from "@/components/admin/session-detail-view";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    session,
    messages,
    isLoading,
    isDeleting,
    handleDelete,
  } = useAdminSessionDetail(id);

  if (isLoading && !session) {
    return (
      <div className="flex justify-center p-20">
        <LoaderIcon className="animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-20 text-center text-red-400 font-mono">
        ERROR: SESSION_NOT_FOUND_IN_REGISTRY
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <Link
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          href="/admin/sessions"
        >
          <ChevronLeftIcon className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Registry
        </Link>
        <div className="px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
          Forensic_Report: {id.slice(0, 8)}
        </div>
      </div>

      <SessionHeader
        isDeleting={isDeleting}
        messagesCount={messages?.length || 0}
        onDelete={handleDelete}
        session={session}
      />

      <MessageLog isLoading={isLoading} messages={messages} />
    </div>
  );
}
