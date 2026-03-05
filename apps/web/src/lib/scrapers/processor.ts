import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { LinkedInScraper } from "./linkedin";
import { RedditScraper } from "./reddit";
import { GoogleMapsScraper } from "./google-maps";
import { enrichLead } from "./enrichment";
import type { SourceScraper, SearchQuery } from "./types";

const SCRAPERS: Record<string, SourceScraper> = {
  linkedin: new LinkedInScraper(),
  reddit: new RedditScraper(),
  google_maps: new GoogleMapsScraper(),
};

const CREDITS_PER_JOB = 10;

export async function processJob(jobId: string): Promise<void> {
  // 1. Mark as RUNNING
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date() },
    include: { searchFilter: true },
  });

  try {
    const scraper = SCRAPERS[job.source];
    if (!scraper) {
      throw new Error(`Unknown source: ${job.source}`);
    }

    const query = (job.searchFilter.query || {}) as SearchQuery;

    // 2. Scrape
    const result = await scraper.scrape(query, 20);

    // 3. Enrich and upsert leads
    let leadsNew = 0;

    for (const discoveredLead of result.leads) {
      const enrichment = enrichLead(discoveredLead);

      // Upsert: skip if externalId+source+org already exists
      try {
        await prisma.lead.create({
          data: {
            organizationId: job.organizationId,
            searchFilterId: job.searchFilterId,
            externalId: discoveredLead.externalId,
            source: discoveredLead.source,
            sourceUrl: discoveredLead.sourceUrl,
            personName: discoveredLead.personName,
            title: discoveredLead.title,
            companyName: discoveredLead.companyName,
            email: discoveredLead.email,
            phone: discoveredLead.phone,
            website: discoveredLead.website,
            linkedinUrl: discoveredLead.linkedinUrl,
            city: discoveredLead.city,
            region: discoveredLead.region,
            country: discoveredLead.country,
            score: enrichment.score,
            intentSignal: enrichment.intentSignal,
            tags: enrichment.tags,
            raw: discoveredLead.raw as Prisma.InputJsonValue,
            enrichment: {
              score: enrichment.score,
              intentSignal: enrichment.intentSignal,
              tags: enrichment.tags,
            } as Prisma.InputJsonValue,
            status: enrichment.score >= 50 ? "ENRICHED" : "NEW",
          },
        });
        leadsNew++;
      } catch (err: unknown) {
        // Unique constraint violation — lead already exists, skip
        if (
          err instanceof Error &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          continue;
        }
        throw err;
      }
    }

    // 4. Update job as SUCCESS
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        leadsFound: result.leads.length,
        leadsNew,
        creditsUsed: CREDITS_PER_JOB,
      },
    });

    // 5. Update SearchFilter stats
    await prisma.searchFilter.update({
      where: { id: job.searchFilterId },
      data: {
        totalRuns: { increment: 1 },
        totalLeadsFound: { increment: leadsNew },
        lastRunStatus: "SUCCESS",
        lastRunError: null,
      },
    });

    // 6. Deduct credits
    await prisma.organization.update({
      where: { id: job.organizationId },
      data: { credits: { decrement: CREDITS_PER_JOB } },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "ERROR",
        completedAt: new Date(),
        error: errorMessage,
      },
    });

    await prisma.searchFilter.update({
      where: { id: job.searchFilterId },
      data: {
        lastRunStatus: "ERROR",
        lastRunError: errorMessage,
      },
    });
  }
}
