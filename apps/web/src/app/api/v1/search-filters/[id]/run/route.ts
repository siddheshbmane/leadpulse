import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;

    const filter = await prisma.searchFilter.findFirst({
      where: { id, organizationId },
    });

    if (!filter) {
      return apiError("NOT_FOUND", "Search filter not found", 404);
    }

    // Create a job for each source in the filter
    const jobs = await Promise.all(
      filter.sources.map((source) =>
        prisma.job.create({
          data: {
            organizationId,
            searchFilterId: id,
            source,
            status: "PENDING",
          },
        })
      )
    );

    // Update filter lastRunAt
    await prisma.searchFilter.update({
      where: { id },
      data: { lastRunAt: new Date() },
    });

    return apiSuccess(
      {
        jobIds: jobs.map((j) => j.id),
        message: `${jobs.length} scraper job(s) queued`,
        estimatedCredits: 10,
      },
      undefined,
      202
    );
  } catch (error) {
    return handleApiError(error);
  }
}
