import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.string(),
  name: z.string().min(1).max(255),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid().optional(),
  role: z.enum(["user"]),
  content: z.string().optional(),
  parts: z.array(partSchema).optional(),
});

const genericMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string().optional(),
  parts: z.array(z.any()).optional(),
});

export const chatRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: userMessageSchema.optional(),
  messages: z.array(genericMessageSchema).optional(),
  selectedChatModel: z.string().optional(),
  selectedVisibilityType: z.enum(["public", "private"]).optional(),
  attachment_ids: z.array(z.string().uuid()).optional(),
  use_search: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type ChatRequestBody = z.infer<typeof chatRequestBodySchema>;
