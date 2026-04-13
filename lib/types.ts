import type { UIMessage } from "ai";
import { z } from "zod";

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type ChatMessage = UIMessage<MessageMetadata>;

export type Attachment = {
  id?: string; // UUID from backend — required to send attachment_ids in chat requests
  name: string;
  url: string;
  contentType: string;
};
