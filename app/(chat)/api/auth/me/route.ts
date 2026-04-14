import { auth } from "@/app/(auth)/auth";
import { backendJSON } from "@/lib/api";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await backendJSON<any>("/api/auth/me");
    return Response.json(profile);
  } catch (err) {
    console.error("Error fetching profile proxy:", err);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
