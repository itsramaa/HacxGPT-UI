import { publicFetch } from "@/lib/api";

export async function GET() {
  try {
    const res = await publicFetch("/health", {
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response("Backend Unhealthy", { status: 503 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Health check failed:", err);
    return new Response("Backend Unreachable", { status: 503 });
  }
}
