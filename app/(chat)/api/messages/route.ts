import { auth } from "@/lib/auth/auth";
import { backendFetch, backendJSON } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage as UIChatMessage } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "chatId required" }, { status: 400 });
  }

  const session = await auth();

  // No backend token → return empty state (not an error, just unauthenticated)
  if (!session?.user || !session.user.accessToken) {
    return Response.json({
      messages: [],
      visibility: "private",
      userId: null,
      isReadonly: false,
    });
  }

  try {
    const data = await backendJSON<any>(
      `/api/sessions/${chatId}/history?limit=100`
    );

    const backendMessages: any[] = data.messages || [];
    const chatSession = data.session;
    const isReadonly = chatSession
      ? session.user.id !== chatSession.user_id
      : true;
    const sessionUserId = chatSession?.user_id || null;
    const fullModelId =
      chatSession?.provider?.name && chatSession?.model_name
        ? `${chatSession.provider.name}/${chatSession.model_name}`
        : null;

    const uiMessages: UIChatMessage[] = backendMessages.map((msg: any) => {
      const content = msg.content;
      let parts: any[];

      if (Array.isArray(content)) {
        parts = content.map((c: any) => {
          if (c.type === "text") { return { type: "text", text: c.text }; }
          if (c.type === "image_url") {
            return {
              type: "file",
              url: c.image_url.url,
              name: "Image",
              mediaType: "image/png",
            };
          }
          return c;
        });
      } else {
        parts = [{ type: "text", text: content || "" }];
      }

      return {
        id: msg.id,
        role: msg.role,
        parts,
        createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
        metadata: {
          createdAt: msg.created_at,
          promptTokens: msg.prompt_tokens,
          completionTokens: msg.completion_tokens,
          totalTokens: msg.total_tokens,
          parentId: msg.parent_id,
          version: msg.version,
        },
      };
    });

    return Response.json({
      messages: uiMessages,
      visibility: "private",
      userId: sessionUserId,
      isReadonly,
      modelId: fullModelId,
      activeVersions: chatSession?.active_versions || {},
    });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error fetching messages:", err);
    return Response.json({ error: "offline" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "chatId required" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const res = await backendFetch(`/api/sessions/${chatId}/history`, {
      method: "DELETE",
      rawOnError: true,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to clear history" }));
      return Response.json(errorData, { status: res.status });
    }

    return Response.json({ message: "history cleared" });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error clearing history:", err);
    return Response.json({ error: "offline" }, { status: 500 });
  }
}
