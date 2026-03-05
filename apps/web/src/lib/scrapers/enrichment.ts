import type { DiscoveredLead } from "./types";

type EnrichmentResult = {
  score: number;
  intentSignal?: string;
  tags: string[];
};

const INTENT_PATTERNS: Array<{ pattern: RegExp; signal: string }> = [
  { pattern: /\b(hiring|#hiring|looking to hire|we're hiring)\b/i, signal: "Hiring Intent" },
  { pattern: /\b(just raised|series [a-d]|funding|fundrais)/i, signal: "Funding/Growth" },
  { pattern: /\b(looking for|recommendations?|need help|searching for)\b/i, signal: "Active Buyer" },
  { pattern: /\b(scaling|expansion|new market|growing team)\b/i, signal: "Growth Phase" },
  { pattern: /\b(rfp|vendor selection|evaluating|procurement)\b/i, signal: "Procurement" },
];

const DECISION_MAKER_TITLES = /\b(ceo|cto|cfo|coo|cmo|cio|cpo|founder|co-founder|cofounder|president|vp|vice president|director|head of|partner|owner|managing)\b/i;

function detectIntentSignal(text: string): string | undefined {
  for (const { pattern, signal } of INTENT_PATTERNS) {
    if (pattern.test(text)) return signal;
  }
  return undefined;
}

function generateTags(lead: DiscoveredLead, intentSignal?: string): string[] {
  const tags: string[] = [];

  // Source tag
  tags.push(`${lead.source}-lead`);

  // Title-based tags
  if (lead.title) {
    if (DECISION_MAKER_TITLES.test(lead.title)) {
      tags.push("decision-maker");
    }
    const titleLower = lead.title.toLowerCase();
    if (/\b(ceo|cto|cfo|coo|cmo|cio|cpo|founder|co-founder|cofounder)\b/.test(titleLower)) {
      tags.push("c-suite");
    }
    if (/\b(engineer|developer|dev)\b/.test(titleLower)) {
      tags.push("technical");
    }
    if (/\b(marketing|growth|sales)\b/.test(titleLower)) {
      tags.push("go-to-market");
    }
  }

  // Intent tags
  if (intentSignal) {
    tags.push(intentSignal.toLowerCase().replace(/[/ ]+/g, "-"));
  }

  // Contact completeness
  if (lead.email && lead.phone) {
    tags.push("verified-contact");
  }

  return [...new Set(tags)];
}

export function enrichLead(lead: DiscoveredLead): EnrichmentResult {
  let score = 0;

  // Contact info scoring
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.linkedinUrl) score += 15;
  if (lead.companyName) score += 10;
  if (lead.title) score += 10;
  if (lead.website) score += 5;

  // Decision-maker bonus
  if (lead.title && DECISION_MAKER_TITLES.test(lead.title)) {
    score += 15;
  }

  // Intent signal detection from raw data
  const textToAnalyze = [
    lead.title,
    lead.companyName,
    typeof lead.raw.postTitle === "string" ? lead.raw.postTitle : "",
    typeof lead.raw.selftext === "string" ? lead.raw.selftext : "",
    typeof lead.raw.snippetText === "string" ? lead.raw.snippetText : "",
    typeof lead.raw.linkText === "string" ? lead.raw.linkText : "",
  ]
    .filter(Boolean)
    .join(" ");

  const intentSignal = detectIntentSignal(textToAnalyze);
  if (intentSignal) score += 10;

  // Cap at 100
  score = Math.min(score, 100);

  const tags = generateTags(lead, intentSignal);

  return { score, intentSignal, tags };
}
