import { z } from "zod";

export const MemoryLifecycleSchema = z.enum([
  "active",
  "superseded",
  "deleted",
]);

export type MemoryLifecycle = z.infer<typeof MemoryLifecycleSchema>;

export const MemoryTypeSchema = z.enum([
  "fact",
  "preference",
  "profile",
  "constraint",
]);

export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const MemorySourceSchema = z.object({
  sourceId: z.string().min(1),
  sourceType: z.enum(["message", "fixture"]),
  excerpt: z.string().min(1),
});

export type MemorySource = z.infer<typeof MemorySourceSchema>;

export const MemorySchema = z.object({
  id: z.string().min(1),

  content: z.string().min(1),
  normalizedContent: z.string().min(1),

  type: MemoryTypeSchema,
  lifecycle: MemoryLifecycleSchema,

  source: MemorySourceSchema,

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  supersedesMemoryId: z.string().nullable(),
  supersededByMemoryId: z.string().nullable(),
});

export type Memory = z.infer<typeof MemorySchema>;
