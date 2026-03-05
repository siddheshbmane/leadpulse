import * as cheerio from "cheerio";
import type { SearchQuery, ScraperResult, SourceScraper } from "./types";
import { fetchHtml } from "./fetch-html";

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildQuery(query: SearchQuery): string {
  const parts: string[] = [];
  if (query.keywords?.length) parts.push(query.keywords.join(" "));
  if (query.industries?.length) parts.push(query.industries.join(" "));
  if (query.location) parts.push(query.location);
  return parts.join(" ");
}

export class GoogleMapsScraper implements SourceScraper {
  async scrape(query: SearchQuery, limit = 20): Promise<ScraperResult> {
    if (process.env.GOOGLE_PLACES_API_KEY) {
      return this.scrapeWithPlacesApi(query, limit);
    }

    return this.scrapeWithDuckDuckGo(query, limit);
  }

  private async scrapeWithPlacesApi(
    query: SearchQuery,
    limit: number
  ): Promise<ScraperResult> {
    const textQuery = buildQuery(query);
    if (!textQuery.trim()) {
      return { leads: [], totalFound: 0 };
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textQuery)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = await response.json();
    const leads: ScraperResult["leads"] = [];

    for (const place of (data.results || []).slice(0, limit)) {
      leads.push({
        externalId:
          place.place_id ||
          hashCode(place.name + place.formatted_address),
        source: "google_maps",
        sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        companyName: place.name,
        city: place.formatted_address,
        raw: {
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          types: place.types,
          placeId: place.place_id,
        },
      });
    }

    return { leads, totalFound: data.results?.length || 0 };
  }

  private async scrapeWithDuckDuckGo(
    query: SearchQuery,
    limit: number
  ): Promise<ScraperResult> {
    const textQuery = buildQuery(query);
    if (!textQuery.trim()) {
      return { leads: [], totalFound: 0 };
    }

    const searchQuery = `${textQuery} business directory`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const html = await fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    const leads: ScraperResult["leads"] = [];
    const seenNames = new Set<string>();

    // Parse DuckDuckGo HTML results
    $(".result").each((_, resultEl) => {
      if (leads.length >= limit) return false;

      const linkEl = $(resultEl).find("a.result__a");
      const snippetEl = $(resultEl).find(".result__snippet");
      const href = linkEl.attr("href") || "";
      const linkText = linkEl.text().trim();
      const snippetText = snippetEl.text().trim();

      if (!linkText) return;

      // Extract business name from the result title
      const nameParts = linkText.split(/\s*[-–—·|]\s*/);
      const businessName = nameParts[0]?.trim();
      if (!businessName || businessName.length < 2) return;

      const nameKey = businessName.toLowerCase();
      if (seenNames.has(nameKey)) return;
      seenNames.add(nameKey);

      // Try to extract phone from snippet
      const phoneMatch = snippetText.match(
        /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
      );
      // Try to extract website from href
      let website: string | undefined;
      try {
        const parsedUrl = new URL(href);
        if (
          !parsedUrl.hostname.includes("duckduckgo") &&
          !parsedUrl.hostname.includes("google")
        ) {
          website = parsedUrl.origin;
        }
      } catch {
        // Invalid URL
      }

      const externalId = hashCode(
        businessName + (query.location || "")
      );

      leads.push({
        externalId,
        source: "google_maps",
        sourceUrl: href,
        companyName: businessName,
        phone: phoneMatch?.[0],
        website,
        city: query.location,
        raw: { linkText, snippetText, href },
      });
    });

    if (leads.length === 0) {
      console.warn(
        `[GoogleMapsScraper] No leads parsed. HTML preview: ${html.slice(0, 500)}`
      );
    }

    return { leads, totalFound: leads.length };
  }
}
