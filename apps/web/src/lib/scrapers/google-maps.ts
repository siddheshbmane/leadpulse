import * as cheerio from "cheerio";
import type { SearchQuery, ScraperResult, SourceScraper } from "./types";

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildSearchUrl(query: SearchQuery): string {
  const parts: string[] = [];

  if (query.keywords?.length) parts.push(query.keywords.join(" "));
  if (query.industries?.length) parts.push(query.industries.join(" "));
  if (query.location) parts.push(query.location);

  const q = encodeURIComponent(
    `site:google.com/maps ${parts.join(" ")}`
  );
  return `https://lite.duckduckgo.com/lite/?q=${q}`;
}

export class GoogleMapsScraper implements SourceScraper {
  async scrape(query: SearchQuery, limit = 20): Promise<ScraperResult> {
    // If Google Places API key is available, prefer it
    if (process.env.GOOGLE_PLACES_API_KEY) {
      return this.scrapeWithPlacesApi(query, limit);
    }

    return this.scrapeWithDuckDuckGo(query, limit);
  }

  private async scrapeWithPlacesApi(
    query: SearchQuery,
    limit: number
  ): Promise<ScraperResult> {
    const textQuery = [
      ...(query.keywords || []),
      ...(query.industries || []),
      query.location,
    ]
      .filter(Boolean)
      .join(" ");

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textQuery)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = await response.json();
    const leads: ScraperResult["leads"] = [];

    for (const place of (data.results || []).slice(0, limit)) {
      leads.push({
        externalId: place.place_id || hashCode(place.name + place.formatted_address),
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

    $("a").each((_, el) => {
      if (leads.length >= limit) return false;

      const href = $(el).attr("href") || "";
      if (!href.includes("google.com/maps")) return;

      const linkText = $(el).text().trim();
      const snippetText = $(el).parent().text().trim();

      if (!linkText) return;

      // Extract business name — usually the link text before any separators
      const nameParts = linkText.split(/\s*[-–—·|]\s*/);
      const businessName = nameParts[0]?.trim();
      if (!businessName) return;

      const externalId = hashCode(businessName + (query.location || ""));

      leads.push({
        externalId,
        source: "google_maps",
        sourceUrl: href,
        companyName: businessName,
        city: query.location,
        raw: { linkText, snippetText, href },
      });
    });

    return { leads, totalFound: leads.length };
  }
}
