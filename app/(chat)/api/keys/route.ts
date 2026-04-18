import { backendFetch, backendJSON, publicFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";
import { keySchema, keyBulkDeleteSchema } from "./schema";

/**
 * GET /api/keys
 * Fetches all keys for the current user. Fallbacks to demo keys for guests.
 */
export async function GET() {
  try {
    const keys = await backendJSON("/api/keys");
    return Response.json(keys);
  } catch (err) {
    if (err instanceof ChatbotError && err.type === "unauthorized") {
      try {
        const res = await publicFetch("/api/keys/demo");
        if (!res.ok) { return Response.json([]); }
        return Response.json(await res.json());
      } catch {
        return Response.json([]);
      }
    }
    if (err instanceof ChatbotError) { return err.toResponse(); }
    return new ChatbotError("offline:chat").toResponse();
  }
}

/**
 * POST /api/keys
 * Creates a new API key. validated by keySchema.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = keySchema.safeParse(json);

    if (!result.success) {
      return Response.json({ error: "Invalid key data", details: result.error.format() }, { status: 400 });
    }

    const res = await backendFetch("/api/keys", {
      method: "POST",
      body: JSON.stringify(result.data),
      rawOnError: true,
    });

    return Response.json(await res.json(), { status: res.status });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    return new ChatbotError("offline:chat").toResponse();
  }
}

/**
 * DELETE /api/keys
 * Handles bulk deletion or full purge of user keys.
 * Single key deletion should be handled via /api/keys/[id].
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      const res = await backendFetch("/api/keys?all=true", {
        method: "DELETE",
        rawOnError: true,
      });
      return Response.json(await res.json(), { status: res.status });
    }

    // Bulk delete with body
    const json = await request.json().catch(() => ({}));
    const result = keyBulkDeleteSchema.safeParse(json);
    
    if (!result.success) {
      return Response.json({ error: "Invalid delete request", details: result.error.format() }, { status: 400 });
    }

    const res = await backendFetch("/api/keys", {
      method: "DELETE",
      body: JSON.stringify(result.data),
      rawOnError: true,
    });

    return Response.json(await res.json(), { status: res.status });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    return new ChatbotError("offline:chat").toResponse();
  }
}
