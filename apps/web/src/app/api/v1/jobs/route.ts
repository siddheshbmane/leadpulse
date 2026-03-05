import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import { jobQuerySchema } from "@/modules/jobs/schemas/job.schema";
import { type NextRequest } from "next/server";
import { type Prisma, type JobStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = jobQuerySchema.parse(params);

    const where: Prisma.JobWhereInput = { organizationId };

    if (query.status) {
      where.status = query.status as JobStatus;
    }
    if (query.searchFilterId) {
      where.searchFilterId = query.searchFilterId;
    }

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          searchFilter: { select: { name: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const mapped = data.map((job) => ({
      id: job.id,
      searchFilterId: job.searchFilterId,
      searchFilterName: job.searchFilter.name,
      status: job.status,
      source: job.source,
      leadsFound: job.leadsFound,
      leadsNew: job.leadsNew,
      creditsUsed: job.creditsUsed,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      createdAt: job.createdAt,
    }));

    return apiSuccess(mapped, {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
