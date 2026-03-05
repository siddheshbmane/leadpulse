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

export class RedditScraper implements SourceScraper {
  async scrape(query: SearchQuery, limit = 20): Promise<ScraperResult> {
    const q = encodeURIComponent(buildQuery(query));
    const url = `https://www.reddit.com/search.json?q=${q}&sort=new&t=month&limit=${Math.min(limit, 25)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "LeadPulse/1.0 (lead-discovery-platform)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`);
    }

    const json: RedditSearchResponse = await response.json();
    const leads: ScraperResult["leads"] = [];

    for (const child of json.data.children) {
      if (leads.length >= limit) break;

      const post = child.data;
      if (!post.author || post.author === "[deleted]") continue;

      leads.push({
        externalId: post.id,
        source: "reddit",
        sourceUrl: `https://reddit.com${post.permalink}`,
        personName: post.author,
        title: post.subreddit,
        raw: {
          postTitle: post.title,
          selftext: post.selftext?.slice(0, 2000),
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
