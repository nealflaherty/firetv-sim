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
  return fetchVideoCollection(FOR_YOU_URL, "forYouParser");
}

/**
 * Generic fetcher for Amazon Video collection pages that use
 * card-section + base-image + _brws_ row numbering.
 */
export async function fetchVideoCollection(
  url: string,
  tag = "videoCollection",
): Promise<ForYouResult> {
  const result: ForYouResult = { rows: [], totalItems: 0 };

  try {
    const resp = await fetch(url, {
      credentials: "include",
      headers: { Accept: "text/html" },
    });
    if (!resp.ok) {
      console.warn(`[${tag}] Fetch failed: ${resp.status}`);
      return result;
    }

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    result.rows = extractRows(doc);
    result.totalItems = result.rows.reduce((s, r) => s + r.items.length, 0);
    console.log(
      `[${tag}] Found ${result.rows.length} rows, ${result.totalItems} items`,
    );
  } catch (err) {
    console.warn(`[${tag}] Error:`, err);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Row extraction — groups items by the row number in the ref param
// ---------------------------------------------------------------------------

function extractRows(doc: Document): ForYouRow[] {
  const rows: ForYouRow[] = [];
  const seen = new Set<string>();

  // Strategy 1: Find carousel wrappers and extract cards from each
  const carousels = doc.querySelectorAll(
    '[data-testid="navigation-carousel-wrapper"]',
  );

  console.log(
    `[videoCollection] Found ${carousels.length} carousels, ${doc.querySelectorAll('[data-testid="card-section"]').length} total cards`,
  );

  for (const carousel of carousels) {
    const heading = carousel
      .querySelector("h2, h3, [class*='heading'], [class*='Heading']")
      ?.textContent?.trim();

    const cards = carousel.querySelectorAll('[data-testid="card-section"]');
    const items: AmazonWidgetItem[] = [];

    console.log(
      `[videoCollection] Carousel "${heading}": ${cards.length} cards`,
    );

    for (const card of cards) {
      const item = extractCardItem(card, seen);
      if (item) {
        console.log(
          `[videoCollection]   Item: ${item.title}, img: ${item.image?.url?.slice(0, 60)}`,
        );
        items.push(item);
      }
    }

    if (items.length >= 2) {
      rows.push({
        rowIndex: rows.length,
        title: heading ?? `Row ${rows.length + 1}`,
        items,
      });
    }
  }

  // Strategy 2: Pick up card-sections not inside a carousel wrapper
  if (rows.length === 0) {
    const allCards = doc.querySelectorAll('[data-testid="card-section"]');
    const rowMap = new Map<number, AmazonWidgetItem[]>();

    for (const card of allCards) {
      const item = extractCardItem(card, seen);
      if (!item) continue;

      // Try to group by _brws_ ref
      const link = card.querySelector("a[href]");
      const href = link?.getAttribute("href") ?? "";
      const rowMatch = href.match(/_brws_(\d+)_/);
      const rowIndex = rowMatch ? parseInt(rowMatch[1], 10) : 0;

      const items = rowMap.get(rowIndex) ?? [];
      items.push(item);
      rowMap.set(rowIndex, items);
    }

    const headings = extractRowHeadings(doc);
    for (const [idx, items] of [...rowMap.entries()].sort(
      ([a], [b]) => a - b,
    )) {
      if (items.length >= 2) {
        rows.push({
          rowIndex: idx,
          title: headings.get(idx) ?? `Row ${idx}`,
          items,
        });
      }
    }
  }

  // Strategy 3: Fallback to link-based extraction
  if (rows.length === 0) {
    const linkItems: AmazonWidgetItem[] = [];
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

      const title =
        link.getAttribute("aria-label") ??
        link.textContent?.trim() ??
        undefined;

      linkItems.push({ titleID, title: title || undefined });
    }
    if (linkItems.length >= 2) {
      rows.push({ rowIndex: 0, title: "Content", items: linkItems });
    }
  }

  return rows;
}

/** Extract a single item from a card-section element */
function extractCardItem(
  card: Element,
  seen: Set<string>,
): AmazonWidgetItem | null {
  // Get image
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
        src.includes("le-target-images") ||
        src.includes("m.media-amazon.com/images/I/")
      ) {
        imgUrl = src;
        break;
      }
    }
  }

  // Also try to get a meaningful alt from any image in the card
  const anyImgWithAlt = card.querySelector("img[alt][src]");
  const fallbackAlt = anyImgWithAlt?.getAttribute("alt") ?? "";

  // Try standard /dp/ link first
  const link = card.querySelector(
    'a[href*="/gp/video/detail/"], a[href*="/dp/"], a[href*="/detail/"]',
  );

  if (link) {
    const href = link.getAttribute("href") ?? "";
    const titleID =
      href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
      href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
      href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1];
    if (!titleID || seen.has(titleID)) return null;
    seen.add(titleID);

    const title =
      link.getAttribute("aria-label") ?? link.textContent?.trim() ?? undefined;

    return {
      titleID,
      title: title || undefined,
      image: imgUrl ? { url: imgUrl } : undefined,
    };
  }

  // No /dp/ link — use image alt text (live channels, news)
  if (imgUrl) {
    const imgAlt = baseImg?.getAttribute("alt") ?? fallbackAlt;
    if (!imgAlt || imgAlt.length < 3) return null;

    const id = `card-${imgAlt
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .slice(0, 40)}`;
    if (seen.has(id)) return null;
    seen.add(id);

    return {
      titleID: id,
      title: imgAlt,
      image: { url: imgUrl },
    };
  }

  return null;
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
