import { auth } from "@/app/(auth)/auth";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { ChatbotError } from "@/lib/errors";
import { generateUUID } from "@/lib/utils";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export const maxDuration = 60;

export async function POST(request: Request) {
  const json = await request.json();
  const { id, message, messages, selectedChatModel, attachment_ids } = json;

  const sessionObj = await auth();
  if (!sessionObj?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const text = "This is a dummy response from HacxGPT. The backend integration is currently bypassed because NEXT_PUBLIC_USE_DUMMY_DATA is set to true. How can I help you today?";
        const words = text.split(" ");
        for (const word of words) {
          writer.write({
            type: "text-delta",
            id: generateUUID(),
            delta: word + " ",
          });
          await new Promise((r) => setTimeout(r, 50));
        }
      },
      generateId: generateUUID,
    });

    return createUIMessageStreamResponse({
      stream,
      headers: { "X-Chat-Id": id || generateUUID() },
    });
  }

  if (!sessionObj.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const token = sessionObj.user.accessToken;
  const authHeader = { Authorization: `Bearer ${token}` };

  // Extract the last user message text
  const currentMessageStr =
    message?.parts?.find((p: any) => p.type === "text")?.text ||
    messages?.at(-1)?.parts?.find((p: any) => p.type === "text")?.text ||
    message?.content ||
    messages?.at(-1)?.content ||
    "";

  // Extract provider from model ID format: "provider/model-name" → "provider"
  // Fall back to "openai" if format doesn't match
  const modelId = selectedChatModel || "openai/gpt-4o";
  const slashIdx = modelId.indexOf("/");
  const providerName = slashIdx > 0 ? modelId.slice(0, slashIdx) : "openai";
  const modelName = slashIdx > 0 ? modelId.slice(slashIdx + 1) : modelId;

  let actualSessionId = id;

  try {
    // 1. Check if backend session exists; create if not
    const checkRes = await fetch(`${BACKEND_URL}/api/sessions/${id}`, {
      headers: authHeader,
    });

    if (!checkRes.ok && checkRes.status === 404) {
      const createRes = await fetch(`${BACKEND_URL}/api/sessions`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Chat",
          provider_name: providerName,   // ← dynamic, not hardcoded
          model_name: modelName,
          system_prompt: null,
        }),
      });
      if (createRes.ok) {
        const createData = await createRes.json();
        actualSessionId = createData.id;
      } else {
        console.error("Failed to create session:", await createRes.text());
        return new ChatbotError("offline:chat").toResponse();
      }
    }

    // 2. Request SSE stream from backend
    // IMPORTANT: override_model must be the raw model name without provider prefix
    // (e.g. "gpt-4o" not "openai/gpt-4o") because the backend sends it directly
    // to the provider's OpenAI-compatible /chat/completions API.
    const streamBody: Record<string, unknown> = {
      session_id: actualSessionId,
      message: currentMessageStr,
      override_model: modelName,
    };

    // Forward attachment IDs if present
    if (Array.isArray(attachment_ids) && attachment_ids.length > 0) {
      streamBody.attachment_ids = attachment_ids;
    }

    const streamRes = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(streamBody),
    });

    if (streamRes.status === 402) {
      return new ChatbotError(
        "offline:chat",
        "AI Gateway requires a valid credit card"
      ).toResponse();
    }

    if (!streamRes.ok) {
      return new ChatbotError("offline:chat").toResponse();
    }

    // 3. Proxy backend SSE → Vercel AI UIMessageStream protocol
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const reader = streamRes.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

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
              if (parsed.error) {
                // Surface backend errors as a text message
                writer.write({
                  type: "text-delta",
                  id: generateUUID(),
                  delta: `\n\n*Error: ${parsed.error}*\n\n`,
                });
              } else if (parsed.tool_call) {
                // Surface tool execution status
                const toolName = parsed.tool_call.replace(/_/g, " ");
                writer.write({
                  type: "text-delta",
                  id: generateUUID(),
                  delta: `\n\n*Executing tool: ${toolName}...*\n\n`,
                });
              } else if (parsed.text) {
                writer.write({
                  type: "text-delta",
                  id: generateUUID(),
                  delta: parsed.text,
                });
              }
            } catch (_) {
              // ignore malformed SSE chunks
            }
          }
        }
      },
      generateId: generateUUID,
    });

    return createUIMessageStreamResponse({
      stream,
      headers: { "X-Chat-Id": actualSessionId },
    });
  } catch (err) {
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

  const sessionObj = await auth();

  if (!sessionObj?.user || !sessionObj.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${sessionObj.user.accessToken}` },
    });

    if (res.ok) {
        return Response.json("ok", { status: 200 });
    }
    return new ChatbotError("offline:chat").toResponse();
  } catch (err) {
      return new ChatbotError("offline:chat").toResponse();
  }
}
