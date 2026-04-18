import { z } from "zod";

export const keySchema = z.object({
  provider_id: z.string().uuid(),
  name: z.string().min(1).max(128),
  api_key: z.string().min(1),
});

export const keyUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  api_key: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const keyBulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export type KeyInput = z.infer<typeof keySchema>;
export type KeyUpdateInput = z.infer<typeof keyUpdateSchema>;
export type KeyBulkDeleteInput = z.infer<typeof keyBulkDeleteSchema>;
