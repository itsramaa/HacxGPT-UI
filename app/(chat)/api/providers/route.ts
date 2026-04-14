import { backendJSON } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

export async function GET() {
  try {
    const providers = await backendJSON("/api/providers");
    return Response.json(providers);
  } catch (err) {
    if (err instanceof ChatbotError) return err.toResponse();
    console.error("Error fetching providers:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}
