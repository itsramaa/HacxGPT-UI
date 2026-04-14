import { type ChatModel, chatModels } from "@/lib/ai/models";
import { backendJSON } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-token";
import { ChatbotError } from "@/lib/errors";

const cacheHeaders = { "Cache-Control": "no-cache, must-revalidate" };

export async function GET() {
  const token = await getAccessToken();
  
  if (!token) {
    return Response.json(
      { models: chatModels, capabilities: {} },
      { headers: cacheHeaders }
    );
  }

  try {
    const providers = await backendJSON<any[]>("/api/providers");
    const dynamicModels: ChatModel[] = [];
    const capabilities: Record<string, any> = {};

    for (const p of providers) {
      if (!p.models || !Array.isArray(p.models)) continue;
      
      const hasKey = p.has_key || p.name === "hacxgpt";

      for (const m of p.models) {
        const id = `${p.name}/${m.name}`;
        dynamicModels.push({
          id,
          name: m.alias || m.name,
          providerId: p.id,
          providerName: p.name,
          description: `Model from ${p.name}`,
          hasKey,
        });
        capabilities[id] = {
          tools: true,
          vision:
            id.includes("vision") ||
            id.includes("gpt-4o") ||
            id.includes("claude-3"),
          reasoning:
            id.includes("reasoner") || id.includes("o1") || id.includes("r1"),
        };
      }
    }

    // Merge curated + dynamic, no duplicates
    const curatedIds = new Set(chatModels.map((m) => m.id));
    const mergedModels = [
      ...chatModels,
      ...dynamicModels.filter((m) => !curatedIds.has(m.id)),
    ];

    return Response.json(
      { models: mergedModels, capabilities },
      { headers: cacheHeaders }
    );
  } catch (err) {
    if (err instanceof ChatbotError && err.message.includes("unauthorized")) {
      return Response.json(
        { models: chatModels, capabilities: {} },
        { headers: cacheHeaders }
      );
    }
    console.error("Error fetching models from backend:", err);
    return Response.json(
      { error: "offline", models: chatModels, capabilities: {} },
      { status: 503, headers: cacheHeaders }
    );
  }
}
