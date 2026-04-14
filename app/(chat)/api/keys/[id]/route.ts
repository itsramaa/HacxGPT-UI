import type { NextRequest } from "next/server";
import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await backendFetch(`/api/keys/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      rawOnError: true,
    });

    return Response.json(await res.json(), { status: res.status });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    return new ChatbotError("offline:chat").toResponse();
  }
}

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
      try {
        return Response.json(await res.json(), { status: res.status });
      } catch (_e) {
        return Response.json(
          { error: "Failed to delete key" },
          { status: res.status }
        );
      }
    }

    return Response.json({ message: "deleted" });
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error deleting key:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // We don't have a direct get single key in backend api usually,
  // but we can proxy it if needed.
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
