import { backendJSON } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qs = searchParams.toString();
    const endpoint = `/api/providers${qs ? `?${qs}` : ""}`;
    const providers = await backendJSON(endpoint);
    return Response.json(providers);
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error fetching providers:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}
