import type { NextRequest } from "next/server";
import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

/**
 * POST /api/keys/[id]/revalidate
 * Triggers background re-validation for ONE specific key owned by the current user.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await backendFetch(`/api/keys/${id}/revalidate`, {
      method: "POST",
      rawOnError: true,
    });

    return Response.json(await res.json(), { status: res.status });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error triggering single-key revalidation:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}
