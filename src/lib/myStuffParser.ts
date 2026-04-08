/**
 * Parser for Amazon Video "My Stuff" pages (Watchlist + Purchases & Rentals).
 *
 * Fetches the HTML pages and extracts title IDs, titles, and thumbnails
 * using the same DOM parsing approach as storefrontParser.
 */

import { AMAZON_ORIGIN } from "./constants";
import type { AmazonWidgetItem } from "./amazonTypes";

const WATCHLIST_URL = `${AMAZON_ORIGIN}/gp/video/mystuff/watchlist`;
const LIBRARY_URL = `${AMAZON_ORIGIN}/gp/video/mystuff/library`;

export interface MyStuffResult {
  watchlist: AmazonWidgetItem[];
  library: AmazonWidgetItem[];
}

export async function fetchMyStuff(): Promise<MyStuffResult> {
  const [watchlist, library] = await Promise.all([
    fetchAndParse(WATCHLIST_URL),
    fetchAndParse(LIBRARY_URL),
  ]);
  return { watchlist, library };
}

async function fetchAndParse(url: string): Promise<AmazonWidgetItem[]> {
  try {
    const resp = await fetch(url, {
      credentials: "include",
      headers: { Accept: "text/html" },
    });
    if (!resp.ok) {
      console.warn(`[myStuffParser] Fetch failed for ${url}: ${resp.status}`);
      return [];
    }

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Try multiple extraction strategies
    let items = extractFromArticleCards(doc);
    if (items.length === 0) items = extractFromLinks(doc);
    if (items.length === 0) items = extractFromInlineJson(html);

    console.log(`[myStuffParser] ${url} → ${items.length} items`);
    return items;
  } catch (err) {
    console.warn(`[myStuffParser] Error fetching ${url}:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Strategy 1: article[data-card-title] cards (common Amazon pattern)
// ---------------------------------------------------------------------------

function extractFromArticleCards(doc: Document): AmazonWidgetItem[] {
  const items: AmazonWidgetItem[] = [];
  const seen = new Set<string>();

  for (const article of doc.querySelectorAll("article[data-card-title]")) {
    const link = article.querySelector(
      'a[href*="/dp/"], a[href*="/detail/"], a[href*="/gp/video/detail/"]',
    );
    const titleID = extractTitleId(link?.getAttribute("href") ?? "");
    if (!titleID || seen.has(titleID)) continue;
    seen.add(titleID);

    const title = article.getAttribute("data-card-title") ?? undefined;
    const imgUrl = pickBestImage(article);

    items.push({ titleID, title, image: imgUrl ? { url: imgUrl } : undefined });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Strategy 2: Link-based extraction (fallback)
// ---------------------------------------------------------------------------

function extractFromLinks(doc: Document): AmazonWidgetItem[] {
  const items: AmazonWidgetItem[] = [];
  const seen = new Set<string>();

  const links = doc.querySelectorAll(
    'a[href*="/dp/"], a[href*="/detail/"], a[href*="/gp/video/detail/"]',
  );

  for (const link of links) {
    const href = link.getAttribute("href") ?? "";
    const titleID = extractTitleId(href);
    if (!titleID || seen.has(titleID)) continue;
    seen.add(titleID);

    const img = link.querySelector("img");
    const imgUrl = img?.getAttribute("src") ?? undefined;
    if (imgUrl && (imgUrl.includes("1x1") || imgUrl.includes("pixel")))
      continue;

    const btn = link.parentElement?.querySelector("button[aria-label]");
    const title =
      btn?.getAttribute("aria-label") ??
      link.getAttribute("aria-label") ??
      img?.getAttribute("alt") ??
      link.textContent?.trim() ??
      undefined;

    if (title || titleID) {
      items.push({
        titleID,
        title: title || undefined,
        image: imgUrl ? { url: imgUrl } : undefined,
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Strategy 3: Inline JSON extraction (some pages embed data in scripts)
// ---------------------------------------------------------------------------

function extractFromInlineJson(html: string): AmazonWidgetItem[] {
  const items: AmazonWidgetItem[] = [];
  const seen = new Set<string>();

  // Look for JSON blobs containing titleID patterns
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const text = match[1];
    if (!text.includes("titleID") && !text.includes("ASIN")) continue;

    // Try to find JSON objects with title data
    const jsonRegex = /\{[^{}]*"titleID"\s*:\s*"[A-Z0-9]+?"[^{}]*\}/g;
    let jsonMatch: RegExpExecArray | null;

    while ((jsonMatch = jsonRegex.exec(text)) !== null) {
      try {
        const obj = JSON.parse(jsonMatch[0]);
        const titleID = obj.titleID ?? obj.ASIN;
        if (!titleID || seen.has(titleID)) continue;
        seen.add(titleID);

        items.push({
          titleID,
          title: obj.title ?? obj.name ?? undefined,
          image: obj.image?.url
            ? { url: obj.image.url }
            : obj.packshot
              ? { url: obj.packshot }
              : undefined,
        });
      } catch {
        /* skip malformed JSON */
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTitleId(href: string): string | undefined {
  return (
    href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
    href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
    href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
    undefined
  );
}

function pickBestImage(container: Element): string | undefined {
  // Prefer larger images — look for srcset or data-src first
  for (const img of container.querySelectorAll("img")) {
    const src =
      img.getAttribute("data-src") ??
      img.getAttribute("srcset")?.split(",")[0]?.trim().split(" ")[0] ??
      img.getAttribute("src");
    if (src && !src.includes("1x1") && !src.includes("pixel")) return src;
  }
  return undefined;
}
