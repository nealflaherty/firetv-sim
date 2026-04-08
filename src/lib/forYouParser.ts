/**
 * Parser for Amazon Video "For You" recommendations page.
 * URL: /gp/video/collection/mgForYou
 *
 * This page is server-rendered HTML with /gp/video/detail/ links.
 * The ref params encode row numbers (e.g. _brws_2_5 = row 2, item 5).
 */

import { AMAZON_ORIGIN } from "./constants";
import type { AmazonWidgetItem } from "./amazonTypes";

const FOR_YOU_URL = `${AMAZON_ORIGIN}/gp/video/collection/mgForYou`;

export interface ForYouRow {
  rowIndex: number;
  title: string;
  items: AmazonWidgetItem[];
}

export interface ForYouResult {
  rows: ForYouRow[];
  totalItems: number;
}

export async function fetchForYou(): Promise<ForYouResult> {
  const result: ForYouResult = { rows: [], totalItems: 0 };

  try {
    const resp = await fetch(FOR_YOU_URL, {
      credentials: "include",
      headers: { Accept: "text/html" },
    });
    if (!resp.ok) {
      console.warn(`[forYouParser] Fetch failed: ${resp.status}`);
      return result;
    }

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    result.rows = extractRows(doc);
    result.totalItems = result.rows.reduce((s, r) => s + r.items.length, 0);
    console.log(
      `[forYouParser] Found ${result.rows.length} rows, ${result.totalItems} items`,
    );
  } catch (err) {
    console.warn("[forYouParser] Error:", err);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Row extraction — groups items by the row number in the ref param
// ---------------------------------------------------------------------------

function extractRows(doc: Document): ForYouRow[] {
  const rowMap = new Map<number, AmazonWidgetItem[]>();
  const seen = new Set<string>();

  // Strategy 1: Use card-section elements — each has a link + base-image
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

    // Row number from ref param: _brws_2_5 → row 2
    const rowMatch = href.match(/_brws_(\d+)_(\d+)/);
    const rowIndex = rowMatch ? parseInt(rowMatch[1], 10) : 0;

    // Image: look for base-image or any pv-target-images img in the card
    let imgUrl: string | undefined;
    const baseImg = card.querySelector('[data-testid="base-image"] img[src]');
    if (baseImg) {
      imgUrl = baseImg.getAttribute("src") ?? undefined;
    }
    if (!imgUrl) {
      for (const img of card.querySelectorAll("img[src]")) {
        const src = img.getAttribute("src") ?? "";
        if (src.includes("pv-target-images")) {
          imgUrl = src;
          break;
        }
      }
    }

    // Title from link
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

  // Strategy 2: Fallback to link-based extraction if no card-sections found
  if (rowMap.size === 0) {
    const links = doc.querySelectorAll(
      'a[href*="/gp/video/detail/"], a[href*="/dp/"], a[href*="/detail/"]',
    );
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      const titleID =
        href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
        href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
        href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1];
      if (!titleID || seen.has(titleID)) continue;
      seen.add(titleID);

      const rowMatch = href.match(/_brws_(\d+)_(\d+)/);
      const rowIndex = rowMatch ? parseInt(rowMatch[1], 10) : 0;

      const title =
        link.getAttribute("aria-label") ??
        link.textContent?.trim() ??
        undefined;

      const items = rowMap.get(rowIndex) ?? [];
      items.push({ titleID, title: title || undefined });
      rowMap.set(rowIndex, items);
    }
  }

  // Find row headings
  const headings = extractRowHeadings(doc);

  return [...rowMap.entries()]
    .sort(([a], [b]) => a - b)
    .filter(([, items]) => items.length >= 2)
    .map(([idx, items]) => ({
      rowIndex: idx,
      title: headings.get(idx) ?? `Recommended ${idx}`,
      items,
    }));
}

// ---------------------------------------------------------------------------
// Try to find section headings for each row
// ---------------------------------------------------------------------------

function extractRowHeadings(doc: Document): Map<number, string> {
  const headings = new Map<number, string>();

  // Look for heading elements near carousel/row containers
  const sections = doc.querySelectorAll(
    '[data-testid="navigation-carousel-wrapper"], [data-testid="standard-carousel"], section, [class*="carousel"], [class*="Carousel"]',
  );

  for (const section of sections) {
    const heading = section
      .querySelector("h2, h3, [class*='heading'], [class*='Heading']")
      ?.textContent?.trim();
    if (!heading) continue;

    // Find the first link in this section to determine its row index
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
