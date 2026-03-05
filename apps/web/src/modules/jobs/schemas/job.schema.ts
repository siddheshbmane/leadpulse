import { z } from "zod";

export const jobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  searchFilterId: z.string().optional(),
});

export type JobQuery = z.infer<typeof jobQuerySchema>;
