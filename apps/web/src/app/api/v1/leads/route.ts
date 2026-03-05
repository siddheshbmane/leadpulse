import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import { leadQuerySchema } from "@/modules/leads/schemas/lead.schema";
import { type NextRequest } from "next/server";
import { type Prisma, type LeadStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = leadQuerySchema.parse(params);

    const where: Prisma.LeadWhereInput = { organizationId };

    if (query.status) {
      const statuses = query.status.split(",");
      where.status = { in: statuses as LeadStatus[] };
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.searchFilterId) {
      where.searchFilterId = query.searchFilterId;
    }

    if (query.search) {
      where.OR = [
        { personName: { contains: query.search, mode: "insensitive" } },
        { companyName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.tags) {
      const tagList = query.tags.split(",");
      where.tags = { hasSome: tagList };
    }

    if (query.dateFrom || query.dateTo) {
      where.discoveredAt = {};
      if (query.dateFrom) where.discoveredAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.discoveredAt.lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          personName: true,
          companyName: true,
          title: true,
          email: true,
          source: true,
          sourceUrl: true,
          status: true,
          score: true,
          intentSignal: true,
          tags: true,
          city: true,
          country: true,
          discoveredAt: true,
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return apiSuccess(data, {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
