import { getAllGatewayModels, getCapabilities, isDemo } from "@/lib/ai/models";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
    return Response.json({
      capabilities: {
        "openai/gpt-4o": { tools: true, vision: true, reasoning: false },
        "anthropic/claude-3-5-sonnet": { tools: true, vision: true, reasoning: false },
        "google/gemini-1.5-pro": { tools: true, vision: true, reasoning: false },
      },
      models: [
        { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai", description: "Vibrant and capable" },
        { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", description: "State of the art" },
        { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google", description: "Large context" },
      ],
    }, { headers });
  }

  const curatedCapabilities = await getCapabilities();

  if (isDemo) {
    const models = await getAllGatewayModels();
    const capabilities = Object.fromEntries(
      models.map((m) => [m.id, curatedCapabilities[m.id] ?? m.capabilities])
    );

    return Response.json({ capabilities, models }, { headers });
  }

  return Response.json(curatedCapabilities, { headers });
}
