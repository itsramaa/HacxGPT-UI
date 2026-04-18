import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { backendFetch } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

/**
 * Handle manual key re-validation requests.
 * Proxies POST /api/admin/revalidate-keys to the Python backend.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const res = await backendFetch("/api/admin/revalidate-keys", {
      method: "POST",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Response.json(
        { error: errorData.detail || "Re-validation protocol failed." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err: any) {
    console.error("Error proxying revalidate-keys:", err);
    if (err instanceof ChatbotError) {
      return err.toResponse();
    }
    return Response.json(
      { error: "Internal Gateway Error" },
      { status: 500 }
    );
  }
}
