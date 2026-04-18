import type { NextRequest } from "next/server";
import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";
import { keyUpdateSchema } from "../schema";

/**
 * PATCH /api/keys/[id]
 * Updates a specific API key.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const result = keyUpdateSchema.safeParse(json);

    if (!result.success) {
      return Response.json({ error: "Invalid update data", details: result.error.format() }, { status: 400 });
    }

    const res = await backendFetch(`/api/keys/${id}`, {
      method: "PATCH",
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
 * DELETE /api/keys/[id]
 * Deletes a specific API key.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await backendFetch(`/api/keys/${id}`, {
      method: "DELETE",
      rawOnError: true,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to delete key" }));
      return Response.json(errorData, { status: res.status });
    }

    return Response.json({ message: "deleted" });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
