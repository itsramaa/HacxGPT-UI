import { auth } from "@/app/(auth)/auth";
import { backendJSON } from "@/lib/api";
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
            return { type: "image", image: c.image_url.url };
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
