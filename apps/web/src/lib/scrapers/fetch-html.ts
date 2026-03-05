/**
 * Shared HTML fetcher that uses ScrapingBee proxy when available,
 * falling back to direct fetch. This prevents 403 blocks from
 * search engines when running on datacenter IPs (Vercel).
 */

const SCRAPINGBEE_BASE = "https://app.scrapingbee.com/api/v1/";

export async function fetchHtml(url: string): Promise<string> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (apiKey) {
    return fetchViaScrapingBee(url, apiKey);
  }

  return fetchDirect(url);
}

async function fetchViaScrapingBee(
  targetUrl: string,
  apiKey: string
): Promise<string> {
  const trimmedKey = apiKey.trim();
  console.log(
    `[fetchHtml] ScrapingBee key length: ${trimmedKey.length}, first/last 4: ${trimmedKey.slice(0, 4)}...${trimmedKey.slice(-4)}`
  );
  console.log(`[fetchHtml] Target URL: ${targetUrl}`);

  const params = new URLSearchParams({
    api_key: trimmedKey,
    url: targetUrl,
    render_js: "false",
    premium_proxy: "false",
  });

  const fullUrl = `${SCRAPINGBEE_BASE}?${params.toString()}`;
  const response = await fetch(fullUrl);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[fetchHtml] ScrapingBee error ${response.status}: ${body.slice(0, 500)}`
    );
    throw new Error(`ScrapingBee returned ${response.status}: ${body.slice(0, 100)}`);
  }

  const html = await response.text();
  console.log(`[fetchHtml] ScrapingBee success, HTML length: ${html.length}`);
  return html;
}

async function fetchDirect(url: string): Promise<string> {
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
    throw new Error(`Direct fetch returned ${response.status}`);
  }

  return response.text();
}
