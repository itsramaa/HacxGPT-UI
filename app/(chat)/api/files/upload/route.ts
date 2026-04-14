import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // backendFetch will auto-attach the HTTP-only JWT token
    const res = await backendFetch("/api/uploads", {
      method: "POST",
      // NOTE: Do NOT set Content-Type header manually here.
      // fetch will automatically set `Content-Type: multipart/form-data; boundary=...`
      // For backendFetch, we have to clear the default application/json it sets.
      headers: { "Content-Type": "" },
      body: formData,
      rawOnError: true,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      return NextResponse.json(
        { error: err.detail || "Upload failed. Cannot process file." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      id: data.id, // UUID — needed for attachment_ids in chat
      url: `${BACKEND_URL}${data.url}`,
      pathname: data.filename,
      contentType: data.content_type,
    });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
