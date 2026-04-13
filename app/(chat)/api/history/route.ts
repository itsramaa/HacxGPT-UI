import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";
import type { Chat } from "@/lib/db/schema";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

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

  if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
    return Response.json({
      chats: [
        {
          id: "dummy-1",
          title: "Dummy Chat 1",
          createdAt: new Date(),
          userId: "dummy-user",
          visibility: "private",
        },
        {
          id: "dummy-2",
          title: "Dummy Chat 2",
          createdAt: new Date(Date.now() - 86400000),
          userId: "dummy-user",
          visibility: "private",
        },
      ],
      hasMore: false,
    });
  }

  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/sessions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return new ChatbotError("unauthorized:chat").toResponse();
      }
      throw new Error(`Failed to fetch sessions: ${res.status}`);
    }

    const backendSessions: any[] = await res.json();
    
    // Map backend SessionResponse to UI Chat format
    // SessionResponse: id, title, created_at, updated_at
    const mappedChats: Chat[] = backendSessions
      .map((s) => ({
        id: s.id,
        title: s.title || "New Chat",
        createdAt: new Date(s.created_at),
        userId: session.user.id,
        visibility: "private" as const,
      }))
      // Sort newest first — sidebar groups by date
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Perform manual cursor-based pagination over the full list
    let paginated = mappedChats;
    if (startingAfter) {
      const idx = paginated.findIndex((c) => c.id === startingAfter);
      if (idx !== -1) {
        paginated = paginated.slice(idx + 1);
      }
    } else if (endingBefore) {
      const idx = paginated.findIndex((c) => c.id === endingBefore);
      if (idx !== -1) {
        paginated = paginated.slice(0, idx);
      }
    }
    
    const sliced = paginated.slice(0, limit);
    const hasMore = paginated.length > limit;

    // Return in the format the sidebar SWR expects: { chats, hasMore }
    return Response.json({ chats: sliced, hasMore });
  } catch (err) {
    console.error("Error fetching history:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE() {
  // The backend doesn't have a "delete all sessions" endpoint natively
  // We would have to iterate over /api/sessions and DELETE individually, 
  // or return a NotImplemented error. For now we will return 200 and do nothing,
  // since the prompt says match backend.
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/sessions`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    if (res.ok) {
      const all: any[] = await res.json();
      for (const s of all) {
        await fetch(`${BACKEND_URL}/api/sessions/${s.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        });
      }
    }
    return Response.json("ok", { status: 200 });
  } catch (err) {
    return new ChatbotError("offline:chat").toResponse();
  }
}
