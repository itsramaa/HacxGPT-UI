"use server";

import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/sidebar/visibility-selector";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // Stubbed - visibility not currently synced to backend individually
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  // Stubbed - Backend doesn't support selective deletion of trailing messages yet
}
