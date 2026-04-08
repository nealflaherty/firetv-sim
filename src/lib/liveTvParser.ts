/**
 * Parser for Amazon Video Live TV page.
 * URL: /gp/video/livetv
 *
 * Same card-section + base-image structure as the ForYou page,
 * plus station-window channel logos.
 */

import { AMAZON_ORIGIN } from "./constants";
import type { AmazonWidgetItem } from "./amazonTypes";

const LIVE_TV_URL = `${AMAZON_ORIGIN}/gp/video/livetv`;

export interface LiveTvRow {
  rowIndex: number;
  title: string;
  items: AmazonWidgetItem[];
}

export interface LiveTvResult {
  rows: LiveTvRow[];
  totalItems: number;
}

export async function fetchLiveTv(): Promise<LiveTvResult> {
  const result: LiveTvResult = { rows: [], totalItems: 0 };

  try {
    const resp = await fetch(LIVE_TV_URL, {
      credentials: "include",
      headers: { Accept: "text/html" },
    });
    if (!resp.ok) {
      console.warn(`[liveTvParser] Fetch failed: ${resp.status}`);
      return result;
    }

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    result.rows = extractRows(doc);
    result.totalItems = result.rows.reduce((s, r) => s + r.items.length, 0);
    console.log(
      `[liveTvParser] Found ${result.rows.length} rows, ${result.totalItems} items`,
    );
  } catch (err) {
    console.warn("[liveTvParser] Error:", err);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Row extraction — card-sections grouped by _brws_ row number,
// plus non-card items (live channels) as additional rows
// ---------------------------------------------------------------------------

function extractRows(doc: Document): LiveTvRow[] {
  const rowMap = new Map<number, AmazonWidgetItem[]>();
  const seen = new Set<string>();

  // Strategy 1: card-section elements (sports/events)
  const cards = doc.querySelectorAll('[data-testid="card-section"]');
  for (const card of cards) {
    const link = card.querySelector(
      'a[href*="/gp/video/detail/"], a[href*="/dp/"], a[href*="/detail/"]',
    );
    if (!link) continue;

    const href = link.getAttribute("href") ?? "";
    const titleID =
      href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
      href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
      href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1];
    if (!titleID || seen.has(titleID)) continue;
    seen.add(titleID);

    const rowMatch = href.match(/_brws_(\d+)_(\d+)/);
    const rowIndex = rowMatch ? parseInt(rowMatch[1], 10) : 0;

    // Image from base-image or le-target-images
    let imgUrl: string | undefined;
    const baseImg = card.querySelector('[data-testid="base-image"] img[src]');
    if (baseImg) {
      imgUrl = baseImg.getAttribute("src") ?? undefined;
    }
    if (!imgUrl) {
      for (const img of card.querySelectorAll("img[src]")) {
        const src = img.getAttribute("src") ?? "";
        if (
          src.includes("pv-target-images") ||
          src.includes("le-target-images")
        ) {
          imgUrl = src;
          break;
        }
      }
    }

    const title =
      link.getAttribute("aria-label") ?? link.textContent?.trim() ?? undefined;

    const items = rowMap.get(rowIndex) ?? [];
    items.push({
      titleID,
      title: title || undefined,
      image: imgUrl ? { url: imgUrl } : undefined,
    });
    rowMap.set(rowIndex, items);
  }

  // Strategy 2: Live channel items (base-image with alt text, not in card-sections)
  // These are the always-on channels like ABC News, CBS News, etc.
  const channelItems: AmazonWidgetItem[] = [];
  const channelImgs = doc.querySelectorAll(
    '[data-testid="base-image"] img[alt][src]',
  );
  for (const img of channelImgs) {
    const alt = img.getAttribute("alt") ?? "";
    const src = img.getAttribute("src") ?? "";
    if (!alt || alt.length < 3) continue;
    // Skip images already captured via card-sections
    if (img.closest('[data-testid="card-section"]')) continue;
    // Skip nav/chrome images
    if (src.includes("sprite") || src.includes("logo-min-remaster")) continue;

    const nearestLink = img.closest("a");
    const href = nearestLink?.getAttribute("href") ?? "";
    const titleID =
      href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
      href.match(/\/dp\/([A-Z0-9]{10})/)?.[1];

    const id =
      titleID ?? `live-${alt.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);

    channelItems.push({
      titleID: titleID ?? id,
      title: alt,
      image: { url: src },
    });
  }

  // Find row headings
  const headings = extractRowHeadings(doc);

  // Build result
  const rows: LiveTvRow[] = [...rowMap.entries()]
    .sort(([a], [b]) => a - b)
    .filter(([, items]) => items.length >= 2)
    .map(([idx, items]) => ({
      rowIndex: idx,
      title: headings.get(idx) ?? `Live ${idx}`,
      items,
    }));

  // Add channels as a separate row
  if (channelItems.length >= 2) {
    rows.push({
      rowIndex: 999,
      title: "Live Channels",
      items: channelItems,
    });
  }

  return rows;
}

function extractRowHeadings(doc: Document): Map<number, string> {
  const headings = new Map<number, string>();

  const sections = doc.querySelectorAll(
    '[data-testid="navigation-carousel-wrapper"], [data-testid="standard-carousel"]',
  );

  for (const section of sections) {
    const heading = section
      .querySelector("h2, h3, [class*='heading'], [class*='Heading']")
      ?.textContent?.trim();
    if (!heading) continue;

    const firstLink = section.querySelector('a[href*="_brws_"]');
    if (!firstLink) continue;

    const href = firstLink.getAttribute("href") ?? "";
    const rowMatch = href.match(/_brws_(\d+)_/);
    if (rowMatch) {
      const idx = parseInt(rowMatch[1], 10);
      if (!headings.has(idx)) {
        headings.set(idx, heading);
      }
    }
  }

  return headings;
}
