import { type ChatModel, chatModels } from "@/lib/ai/models";
import { publicFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-token";

const cacheHeaders = { "Cache-Control": "no-cache, must-revalidate" };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const size = parseInt(searchParams.get("size") || "200");

  const token = await getAccessToken();

  try {
    // Forward params to backend
    const qs = new URLSearchParams();
    if (q) { qs.set("q", q); }
    qs.set("page", page.toString());
    qs.set("size", size.toString());

    const res = await publicFetch(`/api/providers?${qs.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const paginated = (await res.json()) as any;
    const providers = paginated.items || [];

    const dynamicModels: ChatModel[] = [];
    const capabilities: Record<string, any> = {};

    for (const p of providers) {
      if (!p.models || !Array.isArray(p.models)) { continue; }

      const hasKeyAvailable = token
        ? p.has_key || p.has_public_key
        : p.has_public_key;

      for (const m of p.models) {
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
          isFree: m.is_free,
          isRecommended: m.is_recommended,
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

    // Merge curated + dynamic
    let mergedModels = [...dynamicModels];
    
    // If not searching, merge with curated (curated are usually high priority)
    if (!q || q.length < 2) {
      const curatedIds = new Set(chatModels.map((m) => m.id));
      mergedModels = [
        ...chatModels,
        ...dynamicModels.filter((m) => !curatedIds.has(m.id)),
      ];
    } else {
      // If searching, keep dynamic models that matched from backend
      // and maybe some curated that match locally
      const curatedMatch = chatModels.filter(m => m.name.toLowerCase().includes(q.toLowerCase()) || m.id.toLowerCase().includes(q.toLowerCase()));
      const dynamicFiltered = dynamicModels.filter(m => !curatedMatch.some(cm => cm.id === m.id));
      mergedModels = [...curatedMatch, ...dynamicFiltered];
    }

    if (!token) {
      mergedModels = mergedModels.filter((m) => m.hasKey);
    }

    return Response.json(
      { 
        models: mergedModels, 
        capabilities,
        total: paginated.total || mergedModels.length,
        page,
        size
      },
      { headers: cacheHeaders }
    );
  } catch (err) {
    console.error("Backend providers fetch failed:", err);
    return Response.json(
      { error: "Failed to fetch models from backend" },
      { status: 503, headers: cacheHeaders }
    );
  }
}
