import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const res = await backendFetch(`/api/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return Response.json(error, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    return Response.json({ error: "offline" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    const res = await backendFetch(`/api/sessions/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
        const error = await res.json();
        return Response.json(error, { status: res.status });
    }

    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    return Response.json({ error: "offline" }, { status: 500 });
  }
}
