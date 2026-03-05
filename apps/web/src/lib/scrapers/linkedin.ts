import * as cheerio from "cheerio";
import type { SearchQuery, ScraperResult, SourceScraper } from "./types";

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

async function searchDuckDuckGoHtml(query: string): Promise<string> {
  // Try DuckDuckGo HTML version (more reliable than lite from servers)
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo returned ${response.status}`);
  }

  return response.text();
}

export class LinkedInScraper implements SourceScraper {
  async scrape(query: SearchQuery, limit = 20): Promise<ScraperResult> {
    const searchQuery = buildQuery(query);
    const html = await searchDuckDuckGoHtml(searchQuery);
    const $ = cheerio.load(html);
    const leads: ScraperResult["leads"] = [];
    const seenSlugs = new Set<string>();

    // DuckDuckGo HTML results: each result is in a div.result
    // The link is in a.result__a, snippet in a.result__snippet
    $(".result").each((_, resultEl) => {
      if (leads.length >= limit) return false;

      const linkEl = $(resultEl).find("a.result__a");
      const snippetEl = $(resultEl).find("a.result__snippet, .result__snippet");

      const href = linkEl.attr("href") || "";
      const slug = extractProfileSlug(href);
      if (!slug || seenSlugs.has(slug)) return;
      seenSlugs.add(slug);

      const linkText = linkEl.text().trim();
      const snippetText = snippetEl.text().trim();

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
        raw: { linkText, snippetText, href },
      });
    });

    // Fallback: if .result class didn't match, try generic anchor parsing
    if (leads.length === 0) {
      $("a[href*='linkedin.com/in/']").each((_, el) => {
        if (leads.length >= limit) return false;

        const href = $(el).attr("href") || "";
        const slug = extractProfileSlug(href);
        if (!slug || seenSlugs.has(slug)) return;
        seenSlugs.add(slug);

        const linkText = $(el).text().trim();
        const parentText = $(el).parent().text().trim();
        const snippetText = parentText.replace(linkText, "").trim();

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
          raw: { linkText, snippetText, href },
        });
      });
    }

    if (leads.length === 0) {
      // Log HTML structure for debugging (first 500 chars)
      console.warn(
        `[LinkedInScraper] No leads parsed from DDG response. HTML preview: ${html.slice(0, 500)}`
      );
    }

    return { leads, totalFound: leads.length };
  }
}
