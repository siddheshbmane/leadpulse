import { prisma } from "@/lib/prisma";
import { processJob } from "@/lib/scrapers/processor";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let jobIds: string[] | undefined;

    // Parse optional body
    try {
      const body = await request.json();
      if (Array.isArray(body?.jobIds)) {
        jobIds = body.jobIds;
      }
    } catch {
      // No body or invalid JSON — process all PENDING jobs
    }

    // Find jobs to process
    const jobs = await prisma.job.findMany({
      where: {
        status: "PENDING",
        ...(jobIds?.length ? { id: { in: jobIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    if (jobs.length === 0) {
      return apiSuccess({ processed: 0, message: "No pending jobs" });
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
