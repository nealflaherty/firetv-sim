/**
 * Amazon Video storefront service adapter.
 *
 * Fetches the storefront page HTML via HTTP (same-origin in UserScript context),
 * parses embedded widget/carousel data from the response,
 * then calls /gp/video/api/enrichItemMetadata to get rich metadata.
 */

import type { ContentRow, ContentItem, Trailer, RowSkeleton } from "./types";

// ---------------------------------------------------------------------------
// Types for the raw Amazon data structures
// ---------------------------------------------------------------------------

interface AmazonWidget {
  widgetId?: string;
  title?: string;
  items?: AmazonWidgetItem[];
}

interface AmazonWidgetItem {
  titleID?: string;
  title?: string;
  image?: { url?: string };
  synopsis?: string;
  releaseYear?: string | number;
  runtimeSeconds?: number;
  ratingCount?: number;
  customerReviewStarRating?: number;
  maturityRating?: { displayString?: string };
}

interface EnrichResponse {
  enrichedItems?: EnrichedItem[];
  enrichments?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  __type?: string;
  [key: string]: unknown;
}

interface EnrichedItem {
  titleID?: string;
  title?: string;
  synopsis?: string;
  releaseYear?: number;
  runtimeSeconds?: number;
  customerReviewStarRating?: number;
  ratingCount?: number;
  maturityRating?: { displayString?: string };
  images?: { packshot?: string; hero?: string; covershot?: string };
  entitlementCues?: {
    entitlementType?: string;
    focusMessage?: string;
    highValueMessage?: string;
  };
  trailer?: {
    correlationId?: string;
    playbackEnvelope?: string;
  };
  watchlistAction?: {
    endpoint?: string;
  };
  [key: string]: unknown; // capture any extra fields for debugging
}

// ---------------------------------------------------------------------------
// Fetch + parse storefront HTML
// ---------------------------------------------------------------------------

const AMAZON_ORIGIN = "https://www.amazon.com";
const STOREFRONT_URL =
  AMAZON_ORIGIN + "/gp/video/storefront/ref=atv_dp_cnc_str_0";

/**
 * Fetch the storefront page HTML and parse embedded data from it.
 * Works from same-origin (UserScript on amazon.com) or returns empty otherwise.
 */
export async function fetchStorefrontHtml(): Promise<{
  widgets: AmazonWidget[];
  rawScripts: { index: number; length: number; snippet: string }[];
  rawWidgetSamples: unknown[];
  domSample: unknown;
  htmlLength: number;
}> {
  const result: {
    widgets: AmazonWidget[];
    rawScripts: { index: number; length: number; snippet: string }[];
    rawWidgetSamples: unknown[];
    domSample: unknown;
    htmlLength: number;
  } = {
    widgets: [],
    rawScripts: [],
    rawWidgetSamples: [],
    domSample: null,
    htmlLength: 0,
  };

  try {
    const resp = await fetch(STOREFRONT_URL, {
      credentials: "include",
      headers: { Accept: "text/html" },
    });
    if (!resp.ok) {
      console.warn(`[amazonService] Storefront fetch failed: ${resp.status}`);
      return result;
    }

    const html = await resp.text();
    result.htmlLength = html.length;

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Strategy 1: Inline script tags with embedded JSON
    const scripts = doc.querySelectorAll("script:not([src])");
    let scriptIdx = 0;
    for (const script of scripts) {
      const text = script.textContent ?? "";
      if (text.length < 50) continue;

      const interesting =
        text.includes("titleID") ||
        text.includes('"title"') ||
        text.includes("ASIN") ||
        text.includes("widget") ||
        text.includes("carousel") ||
        text.includes("slate") ||
        text.includes("itemList");

      if (interesting) {
        result.rawScripts.push({
          index: scriptIdx,
          length: text.length,
          snippet: text.slice(0, 2000),
        });

        // Try to parse the whole thing as JSON
        try {
          const data = JSON.parse(text);
          extractWidgets(data, result.widgets, result.rawWidgetSamples);
        } catch {
          // Try to find JSON objects embedded in JS assignments
          // e.g. window.__data = {...};
          const jsonBlobs = findJsonBlobs(text);
          for (const blob of jsonBlobs) {
            try {
              const data = JSON.parse(blob);
              extractWidgets(data, result.widgets, result.rawWidgetSamples);
            } catch {
              /* skip */
            }
          }
        }
      }
      scriptIdx++;
    }

    // Strategy 2: JSON-LD structured data
    const jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const el of jsonLd) {
      try {
        const data = JSON.parse(el.textContent ?? "");
        if (data?.itemListElement || data?.["@type"] === "ItemList") {
          const items: AmazonWidgetItem[] = (data.itemListElement ?? []).map(
            (e: Record<string, unknown>) => ({
              titleID: String(e.url ?? "").match(/\/dp\/([A-Z0-9]+)/)?.[1],
              title: e.name as string,
              image: { url: (e.image as string) ?? undefined },
            }),
          );
          if (items.length > 0) {
            result.widgets.push({ title: "Featured", items });
          }
        }
      } catch {
        /* skip */
      }
    }

    // Strategy 3: data-* attributes on elements
    const dataEls = doc.querySelectorAll(
      "[data-card-items], [data-asin], [data-title-id]",
    );
    for (const el of dataEls) {
      const raw = el.getAttribute("data-card-items");
      if (raw) {
        try {
          const items = JSON.parse(raw) as AmazonWidgetItem[];
          const heading =
            el
              .closest("[data-widget-id]")
              ?.querySelector("h2, h3")
              ?.textContent?.trim() ?? "Untitled";
          result.widgets.push({
            widgetId:
              el.closest("[data-widget-id]")?.getAttribute("data-widget-id") ??
              undefined,
            title: heading,
            items,
          });
        } catch {
          /* skip */
        }
      }
    }

    // Strategy 4: Scrape DOM structure for carousel sections
    const domRows = parseDomCarousels(doc);
    result.widgets.push(...domRows);

    // Strategy 5: Dump DOM structure sample for debugging
    result.domSample = sampleDomStructure(doc);
  } catch (err) {
    console.warn("[amazonService] fetchStorefrontHtml error:", err);
  }

  return result;
}

/** Find JSON-like blobs in a JS string (assignments like `var x = {...}`) */
function findJsonBlobs(text: string): string[] {
  const blobs: string[] = [];
  const re = /[=:]\s*(\{[\s\S]{50,}?\})\s*[;,\n]/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    blobs.push(match[1]);
  }
  return blobs;
}

/**
 * Parse the DOM for carousel/row sections.
 * Amazon Video storefront renders carousels as sections with heading + card list.
 */
function parseDomCarousels(doc: Document): AmazonWidget[] {
  const widgets: AmazonWidget[] = [];

  // Look for common carousel/row patterns in Amazon Video pages
  // Try various selectors that Amazon uses for content rows
  const selectors = [
    // Carousel containers
    '[class*="carousel"]',
    '[class*="Carousel"]',
    '[class*="slider"]',
    '[class*="Slider"]',
    // Content row sections
    '[class*="content-row"]',
    '[class*="ContentRow"]',
    // Card grids
    '[class*="card-grid"]',
    '[class*="CardGrid"]',
    // Amazon-specific patterns
    '[data-testid*="carousel"]',
    '[data-testid*="row"]',
    '[data-automation-id*="carousel"]',
    '[data-automation-id*="row"]',
  ];

  for (const sel of selectors) {
    try {
      const containers = doc.querySelectorAll(sel);
      for (const container of containers) {
        const items = extractCardsFromContainer(container);
        if (items.length >= 2) {
          // Find a heading nearby
          const heading = findNearestHeading(container);
          widgets.push({
            widgetId:
              container.getAttribute("data-testid") ??
              container.getAttribute("data-automation-id") ??
              undefined,
            title: heading ?? "Untitled Row",
            items,
          });
        }
      }
    } catch {
      /* skip selector */
    }
  }

  // Also try: find all links that point to /dp/ or /detail/ (title pages)
  // and group them by their row container
  if (widgets.length === 0) {
    const titleLinks = doc.querySelectorAll(
      'a[href*="/dp/"], a[href*="/detail/"], a[href*="/gp/video/detail/"]',
    );

    // First pass: extract unique title items from links
    const linkItems: { el: Element; item: AmazonWidgetItem }[] = [];
    const seenInLink = new Set<string>();

    for (const link of titleLinks) {
      const href = link.getAttribute("href") ?? "";
      // Match both ASIN format (/dp/B00...) and internal titleID format (/detail/0NU...)
      const titleID =
        href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
        href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
        href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];
      if (!titleID) continue;

      // Find the best image — look for the largest/most relevant one
      const img = link.querySelector("img");
      const imgUrl = img?.getAttribute("src") ?? undefined;

      // Skip tiny tracking pixels or icons
      if (imgUrl && (imgUrl.includes("1x1") || imgUrl.includes("pixel")))
        continue;

      // Find title text — try multiple strategies
      const title =
        link.getAttribute("aria-label") ??
        img?.getAttribute("alt") ??
        link
          .querySelector('[class*="title"], [class*="Title"], h3, h4, span')
          ?.textContent?.trim() ??
        link.textContent?.trim();

      // Deduplicate: only keep the first (usually best) link per titleID per parent
      const dedupeKey =
        titleID + "|" + (link.parentElement?.parentElement?.className ?? "");
      if (seenInLink.has(dedupeKey)) continue;
      seenInLink.add(dedupeKey);

      linkItems.push({
        el: link,
        item: {
          titleID,
          title: title || undefined,
          image: imgUrl ? { url: imgUrl } : undefined,
        },
      });
    }

    // Second pass: group by row container
    // Walk up from each link to find a shared ancestor that contains multiple items
    const byRow = new Map<Element, AmazonWidgetItem[]>();

    for (const { el, item } of linkItems) {
      // Walk up to find the row-level container (typically 3-5 levels up)
      let row: Element | null = el;
      for (let i = 0; i < 6 && row; i++) {
        row = row.parentElement;
        if (!row) break;
        // Check if this container has a class suggesting it's a row/carousel
        const cls = row.className ?? "";
        if (
          cls.includes("carousel") ||
          cls.includes("Carousel") ||
          cls.includes("slider") ||
          cls.includes("Slider") ||
          cls.includes("row") ||
          cls.includes("Row") ||
          cls.includes("shelf") ||
          cls.includes("Shelf")
        ) {
          break;
        }
      }
      // Fallback: use grandparent^3
      if (!row)
        row =
          el.parentElement?.parentElement?.parentElement ??
          el.parentElement ??
          el;

      const existing = byRow.get(row) ?? [];
      // Deduplicate within the same row
      if (!existing.some((e) => e.titleID === item.titleID)) {
        existing.push(item);
      }
      byRow.set(row, existing);
    }

    for (const [container, items] of byRow) {
      if (items.length >= 2) {
        const heading = findNearestHeading(container);
        widgets.push({
          title: heading ?? "Content Row",
          items,
        });
      }
    }
  }

  return widgets;
}

function extractCardsFromContainer(container: Element): AmazonWidgetItem[] {
  const items: AmazonWidgetItem[] = [];
  const seenIds = new Set<string>();

  // Look for card-like children with images and links
  const cards = container.querySelectorAll(
    'a[href*="/dp/"], a[href*="/detail/"], [class*="card"], [class*="Card"], [class*="tile"], [class*="Tile"]',
  );

  for (const card of cards) {
    const link = card.closest("a") ?? card.querySelector("a");
    const href = link?.getAttribute("href") ?? "";
    const titleID =
      href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
      href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
      href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];

    // Deduplicate by titleID
    if (titleID && seenIds.has(titleID)) continue;
    if (titleID) seenIds.add(titleID);

    const img = card.querySelector("img");
    const imgUrl = img?.getAttribute("src") ?? undefined;

    // Skip tracking pixels
    if (imgUrl && (imgUrl.includes("1x1") || imgUrl.includes("pixel")))
      continue;

    // Try multiple strategies for title text
    const title =
      card.getAttribute("aria-label") ??
      link?.getAttribute("aria-label") ??
      img?.getAttribute("alt") ??
      card
        .querySelector('[class*="title"], [class*="Title"], h3, h4, span')
        ?.textContent?.trim() ??
      link?.textContent?.trim();

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

function findNearestHeading(el: Element): string | null {
  // Walk up and look for a heading before this element
  let current: Element | null = el;
  for (let i = 0; i < 5 && current; i++) {
    const heading = current.querySelector(
      "h2, h3, h4, [class*='heading'], [class*='Heading']",
    );
    if (heading?.textContent?.trim()) return heading.textContent.trim();

    // Check previous sibling
    const prev = current.previousElementSibling;
    if (prev) {
      const h =
        prev.querySelector("h2, h3, h4") ??
        (prev.matches("h2, h3, h4") ? prev : null);
      if (h?.textContent?.trim()) return h.textContent.trim();
    }

    current = current.parentElement;
  }
  return null;
}

/**
 * Dump a sample of the DOM structure for debugging.
 * Shows the top-level sections and their class names / data attributes.
 */
function sampleDomStructure(doc: Document): unknown {
  const body = doc.body;
  if (!body) return { error: "no body" };

  const sample: unknown[] = [];

  // Walk top-level children and a couple levels deep
  function describeEl(el: Element, depth: number): unknown {
    const attrs: Record<string, string> = {};
    for (const attr of el.attributes) {
      if (
        attr.name === "class" ||
        attr.name.startsWith("data-") ||
        attr.name === "id" ||
        attr.name === "role" ||
        attr.name === "aria-label"
      ) {
        attrs[attr.name] = attr.value.slice(0, 200);
      }
    }

    const desc: Record<string, unknown> = {
      tag: el.tagName.toLowerCase(),
      attrs,
      childCount: el.children.length,
    };

    // Include text if it's a leaf-ish node
    if (el.children.length === 0 && el.textContent?.trim()) {
      desc.text = el.textContent.trim().slice(0, 100);
    }

    // Recurse a couple levels
    if (depth < 3 && el.children.length > 0 && el.children.length <= 20) {
      desc.children = Array.from(el.children).map((c) =>
        describeEl(c, depth + 1),
      );
    } else if (el.children.length > 20) {
      desc.childrenSample = Array.from(el.children)
        .slice(0, 5)
        .map((c) => describeEl(c, depth + 1));
      desc.childrenTruncated = el.children.length;
    }

    return desc;
  }

  // Get top-level structure
  for (const child of body.children) {
    sample.push(describeEl(child, 0));
    if (sample.length >= 10) break;
  }

  return { bodyChildCount: body.children.length, topLevel: sample };
}

/** Recursively walk an object looking for widget-shaped data */
function extractWidgets(
  obj: unknown,
  out: AmazonWidget[],
  rawSamples: unknown[],
  depth = 0,
): void {
  if (depth > 8 || !obj || typeof obj !== "object") return;

  const o = obj as Record<string, unknown>;

  // Check if this looks like a widget with items
  if (Array.isArray(o.items) && o.items.length > 0) {
    // Filter out non-content widgets (menus, actions, etc.)
    const firstItem = o.items[0] as Record<string, unknown> | undefined;
    const looksLikeContent =
      firstItem &&
      typeof firstItem === "object" &&
      // Content items typically have titleID, image, or title fields
      // Skip items that are just action/menu entries
      !("itemType" in firstItem && firstItem.itemType === "WatchlistAction") &&
      !(
        "__type" in firstItem &&
        String(firstItem.__type).includes("OverflowMenu")
      );

    // Save a raw sample of the first few items (unmodified) for debugging
    if (rawSamples.length < 10) {
      rawSamples.push({
        _keys: Object.keys(o),
        _title: o.title ?? o.headerText ?? o.sectionTitle ?? o.name,
        _itemCount: o.items.length,
        _firstItemKeys: firstItem ? Object.keys(firstItem) : [],
        _firstItem: firstItem,
        _secondItem: o.items[1],
        _looksLikeContent: looksLikeContent,
      });
    }

    if (looksLikeContent) {
      out.push({
        widgetId: (o.widgetId ?? o.id ?? o.slateId) as string | undefined,
        title: (o.title ?? o.headerText ?? o.sectionTitle) as
          | string
          | undefined,
        items: o.items as AmazonWidgetItem[],
      });
    }
  }

  // Check for widgets array
  if (Array.isArray(o.widgets)) {
    for (const w of o.widgets) {
      extractWidgets(w, out, rawSamples, depth + 1);
    }
  }

  // Recurse into object values
  for (const val of Object.values(o)) {
    if (val && typeof val === "object") {
      extractWidgets(val, out, rawSamples, depth + 1);
    }
  }
}

// ---------------------------------------------------------------------------
// enrichItemMetadata API call
// ---------------------------------------------------------------------------

interface EnrichRequest {
  titleIds: string[];
  deviceTypeId?: string;
  marketplaceId?: string;
}

export async function enrichItemMetadata(
  req: EnrichRequest,
): Promise<EnrichedItem[]> {
  const { titleIds } = req;
  if (titleIds.length === 0) return [];

  // The real API uses form-urlencoded with these params:
  // - metadataToEnrich: JSON object with boolean flags
  // - titleIDsToEnrich: JSON array of ASIN strings
  // - currentUrl: the storefront URL
  // - journeyIngressContext: empty string
  const metadataToEnrich = JSON.stringify({
    placement: "HOVER",
    playback: true,
    preroll: true,
    trailer: true,
    watchlist: true,
  });

  const titleIDsToEnrich = JSON.stringify(titleIds);

  const formBody = new URLSearchParams({
    metadataToEnrich,
    titleIDsToEnrich,
    journeyIngressContext: "",
    currentUrl: "https://www.amazon.com/gp/video/storefront",
  });

  try {
    const resp = await fetch(
      `${AMAZON_ORIGIN}/gp/video/api/enrichItemMetadata`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: formBody.toString(),
      },
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.warn(
        `[amazonService] enrichItemMetadata failed: ${resp.status}`,
        text.slice(0, 500),
      );
      return [];
    }

    const text = await resp.text();
    if (
      text.trimStart().startsWith("<!") ||
      text.trimStart().startsWith("<html")
    ) {
      console.warn(
        "[amazonService] enrichItemMetadata returned HTML — possible auth redirect",
      );
      return [];
    }

    const data = JSON.parse(text) as EnrichResponse;
    console.log("[amazonService] enrichItemMetadata raw response:", data);

    // Try multiple response shapes
    if (data.enrichedItems && data.enrichedItems.length > 0) {
      return data.enrichedItems;
    }

    // The API returns enrichments keyed by titleID
    if (data.enrichments && typeof data.enrichments === "object") {
      const items: EnrichedItem[] = [];
      for (const [key, val] of Object.entries(data.enrichments)) {
        if (val && typeof val === "object") {
          items.push({
            titleID: key,
            ...(val as Record<string, unknown>),
          } as EnrichedItem);
        }
      }
      if (items.length > 0) return items;
    }

    console.warn(
      "[amazonService] Unexpected enrich response shape:",
      Object.keys(data),
    );
    return [];
  } catch (err) {
    console.warn("[amazonService] enrichItemMetadata error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Map Amazon data → app types
// ---------------------------------------------------------------------------

function mapWidgetItem(
  raw: AmazonWidgetItem,
  enriched?: EnrichedItem,
): ContentItem {
  const entitlementMsg =
    enriched?.entitlementCues?.focusMessage ??
    enriched?.entitlementCues?.highValueMessage ??
    enriched?.entitlementCues?.entitlementType;

  // Title: prefer widget item title, fall back to enriched title
  const title = raw.title || enriched?.title || "Untitled";

  // Image: prefer widget item image, fall back to enriched images
  const thumbnail =
    raw.image?.url ?? enriched?.images?.packshot ?? enriched?.images?.covershot;

  return {
    id: raw.titleID ?? `item-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description: raw.synopsis ?? enriched?.synopsis,
    year:
      raw.releaseYear != null
        ? String(raw.releaseYear)
        : enriched?.releaseYear != null
          ? String(enriched.releaseYear)
          : undefined,
    runtime:
      raw.runtimeSeconds != null
        ? Math.round(raw.runtimeSeconds / 60)
        : enriched?.runtimeSeconds != null
          ? Math.round(enriched.runtimeSeconds / 60)
          : undefined,
    rating:
      raw.customerReviewStarRating != null
        ? String(raw.customerReviewStarRating)
        : enriched?.customerReviewStarRating != null
          ? String(enriched.customerReviewStarRating)
          : undefined,
    ratingCount: raw.ratingCount ?? enriched?.ratingCount,
    maturity:
      raw.maturityRating?.displayString ??
      enriched?.maturityRating?.displayString,
    thumbnail,
    entitlement: entitlementMsg,
  };
}

function mapWidgetToRow(
  widget: AmazonWidget,
  enrichedMap: Map<string, EnrichedItem>,
  index: number,
): ContentRow {
  return {
    id: widget.widgetId ?? `amazon-row-${index}`,
    title: widget.title ?? `Row ${index + 1}`,
    items: (widget.items ?? []).map((item) =>
      mapWidgetItem(
        item,
        item.titleID ? enrichedMap.get(item.titleID) : undefined,
      ),
    ),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Check if we're running inside the Amazon page context */
export function isAmazonContext(): boolean {
  try {
    return window.location.hostname.includes("amazon.com");
  } catch {
    return false;
  }
}

/**
 * Inspect the DOM around a specific ASIN to understand the HTML structure.
 * Returns the ancestor chain and sibling elements for debugging.
 */
export async function inspectAsinInDom(asin: string): Promise<unknown> {
  const resp = await fetch(STOREFRONT_URL, {
    credentials: "include",
    headers: { Accept: "text/html" },
  });
  if (!resp.ok) return { error: `fetch failed: ${resp.status}` };

  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Find the first link containing this ASIN
  const link = doc.querySelector(`a[href*="${asin}"]`);
  if (!link) return { error: `No link found for ${asin}` };

  // Walk up the ancestor chain and describe each level
  const ancestors: unknown[] = [];
  let el: Element | null = link;
  for (let i = 0; i < 8 && el; i++) {
    const attrs: Record<string, string> = {};
    for (const attr of el.attributes) {
      attrs[attr.name] = attr.value.slice(0, 300);
    }
    ancestors.push({
      depth: i,
      tag: el.tagName.toLowerCase(),
      attrs,
      childCount: el.children.length,
      textSnippet: el.textContent?.trim().slice(0, 200) ?? "",
      outerSnippet: el.outerHTML.slice(0, 500),
    });
    el = el.parentElement;
  }

  return { asin, linkHref: link.getAttribute("href"), ancestors };
}

/**
 * Fetch storefront data via HTTP, parse widgets, enrich metadata.
 */
export async function fetchAmazonStorefront(): Promise<{
  rows: ContentRow[];
  trailers: Trailer[];
}> {
  console.log("[amazonService] Fetching storefront HTML...");
  const { widgets } = await fetchStorefrontHtml();
  console.log(`[amazonService] Found ${widgets.length} widgets`);

  // Collect all ASINs/titleIDs for enrichment
  const allTitleIds = new Set<string>();
  for (const w of widgets) {
    for (const item of w.items ?? []) {
      if (item.titleID) allTitleIds.add(item.titleID);
    }
  }

  console.log(`[amazonService] Enriching ${allTitleIds.size} items...`);

  // Batch enrich in chunks of 20
  const titleIdArray = [...allTitleIds];
  const enrichedMap = new Map<string, EnrichedItem>();
  const BATCH_SIZE = 20;

  for (let i = 0; i < titleIdArray.length; i += BATCH_SIZE) {
    const batch = titleIdArray.slice(i, i + BATCH_SIZE);
    const results = await enrichItemMetadata({ titleIds: batch });
    for (const item of results) {
      if (item.titleID) enrichedMap.set(item.titleID, item);
    }
  }

  console.log(`[amazonService] Enriched ${enrichedMap.size} items`);

  const rows = widgets
    .filter((w) => (w.items?.length ?? 0) > 0)
    .map((w, i) => mapWidgetToRow(w, enrichedMap, i));

  const trailers: Trailer[] = [];
  for (const [titleId, enriched] of enrichedMap) {
    if (enriched.trailer?.playbackEnvelope) {
      const widget = widgets.find((w) =>
        w.items?.some((item) => item.titleID === titleId),
      );
      const item = widget?.items?.find((i) => i.titleID === titleId);
      trailers.push({
        id: titleId,
        title: item?.title ?? titleId,
        videoSrc: enriched.trailer.playbackEnvelope,
      });
    }
  }

  return { rows, trailers: trailers.slice(0, 5) };
}

/**
 * Convenience: fetch just row skeletons.
 */
export async function fetchAmazonRowSkeletons(): Promise<RowSkeleton[]> {
  const { widgets } = await fetchStorefrontHtml();
  return widgets
    .filter((w) => (w.items?.length ?? 0) > 0)
    .map((w, i) => ({
      id: w.widgetId ?? `amazon-row-${i}`,
      title: w.title ?? `Row ${i + 1}`,
    }));
}
