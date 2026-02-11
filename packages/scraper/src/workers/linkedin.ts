/**
 * LinkedIn Worker - The Hunter
 * Responsible for executing LinkedIn searches and piping results to the 'leads' table.
 */

import { PrismaClient } from '@prisma/client';
import { LinkedInScraperAdapter } from '../adapters/types';
import { ScrapingBeeAdapter } from '../adapters/scrapingbee';

const prisma = new PrismaClient();

export class LinkedInWorker {
  private adapter: LinkedInScraperAdapter;

  constructor(apiKey?: string) {
    // Default to ScrapingBee for this boilerplate, ready for any adapter
    this.adapter = new ScrapingBeeAdapter(apiKey || process.env.SCRAPINGBEE_API_KEY || '');
  }

  /**
   * Main execution loop for a search filter
   */
  async runSearch(ownerId: string, filterId: string, query: string) {
    console.log(`[LinkedInWorker] Starting search for owner ${ownerId}: "${query}"`);

    try {
      const results = await this.adapter.search(query, 50);

      const leadData = results.map(r => ({
        ownerId,
        searchFilterId: filterId,
        externalId: r.externalId,
        source: 'linkedin',
        sourceUrl: r.linkedinUrl,
        personName: r.personName,
        title: r.title,
        companyName: r.companyName,
        raw: r.raw,
        status: 'NEW' as const,
      }));

      // Deduplication Logic:
      // Using createMany with skipDuplicates: true leverages the uq_leads_owner_source_external constraint
      const created = await prisma.lead.createMany({
        data: leadData,
        skipDuplicates: true,
      });

      console.log(`[LinkedInWorker] Successfully processed ${results.length} results. New leads: ${created.count}`);
      
      // Update filter status
      await prisma.searchFilter.update({
        where: { id: filterId },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'success'
        }
      });

    } catch (error) {
      console.error(`[LinkedInWorker] Error:`, error);
      await prisma.searchFilter.update({
        where: { id: filterId },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'error',
          lastRunError: (error as Error).message
        }
      });
    }
  }
}
