import type { NextRequest } from "next/server";
import { backendFetch, backendJSON } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";
import type { Chat } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1),
    50
  );
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatbotError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  try {
    const backendSessions = await backendJSON<any[]>("/api/sessions");

    // Map backend SessionResponse → UI Chat format
    const mappedChats: Chat[] = backendSessions
      .map((s) => ({
        id: s.id,
        title: s.title || "New Chat",
        createdAt: new Date(s.created_at),
        userId: s.user_id,
        visibility: "private" as const,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Manual cursor-based pagination
    let paginated = mappedChats;
    if (startingAfter) {
      const idx = paginated.findIndex((c) => c.id === startingAfter);
      if (idx !== -1) { paginated = paginated.slice(idx + 1); }
    } else if (endingBefore) {
      const idx = paginated.findIndex((c) => c.id === endingBefore);
      if (idx !== -1) { paginated = paginated.slice(0, idx); }
    }

    const sliced = paginated.slice(0, limit);
    const hasMore = paginated.length > limit;

    return Response.json({
      chats: sliced,
      hasMore,
      total: mappedChats.length,
    });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error fetching history:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE() {
  try {
    const sessions = await backendJSON<any[]>("/api/sessions");
    await Promise.all(
      sessions.map((s) =>
        backendFetch(`/api/sessions/${s.id}`, {
          method: "DELETE",
          rawOnError: true,
        })
      )
    );
    return Response.json("ok", { status: 200 });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    return new ChatbotError("offline:chat").toResponse();
  }
}
