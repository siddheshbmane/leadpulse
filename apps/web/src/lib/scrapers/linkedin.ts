import * as cheerio from "cheerio";
import type { SearchQuery, ScraperResult, SourceScraper } from "./types";

function buildSearchUrl(query: SearchQuery): string {
  const parts = ['site:linkedin.com/in/'];

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

  const q = encodeURIComponent(parts.join(" "));
  return `https://lite.duckduckgo.com/lite/?q=${q}`;
}

function extractProfileSlug(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function parseSnippet(text: string): { title?: string; companyName?: string } {
  // Common LinkedIn snippet patterns: "Title at Company" or "Title - Company"
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

export class LinkedInScraper implements SourceScraper {
  async scrape(query: SearchQuery, limit = 20): Promise<ScraperResult> {
    const url = buildSearchUrl(query);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const leads: ScraperResult["leads"] = [];

    // DuckDuckGo lite results are in table rows or anchor tags
    $("a").each((_, el) => {
      if (leads.length >= limit) return false;

      const href = $(el).attr("href") || "";
      const slug = extractProfileSlug(href);
      if (!slug) return;

      // Get the text of the link (usually the person's name + title)
      const linkText = $(el).text().trim();
      // Get surrounding snippet text
      const parentText = $(el).parent().text().trim();
      const snippetText = parentText.replace(linkText, "").trim();

      // Name is typically in the link text: "First Last - Title | LinkedIn"
      let personName: string | undefined;
      const nameParts = linkText.split(/\s*[-–—|]\s*/);
      if (nameParts.length > 0 && nameParts[0].length > 1) {
        personName = nameParts[0]
          .replace(/linkedin/i, "")
          .replace(/…/g, "")
          .trim();
      }

      const { title, companyName } = parseSnippet(
        snippetText || (nameParts.length > 1 ? nameParts[1] : "")
      );

      // Skip if no useful data extracted
      if (!personName && !slug) return;

      leads.push({
        externalId: slug,
        source: "linkedin",
        sourceUrl: `https://linkedin.com/in/${slug}`,
        linkedinUrl: `https://linkedin.com/in/${slug}`,
        personName: personName || undefined,
        title,
        companyName,
        raw: { linkText, snippetText, href },
      });
    });

    return { leads, totalFound: leads.length };
  }
}
