import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { leadExportSchema } from "@/modules/leads/schemas/lead.schema";
import { type NextRequest } from "next/server";
import { type Prisma, type LeadStatus } from "@prisma/client";

const DEFAULT_COLUMNS = [
  "personName",
  "companyName",
  "title",
  "email",
  "phone",
  "source",
  "status",
  "score",
  "intentSignal",
  "city",
  "country",
  "discoveredAt",
];

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const body = await request.json();
    const { filters, leadIds, columns } = leadExportSchema.parse(body);

    const where: Prisma.LeadWhereInput = { organizationId };

    if (leadIds && leadIds.length > 0) {
      where.id = { in: leadIds };
    }

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        where.status = { in: filters.status as LeadStatus[] };
      }
      if (filters.source) where.source = filters.source;
      if (filters.dateFrom || filters.dateTo) {
        where.discoveredAt = {};
        if (filters.dateFrom)
          where.discoveredAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.discoveredAt.lte = new Date(filters.dateTo);
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { discoveredAt: "desc" },
      take: 10000,
    });

    const cols = columns && columns.length > 0 ? columns : DEFAULT_COLUMNS;

    const csvHeader = cols.join(",");
    const csvRows = leads.map((lead) =>
      cols
        .map((col) => {
          const val = (lead as Record<string, unknown>)[col];
          if (val === null || val === undefined) return "";
          const str = val instanceof Date ? val.toISOString() : String(val);
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(",")
    );

    const csv = [csvHeader, ...csvRows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
