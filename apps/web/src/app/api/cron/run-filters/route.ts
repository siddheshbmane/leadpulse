import { prisma } from "@/lib/prisma";
import { processJob } from "@/lib/scrapers/processor";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("UNAUTHORIZED", "Invalid cron secret", 401);
  }

  try {
    // Find active filters where nextRunAt has passed
    const now = new Date();
    const dueFilters = await prisma.searchFilter.findMany({
      where: {
        isActive: true,
        runEveryMinutes: { not: null },
        nextRunAt: { lte: now },
      },
      take: 3, // Process max 3 per cron invocation to stay within timeout
    });

    if (dueFilters.length === 0) {
      return apiSuccess({ triggered: 0, message: "No filters due" });
    }

    const results: Array<{ filterId: string; filterName: string; jobCount: number }> = [];

    for (const filter of dueFilters) {
      // Create jobs for each source
      const jobs = await Promise.all(
        filter.sources.map((source) =>
          prisma.job.create({
            data: {
              organizationId: filter.organizationId,
              searchFilterId: filter.id,
              source,
              status: "PENDING",
            },
          })
        )
      );

      // Calculate next run time
      const nextRunAt = new Date(
        now.getTime() + (filter.runEveryMinutes ?? 60) * 60 * 1000
      );

      // Update filter
      await prisma.searchFilter.update({
        where: { id: filter.id },
        data: { lastRunAt: now, nextRunAt },
      });

      // Process jobs inline
      for (const job of jobs) {
        try {
          await processJob(job.id);
        } catch {
          // Error already recorded by processJob
        }
      }

      results.push({
        filterId: filter.id,
        filterName: filter.name,
        jobCount: jobs.length,
      });
    }

    return apiSuccess({
      triggered: results.length,
      results,
    });
  } catch (error) {
    console.error("[Cron] run-filters error:", error);
    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
