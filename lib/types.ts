import type { UIMessage } from "ai";
import { z } from "zod";

// --- Metadata ---

export const messageMetadataSchema = z.object({
  createdAt: z.string().optional(),
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  parentId: z.string().uuid().optional(),
  version: z.number().default(1),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type ChatMessage = UIMessage<MessageMetadata>;

// --- UI Domain Types (Mapped/UI Ready) ---

/**
 * Represents a chat session in the UI.
 * Mapped from BackendSession (snake_case -> camelCase).
 */
export type Chat = {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  visibility: "public" | "private";
  isReadonly?: boolean;
  modelId?: string;
  lastMessageAt?: Date;
};

/**
 * Represents an attachment in the UI.
 * Mapped from BackendAttachment.
 */
export type Attachment = {
  id?: string; // UUID from backend — required to send attachment_ids in chat requests
  name: string; // Maps from 'filename'
  url: string;
  contentType: string; // Maps from 'content_type'
  size?: number; // Maps from 'file_size'
  file?: File; // Optional local file reference for deferred uploads
};

// --- Raw Backend Response Schemas (Matching HacxGPT-Backend) ---

export const backendUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  role: z.string(),
  is_active: z.boolean(),
  language_preference: z.string().optional(),
  total_usage: z.number().optional(),
  created_at: z.string().nullable(),
});

export const backendSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  provider_id: z.string().uuid(),
  model_name: z.string(),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const backendMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.string(),
  content: z.union([z.string(), z.array(z.record(z.any()))]), // Can be string or structured parts
  prompt_tokens: z.number().nullable(),
  completion_tokens: z.number().nullable(),
  total_tokens: z.number().nullable(),
  created_at: z.string().nullable(),
  parent_id: z.string().uuid().nullable().optional(),
  version: z.number().default(1),
});

export const backendAttachmentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  content_type: z.string(),
  file_size: z.number(),
  url: z.string().nullable(),
  created_at: z.string().nullable(),
});

export const backendModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  alias: z.string().nullable(),
  is_active: z.boolean(),
});

export const backendProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  base_url: z.string(),
  default_model: z.string(),
  is_active: z.boolean(),
  models: z.array(backendModelSchema),
});

export const backendApiKeySchema = z.object({
  id: z.string().uuid(),
  provider_id: z.string().uuid(),
  provider: backendProviderSchema.optional(),
  name: z.string(),
  is_active: z.boolean(),
  last_error: z.string().nullable(),
  last_used_at: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// --- Raw Backend Response Types ---

export type BackendUser = z.infer<typeof backendUserSchema>;
export type BackendSession = z.infer<typeof backendSessionSchema>;
export type BackendMessage = z.infer<typeof backendMessageSchema>;
export type BackendAttachment = z.infer<typeof backendAttachmentSchema>;
export type BackendApiKey = z.infer<typeof backendApiKeySchema>;
export type BackendProvider = z.infer<typeof backendProviderSchema>;

export interface BackendHistoryResponse {
  session: BackendSession;
  messages: BackendMessage[];
  total_messages: number;
  limit: number;
  offset: number;
}

/**
 * Legacy Editor Suggestion type.
 * Note: Not currently supported by backend schemas.
 */
export type Suggestion = {
  id: string;
  originalText: string;
  suggestedText: string;
  description: string;
  isApplied: boolean;
};
