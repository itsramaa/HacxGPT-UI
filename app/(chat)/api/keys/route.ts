import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  const session = await auth();

  if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
    return Response.json([
      { provider: "openai", key_preview: "sk-...", is_active: true },
      { provider: "anthropic", key_preview: "sk-ant-... ", is_active: false },
    ]);
  }

  if (!session?.user || !session.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/keys`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch keys: ${res.status}`);
    }

    const keys = await res.json();
    return Response.json(keys);
  } catch (err) {
    console.error("Error fetching keys:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !session.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return Response.json(errorData, { status: res.status });
    }

    const key = await res.json();
    return Response.json(key);
  } catch (err) {
    console.error("Error upserting key:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || !session.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    if (!provider) return Response.json({ error: "provider required" }, { status: 400 });

    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/keys/${provider}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return Response.json(await res.json(), { status: res.status });
    }

    return Response.json(await res.json());
  } catch (err) {
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || !session.user.accessToken) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    if (!provider) return Response.json({ error: "provider required" }, { status: 400 });

    const res = await fetch(`${BACKEND_URL}/api/keys/${provider}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!res.ok) {
      return Response.json(await res.json(), { status: res.status });
    }

    return Response.json({ message: "deleted" });
  } catch (err) {
    return new ChatbotError("offline:chat").toResponse();
  }
}
