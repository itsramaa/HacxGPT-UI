import { revalidateTag } from "next/cache";
import { backendFetch, backendJSON } from "@/lib/api";
import { ChatbotError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await backendJSON("/api/auth/me", {
      next: { tags: ["profile"], revalidate: 600 }, // Cache for 10 mins, but allow revalidation
    });
    return Response.json(user);
  } catch (err) {
    if (err instanceof ChatbotError) {
      return err.toResponse();
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch("/api/auth/update", {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return Response.json(error, { status: res.status });
    }

    revalidateTag("profile", "fetch");
    const user = await res.json();
    return Response.json(user);
  } catch (err) {
    if (err instanceof ChatbotError) {
      return err.toResponse();
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch("/api/auth/password", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return Response.json(error, { status: res.status });
    }

    revalidateTag("profile", "fetch");
    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof ChatbotError) {
      return err.toResponse();
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
