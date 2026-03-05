import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import {
  searchFilterQuerySchema,
  searchFilterCreateSchema,
} from "@/modules/search-filters/schemas/search-filter.schema";
import { type NextRequest } from "next/server";
import { type Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = searchFilterQuerySchema.parse(params);

    const where: Prisma.SearchFilterWhereInput = { organizationId };
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [data, total] = await Promise.all([
      prisma.searchFilter.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          sources: true,
          isActive: true,
          runEveryMinutes: true,
          lastRunAt: true,
          lastRunStatus: true,
          totalRuns: true,
          totalLeadsFound: true,
          createdAt: true,
        },
      }),
      prisma.searchFilter.count({ where }),
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

export async function POST(request: NextRequest) {
  try {
    const { organizationId, userId } = await getAuthContext();
    const body = await request.json();
    const data = searchFilterCreateSchema.parse(body);

    const filter = await prisma.searchFilter.create({
      data: {
        ...data,
        organizationId,
        createdById: userId,
      },
    });

    return apiSuccess({ id: filter.id, name: filter.name }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
