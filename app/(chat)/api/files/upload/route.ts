import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  const session = await auth();

  if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
    return NextResponse.json({
      id: "dummy-file-id",
      url: "https://avatar.vercel.sh/dummy",
      pathname: "dummy-file.txt",
      contentType: "text/plain",
    });
  }

  if (!session?.user || !session.user.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
      body: formData,
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
      id: data.id,           // UUID — needed for attachment_ids in chat
      url: `${BACKEND_URL}${data.url}`,
      pathname: data.filename,
      contentType: data.content_type,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
