import type { SearchQuery, ScraperResult, SourceScraper } from "./types";

type RedditPost = {
  id: string;
  author: string;
  subreddit: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  created_utc: number;
  score: number;
  num_comments: number;
};

type RedditSearchResponse = {
  data: {
    children: Array<{ data: RedditPost }>;
    after?: string;
  };
};

function buildQuery(query: SearchQuery): string {
  const parts: string[] = [];
  if (query.keywords?.length) parts.push(query.keywords.join(" "));
  if (query.jobTitles?.length) parts.push(query.jobTitles.join(" OR "));
  if (query.industries?.length) parts.push(query.industries.join(" "));
  if (query.location) parts.push(query.location);
  return parts.join(" ");
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = 2
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const response = await fetch(url, { headers });

    if (response.ok) return response;

    // Reddit rate limits: wait and retry
    if (response.status === 429 && i < retries) {
      const waitMs = 2000 * (i + 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    if (i === retries) {
      throw new Error(`Reddit API returned ${response.status} after ${retries + 1} attempts`);
    }
  }

  throw new Error("Reddit fetch exhausted retries");
}

export class RedditScraper implements SourceScraper {
  async scrape(query: SearchQuery, limit = 20): Promise<ScraperResult> {
    const q = buildQuery(query);
    if (!q.trim()) {
      return { leads: [], totalFound: 0 };
    }

    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&t=month&limit=${Math.min(limit, 25)}`;

    const response = await fetchWithRetry(url, {
      "User-Agent": "LeadPulse:v1.0 (by /u/leadpulse-bot)",
      Accept: "application/json",
    });

    const text = await response.text();
    let json: RedditSearchResponse;

    try {
      json = JSON.parse(text);
    } catch {
      console.warn(
        `[RedditScraper] Non-JSON response from Reddit. Preview: ${text.slice(0, 300)}`
      );
      throw new Error("Reddit returned non-JSON response (possible rate limit or block)");
    }

    if (!json?.data?.children) {
      console.warn("[RedditScraper] Unexpected response structure:", JSON.stringify(json).slice(0, 300));
      return { leads: [], totalFound: 0 };
    }

    const leads: ScraperResult["leads"] = [];

    for (const child of json.data.children) {
      if (leads.length >= limit) break;

      const post = child.data;
      if (!post?.author || post.author === "[deleted]" || post.author === "AutoModerator") {
        continue;
      }

      leads.push({
        externalId: post.id,
        source: "reddit",
        sourceUrl: `https://reddit.com${post.permalink}`,
        personName: post.author,
        title: post.subreddit,
        raw: {
          postTitle: post.title,
          selftext: post.selftext?.slice(0, 2000) || "",
          subreddit: post.subreddit,
          score: post.score,
          numComments: post.num_comments,
          createdUtc: post.created_utc,
          url: post.url,
        },
      });
    }

    return { leads, totalFound: json.data.children.length };
  }
}
