"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    ActivityIcon,
    ExternalLinkIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "lucide-react";
import { LoaderIcon } from "@/components/chat/icons";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SessionsAdminPage() {
    const [page, setPage] = useState(1);
    const size = 10;

    const { data, isLoading } = useSWR(
        `/api/admin/sessions?page=${page}&size=${size}`,
        fetcher
    );

    const sessions = data?.items || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / size);

    if (isLoading && !data) return <div className="flex justify-center p-20"><LoaderIcon className="animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <ActivityIcon className="size-5 text-primary" />
                <h2 className="text-xl font-bold">Global Observability</h2>
            </div>

            <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/30 shadow-2xl backdrop-blur-md">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Context_Registry</th>
                            <th className="px-6 py-4">Owner_Node</th>
                            <th className="px-6 py-4">Operational_Protocol</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Sync_Timeline</th>
                            <th className="px-6 py-4 text-right">Access</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                        {sessions?.map((s: any) => (
                            <tr key={s.id} className="hover:bg-primary/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground/90 truncate max-w-[200px]">{s.title}</span>
                                        <span className="text-[9px] text-muted-foreground font-mono opacity-50 uppercase tracking-tighter shrink-0">{s.id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-mono text-muted-foreground/80 border border-border/20 px-2 py-0.5 rounded bg-muted/5">
                                        NODE_{s.user_id.toString().slice(0, 8)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black font-mono uppercase text-primary">
                                            {s.provider?.name || 'EXTERNAL'}_{s.model_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black border ${s.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                                        <div className={`size-1 rounded-full ${s.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                                        {s.is_active ? 'LIVE' : 'IDLE'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-[10px] text-muted-foreground font-mono text-center">
                                    <div className="flex flex-col">
                                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                                        <span className="opacity-40 italic text-[9px]">Last: {new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/admin/sessions/${s.id}`} className="flex justify-center">
                                        <ExternalLinkIcon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t border-border/10">
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                        Page {page} of {totalPages || 1} <span className="opacity-40">({total} items tracked)</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronLeftIcon className="size-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronRightIcon className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
