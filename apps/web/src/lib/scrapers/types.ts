export type SearchQuery = {
  keywords?: string[];
  jobTitles?: string[];
  industries?: string[];
  location?: string;
};

export type DiscoveredLead = {
  externalId: string;
  source: string;
  sourceUrl?: string;
  personName?: string;
  title?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  city?: string;
  region?: string;
  country?: string;
  raw: Record<string, unknown>;
};

export type ScraperResult = {
  leads: DiscoveredLead[];
  totalFound: number;
};

export interface SourceScraper {
  scrape(query: SearchQuery, limit: number): Promise<ScraperResult>;
}
