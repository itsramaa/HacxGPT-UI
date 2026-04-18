import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { backendJSON } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  // Cast params to handle potential async nature in Next 15
  const slug = (await params).slug as string[];
  const targetPath = `/api/admin/${slug.join("/")}`;
  const searchParams = request.nextUrl.searchParams.toString();
  const finalPath = searchParams ? `${targetPath}?${searchParams}` : targetPath;

  try {
    const method = request.method;
    const options: any = { method };

    if (method !== "GET" && method !== "HEAD") {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch (_e) {
        // No body or not JSON
      }
    }

    const data = await backendJSON<any>(finalPath, options);
    return Response.json(data);
  } catch (err: any) {
    console.error(`Error proxying admin ${request.method} ${finalPath}:`, err);
    if (err instanceof ChatbotError) {
      return err.toResponse();
    }
    return Response.json(
      { error: err.message || "Failed to proxy request" },
      { status: 500 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const PUT = proxyRequest;
