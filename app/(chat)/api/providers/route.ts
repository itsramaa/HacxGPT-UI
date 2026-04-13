import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  const session = await auth();

  if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
    return Response.json([
      { id: "openai", name: "OpenAI" },
      { id: "anthropic", name: "Anthropic" },
      { id: "google", name: "Google" },
    ]);
  }

  if (!session?.user || !session.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/providers`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch providers: ${res.status}`);
    }

    const providers = await res.json();
    return Response.json(providers);
  } catch (err) {
    console.error("Error fetching providers:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}
