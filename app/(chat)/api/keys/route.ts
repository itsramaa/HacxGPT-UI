import { backendFetch, backendJSON, publicFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

export async function GET() {
  try {
    const keys = await backendJSON("/api/keys");
    return Response.json(keys);
  } catch (err) {
    // If unauthorized, fallback to demo/public keys
    if (err instanceof ChatbotError && err.type === "unauthorized") {
      try {
        const res = await publicFetch("/api/keys/demo");
        if (!res.ok) return Response.json([]);
        const demoKeys = await res.json();
        return Response.json(demoKeys);
      } catch (demoErr) {
        return Response.json([]);
      }
    }
    if (err instanceof ChatbotError) return err.toResponse();
    console.error("Error fetching keys:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch("/api/keys", {
      method: "POST",
      body: JSON.stringify(body),
      rawOnError: true,
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    console.error("Error upserting key:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return Response.json({ error: "id required" }, { status: 400 });

    const body = await request.json();
    const res = await backendFetch(`/api/keys/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      rawOnError: true,
    });

    return Response.json(await res.json(), { status: res.status });
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    // Single delete via path or param
    if (id) {
       const res = await backendFetch(`/api/keys/${id}`, {
         method: "DELETE",
         rawOnError: true,
       });
       if (!res.ok) return Response.json(await res.json(), { status: res.status });
       return Response.json({ message: "deleted" });
    }

    // Bulk delete or Purge all
    let body = undefined;
    try {
      body = await request.json();
    } catch (e) {}

    const queryString = all ? "?all=true" : "";
    const res = await backendFetch(`/api/keys${queryString}`, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
      rawOnError: true,
    });

    if (!res.ok) {
      const errData = await res.json();
      return Response.json(errData, { status: res.status });
    }
    
    return Response.json(await res.json());
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    console.error("Error deleting keys:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}
