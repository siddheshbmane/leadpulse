import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const { organizationId } = await getAuthContext();

    const [
      totalLeads,
      newLeadsToday,
      activeFilters,
      org,
      leadsByStatus,
      leadsBySource,
      recentJobs,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId } }),
      prisma.lead.count({
        where: {
          organizationId,
          discoveredAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.searchFilter.count({
        where: { organizationId, isActive: true },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { credits: true },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { organizationId },
        _count: true,
      }),
      prisma.job.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          searchFilter: { select: { name: true } },
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of leadsByStatus) {
      statusMap[row.status] = row._count;
    }

    const sourceMap: Record<string, number> = {};
    for (const row of leadsBySource) {
      sourceMap[row.source] = row._count;
    }

    const recentActivity = recentJobs.map((job) => ({
      type: "scraper_complete",
      message: `Found ${job.leadsNew} new leads from '${job.searchFilter.name}'`,
      timestamp: job.completedAt?.toISOString() ?? job.createdAt.toISOString(),
    }));

    return apiSuccess({
      totalLeads,
      newLeadsToday,
      activeFilters,
      creditsRemaining: org?.credits ?? 0,
      leadsByStatus: statusMap,
      leadsBySource: sourceMap,
      recentActivity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
