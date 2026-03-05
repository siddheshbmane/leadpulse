import { prisma } from "@/lib/prisma";
import { processJob } from "@/lib/scrapers/processor";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { type NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();

    let jobIds: string[] | undefined;

    try {
      const body = await request.json();
      if (Array.isArray(body?.jobIds) && body.jobIds.length > 0) {
        jobIds = body.jobIds;
      }
    } catch {
      // No body — but we still require jobIds
    }

    if (!jobIds?.length) {
      return apiError("BAD_REQUEST", "jobIds array is required", 400);
    }

    // Find ONLY the specific jobs that belong to this organization
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        organizationId,
        status: "PENDING",
      },
      orderBy: { createdAt: "asc" },
    });

    if (jobs.length === 0) {
      return apiSuccess({ processed: 0, message: "No pending jobs found" });
    }

    const results: Array<{ jobId: string; status: string }> = [];

    // Process sequentially to stay within timeout
    for (const job of jobs) {
      try {
        await processJob(job.id);
        results.push({ jobId: job.id, status: "success" });
      } catch {
        results.push({ jobId: job.id, status: "error" });
      }
    }

    return apiSuccess({
      processed: results.length,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
