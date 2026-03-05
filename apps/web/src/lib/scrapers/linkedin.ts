import * as cheerio from "cheerio";
import type { SearchQuery, ScraperResult, SourceScraper } from "./types";
import { fetchHtml } from "./fetch-html";

function buildQuery(query: SearchQuery): string {
  const parts = ["site:linkedin.com/in/"];

  if (query.keywords?.length) {
    parts.push(query.keywords.map((k) => `"${k}"`).join(" "));
  }
  if (query.jobTitles?.length) {
    parts.push(query.jobTitles.map((t) => `"${t}"`).join(" OR "));
  }
  if (query.industries?.length) {
    parts.push(query.industries.map((i) => `"${i}"`).join(" "));
  }
  if (query.location) {
    parts.push(`"${query.location}"`);
  }

  return parts.join(" ");
}

function extractProfileSlug(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function parseSnippet(text: string): { title?: string; companyName?: string } {
  const atMatch = text.match(/^([^–—-]+?)\s+(?:at|@)\s+(.+?)(?:\s*[|·]|$)/i);
  if (atMatch) {
    return { title: atMatch[1].trim(), companyName: atMatch[2].trim() };
  }

  const dashMatch = text.match(/^([^–—-]+?)\s*[-–—]\s*(.+?)(?:\s*[|·]|$)/i);
  if (dashMatch) {
    return { title: dashMatch[1].trim(), companyName: dashMatch[2].trim() };
  }

  return {};
}

async function searchHtml(query: string): Promise<string> {
  // Always use DuckDuckGo HTML — ScrapingBee proxies it to avoid IP blocks
  // (Google requires custom_google=True which costs 20x credits)
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  return fetchHtml(ddgUrl);
}

export class LinkedInScraper implements SourceScraper {
  async scrape(query: SearchQuery, limit = 20): Promise<ScraperResult> {
    const searchQuery = buildQuery(query);
    console.log(`[LinkedInScraper] Searching: ${searchQuery}`);

    const html = await searchHtml(searchQuery);
    const $ = cheerio.load(html);
    const leads: ScraperResult["leads"] = [];
    const seenSlugs = new Set<string>();

    // Strategy 1: Find all LinkedIn profile links regardless of page structure
    // This works for both Google and DuckDuckGo results
    $("a").each((_, el) => {
      if (leads.length >= limit) return false;

      const href = $(el).attr("href") || "";
      const slug = extractProfileSlug(href);
      if (!slug || seenSlugs.has(slug)) return;

      // Skip common non-profile slugs
      if (["in", "pub", "company", "jobs", "pulse"].includes(slug)) return;

      seenSlugs.add(slug);

      const linkText = $(el).text().trim();
      // Walk up to find surrounding text for context
      const container = $(el).closest("div, li, td");
      const snippetText = container.length
        ? container.text().replace(linkText, "").trim()
        : "";

      // Extract name from link text: "First Last - Title | LinkedIn"
      let personName: string | undefined;
      const nameParts = linkText.split(/\s*[-–—|]\s*/);
      if (nameParts.length > 0 && nameParts[0].length > 1) {
        personName = nameParts[0]
          .replace(/linkedin/i, "")
          .replace(/…/g, "")
          .trim();
        if (personName.length < 2) personName = undefined;
      }

      const { title, companyName } = parseSnippet(
        snippetText || (nameParts.length > 1 ? nameParts[1] : "")
      );

      if (!personName) return;

      leads.push({
        externalId: slug,
        source: "linkedin",
        sourceUrl: `https://linkedin.com/in/${slug}`,
        linkedinUrl: `https://linkedin.com/in/${slug}`,
        personName,
        title,
        companyName,
        raw: { linkText, snippetText: snippetText.slice(0, 500), href },
      });
    });

    if (leads.length === 0) {
      console.warn(
        `[LinkedInScraper] No leads found. HTML length: ${html.length}, preview: ${html.slice(0, 500)}`
      );
    } else {
      console.log(`[LinkedInScraper] Found ${leads.length} leads`);
    }

    return { leads, totalFound: leads.length };
  }
}
