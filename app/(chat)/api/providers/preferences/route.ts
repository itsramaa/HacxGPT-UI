import { backendJSON, backendPOST } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

export async function GET() {
  try {
    const prefs = await backendJSON("/api/providers/preferences");
    return Response.json(prefs);
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error fetching visibility preferences:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await backendPOST("/api/providers/preferences", body);
    return Response.json(result);
  } catch (err) {
    if (err instanceof ChatbotError) { return err.toResponse(); }
    console.error("Error updating visibility preferences:", err);
    return new ChatbotError("offline:chat").toResponse();
  }
}
