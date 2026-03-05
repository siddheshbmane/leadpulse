import { z } from "zod";

export const searchFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const searchFilterCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sources: z.array(z.string()).min(1),
  query: z.any().default({}),
  runEveryMinutes: z.number().int().min(60).optional(),
  isActive: z.boolean().default(true),
});

export const searchFilterUpdateSchema = searchFilterCreateSchema.partial();

export type SearchFilterQuery = z.infer<typeof searchFilterQuerySchema>;
export type SearchFilterCreate = z.infer<typeof searchFilterCreateSchema>;
export type SearchFilterUpdate = z.infer<typeof searchFilterUpdateSchema>;
