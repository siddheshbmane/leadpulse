import { z } from "zod";

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  source: z.string().optional(),
  searchFilterId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["discoveredAt", "personName", "companyName", "score", "status"])
    .default("discoveredAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  tags: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const leadUpdateSchema = z.object({
  status: z
    .enum(["NEW", "ENRICHED", "QUALIFIED", "CONTACTED", "WON", "LOST", "IGNORED"])
    .optional(),
  score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  intentSignal: z.string().optional(),
});

export const leadBulkUpdateSchema = z.object({
  leadIds: z.array(z.string()).min(1).max(100),
  update: leadUpdateSchema,
});

export const leadExportSchema = z.object({
  filters: z
    .object({
      status: z.array(z.string()).optional(),
      source: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    })
    .optional(),
  leadIds: z.array(z.string()).optional(),
  columns: z.array(z.string()).optional(),
});

export type LeadQuery = z.infer<typeof leadQuerySchema>;
export type LeadUpdate = z.infer<typeof leadUpdateSchema>;
export type LeadBulkUpdate = z.infer<typeof leadBulkUpdateSchema>;
export type LeadExport = z.infer<typeof leadExportSchema>;
