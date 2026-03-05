import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { type NextRequest } from "next/server";
import { after } from "next/server";

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

    const jobIds = jobs.map((j) => j.id);

    // Use Next.js after() to process jobs after the response is sent
    // This keeps the serverless function alive until processing completes
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || "http://localhost:3000";

    after(async () => {
      try {
        await fetch(`${baseUrl}/api/v1/jobs/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobIds }),
        });
      } catch (e) {
        console.error("[run] Failed to trigger job processing:", e);
      }
    });

    return apiSuccess(
      {
        jobIds,
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
