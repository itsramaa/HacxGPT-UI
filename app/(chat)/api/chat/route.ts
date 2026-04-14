import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { auth } from "@/app/(auth)/auth";
import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(request: Request) {
  const json = await request.json();
  const { id, message, messages, selectedChatModel, attachment_ids } = json;

  // Verify NextAuth session (ensure user is logged in)
  const sessionObj = await auth();
  if (!sessionObj?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  // Extract message text
  const currentMessageStr =
    message?.parts?.find((p: any) => p.type === "text")?.text ||
    messages?.at(-1)?.parts?.find((p: any) => p.type === "text")?.text ||
    message?.content ||
    messages?.at(-1)?.content ||
    "";

  // 1. Resolve Provider and Model
  const modelId = selectedChatModel || "hacxgpt/hacxgpt-lightning";
  const slashIdx = modelId.indexOf("/");
  const providerKey = slashIdx > 0 ? modelId.slice(0, slashIdx) : "hacxgpt";
  const modelName = slashIdx > 0 ? modelId.slice(slashIdx + 1) : modelId;

  let providerId = "";
  try {
    const providersRes = await backendFetch("/api/providers");
    if (providersRes.ok) {
      const providers = await providersRes.json();
      // Match by name or ID (fallback to first provider if nothing matches)
      const match = providers.find((p: any) => p.name === providerKey || p.id === providerKey);
      providerId = match?.id || providers[0]?.id;
    }
  } catch (err) {
    console.warn("Failed to fetch providers for resolution", err);
  }

  let actualSessionId = id;

  try {
    // 2. Ensure backend session exists
    const checkRes = await backendFetch(`/api/sessions/${id}`, {
      rawOnError: true,
    });

    let wasNewChat = false;

    if (!checkRes.ok && checkRes.status === 404) {
      if (!providerId) {
        return new ChatbotError("offline:chat", "No valid provider found").toResponse();
      }

      const createRes = await backendFetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          id: id,
          title: "New Chat",
          provider_id: providerId,
          model_name: modelName,
          system_prompt: null,
        }),
      });
      if (createRes.ok) {
        const createData = await createRes.json();
        actualSessionId = createData.id;
        wasNewChat = true;
      } else {
        console.error("Failed to create session:", await createRes.text());
        return new ChatbotError("offline:chat").toResponse();
      }
    }

    // 2. Request SSE stream from backend
    const streamBody: Record<string, unknown> = {
      session_id: actualSessionId,
      message: currentMessageStr,
      override_model: modelName,
    };

    if (Array.isArray(attachment_ids) && attachment_ids.length > 0) {
      streamBody.attachment_ids = attachment_ids;
    }

    const streamRes = await backendFetch("/api/chat/stream", {
      method: "POST",
      body: JSON.stringify(streamBody),
      rawOnError: true,
    });

    if (streamRes.status === 402) {
      return new ChatbotError(
        "offline:chat",
        "AI Gateway requires a valid credit card"
      ).toResponse();
    }

    if (streamRes.status === 429) {
        if (wasNewChat) {
            backendFetch(`/api/sessions/${actualSessionId}`, { method: "DELETE" }).catch(() => {});
        }
        return new ChatbotError("rate_limit:chat").toResponse();
    }

    if (!streamRes.status || !streamRes.ok) {
      if (wasNewChat) {
        backendFetch(`/api/sessions/${actualSessionId}`, { method: "DELETE" }).catch(() => {});
      }
      return new ChatbotError("offline:chat").toResponse();
    }

    // 3. Proxy backend SSE → Vercel AI UIMessageStream protocol
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const reader = streamRes.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";
        const textPartId = generateUUID();
        let textStarted = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              if (!part.startsWith("data: ")) continue;
              const dataStr = part.slice(6).trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);

                // Initialize text part if anything needs to be shown
                if (!textStarted && (parsed.error || parsed.tool_call || parsed.text)) {
                   writer.write({
                     type: "text-start",
                     id: textPartId,
                   });
                   textStarted = true;
                }

                if (parsed.error) {
                  writer.write({
                    type: "text-delta",
                    id: textPartId,
                    delta: `\n\n*Error: ${parsed.error}*\n\n`,
                  });
                } else if (parsed.tool_call) {
                  writer.write({
                    type: "data-tool-call",
                    data: parsed.tool_call as string,
                  });
                } else if (parsed.text) {
                  writer.write({
                    type: "text-delta",
                    id: textPartId,
                    delta: parsed.text,
                  });
                }
              } catch (_) {
                // ignore malformed SSE chunks
              }
            }
          }

          // Proactively trigger title generation for new chats
          if (wasNewChat) {
            backendFetch(`/api/chat/${actualSessionId}/generate-title`, {
              method: "POST",
            }).catch((err) => {
              console.error("Failed to trigger title generation:", err);
            });
          }
      },
      generateId: generateUUID,
    });

    return createUIMessageStreamResponse({
      stream,
      headers: { "X-Chat-Id": actualSessionId },
    });
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    console.error("Error in chat proxy:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const res = await backendFetch(`/api/sessions/${id}`, {
      method: "DELETE",
      rawOnError: true,
    });

    if (res.ok) {
      return Response.json("ok", { status: 200 });
    }
    return new ChatbotError("offline:chat").toResponse();
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    return new ChatbotError("offline:chat").toResponse();
  }
}
