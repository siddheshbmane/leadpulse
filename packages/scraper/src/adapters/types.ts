import { Lead } from '@prisma/client';

export interface LinkedInLead {
  externalId: string;
  personName: string;
  title?: string;
  companyName?: string;
  linkedinUrl: string;
  location?: string;
  raw: any;
}

export interface LinkedInScraperAdapter {
  search(query: string, limit: number): Promise<LinkedInLead[]>;
  getProfile(profileId: string): Promise<LinkedInLead>;
}
