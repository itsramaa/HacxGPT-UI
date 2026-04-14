import { type ChatModel, chatModels } from "@/lib/ai/models";
import { publicFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-token";

const cacheHeaders = { "Cache-Control": "no-cache, must-revalidate" };

export async function GET() {
  const token = await getAccessToken();

  try {
    // Use publicFetch to avoid auto-auth throw for guests
    const res = await publicFetch("/api/providers", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const providers = (await res.json()) as any[];

    const dynamicModels: ChatModel[] = [];
    const capabilities: Record<string, any> = {};

    for (const p of providers) {
      if (!p.models || !Array.isArray(p.models)) { continue; }

      // Determine if a key is available specifically for this request context
      const hasKeyAvailable = token
        ? p.has_key || p.has_public_key
        : p.has_public_key;

      for (const m of p.models) {
        // Guests should only see models that are both public AND have a key
        const modelHasKey = token
          ? hasKeyAvailable || m.is_public
          : p.has_public_key && m.is_public;

        const id = `${p.name}/${m.name}`;
        dynamicModels.push({
          id,
          name: m.alias || m.name,
          providerId: p.id,
          providerName: p.name,
          description: `Model from ${p.name}`,
          hasKey: modelHasKey,
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
    let mergedModels = [
      ...chatModels,
      ...dynamicModels.filter((m) => !curatedIds.has(m.id)),
    ];

    // Filter out unusable models for guests (don't show what they can't use)
    if (!token) {
      mergedModels = mergedModels.filter((m) => m.hasKey);
    }

    return Response.json(
      { models: mergedModels, capabilities },
      { headers: cacheHeaders }
    );
  } catch (err) {
    console.warn(
      "Backend providers fetch failed or restricted, falling back to curated list.",
      err
    );
    return Response.json(
      { models: chatModels, capabilities: {} },
      { headers: cacheHeaders }
    );
  }
}
