import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

/**
 * POST /api/keys/revalidate
 * Triggers background re-validation for ALL of the current user's suspended keys.
 */
export async function POST() {
  try {
    const res = await backendFetch("/api/keys/revalidate", {
      method: "POST",
      rawOnError: true,
    });

    return Response.json(await res.json(), { status: res.status });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error triggering vault revalidation:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}
