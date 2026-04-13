import { auth } from "@/app/(auth)/auth";
import type { ChatMessage as UIChatMessage } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "chatId required" }, { status: 400 });
  }

  const session = await auth();

  if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
    return Response.json({
      messages: [
        {
          id: "dummy-m1",
          role: "user",
          parts: [{ type: "text", text: "Hello dummy!" }],
          metadata: { createdAt: new Date() },
        },
        {
          id: "dummy-m2",
          role: "assistant",
          parts: [{ type: "text", text: "Hello! I am in dummy mode." }],
          metadata: { createdAt: new Date() },
        },
      ],
      visibility: "private",
      userId: "dummy-user-id",
      isReadonly: false,
    });
  }

  if (!session?.user || !session.user.accessToken) {
    return Response.json({
      messages: [],
      visibility: "private",
      userId: null,
      isReadonly: false,
    });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/sessions/${chatId}/history?limit=100`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 403) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      return Response.json({
        messages: [],
        visibility: "private",
        userId: null,
        isReadonly: false,
      });
    }

    const data = await res.json();
    const backendMessages = data.messages || [];
    const chatSession = data.session;

    const isReadonly = session.user.id !== chatSession.user_id;

    // Convert backend messages to UI messages format
    const uiMessages: UIChatMessage[] = backendMessages.map((msg: any) => {
      let parts: any[] = [];
      const content = msg.content;
      
      if (Array.isArray(content)) {
        parts = content.map((c: any) => {
          if (c.type === "text") return { type: "text", text: c.text };
          if (c.type === "image_url") return { type: "image", image: c.image_url.url };
          return c;
        });
      } else {
        parts = [{ type: "text", text: content || "" }];
      }

      return {
        id: msg.id,
        role: msg.role,
        parts,
        metadata: {
          createdAt: msg.created_at,
          promptTokens: msg.prompt_tokens,
          completionTokens: msg.completion_tokens,
        },
      };
    });

    return Response.json({
      messages: uiMessages,
      visibility: "private", // Backend doesn't support public sessions right now
      userId: chatSession.user_id,
      isReadonly,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return Response.json({ error: "offline" }, { status: 500 });
  }
}
