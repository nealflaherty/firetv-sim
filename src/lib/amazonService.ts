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
    focusMessage?: string | { icon?: string; message?: string };
    highValueMessage?: string | { icon?: string; message?: string };
  };
  trailer?: {
    correlationId?: string;
    playbackEnvelope?: string;
    playbackURL?: string;
    playbackID?: string;
    videoMaterialType?: string;
  };
  prerollsEnvelope?: {
    playbackEnvelope?: string;
    playbackId?: string;
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

  // Strategy A: Use the known Amazon structure — <section data-testid="standard-carousel">
  // contains <article data-card-title="..."> cards
  const carouselSections = doc.querySelectorAll(
    'section[data-testid="standard-carousel"]',
  );
  if (carouselSections.length > 0) {
    for (const section of carouselSections) {
      const items = extractCardsFromContainer(section);
      if (items.length >= 1) {
        // Title is in <h2> inside the section header
        const heading =
          section.querySelector("h2")?.textContent?.trim() ??
          section
            .querySelector('[data-testid="carousel-title"]')
            ?.textContent?.trim();
        widgets.push({
          widgetId: section.getAttribute("data-testid") ?? undefined,
          title: heading ?? "Untitled Row",
          items,
        });
      }
    }
    return deduplicateWidgets(widgets);
  }

  // Strategy B: Fallback to generic selectors
  const selectors = [
    '[class*="carousel"]',
    '[class*="Carousel"]',
    '[class*="slider"]',
    '[class*="Slider"]',
    '[class*="content-row"]',
    '[class*="ContentRow"]',
    '[class*="card-grid"]',
    '[class*="CardGrid"]',
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

      // Find title text — try data-card-title, aria-label, link text
      const article = link.closest("article[data-card-title]");
      const btn = link.parentElement?.querySelector("button[aria-label]");
      const title =
        article?.getAttribute("data-card-title") ??
        btn?.getAttribute("aria-label") ??
        link.getAttribute("aria-label") ??
        img?.getAttribute("alt") ??
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

  // Deduplicate sections with overlapping items
  return deduplicateWidgets(widgets);
}

/**
 * Remove duplicate/overlapping sections.
 * Two sections are considered duplicates if they share the same title
 * and >50% of their titleIDs overlap. Keep the one with more items.
 */
function deduplicateWidgets(widgets: AmazonWidget[]): AmazonWidget[] {
  const result: AmazonWidget[] = [];

  for (const w of widgets) {
    const wIds = new Set((w.items ?? []).map((i) => i.titleID).filter(Boolean));
    if (wIds.size === 0) continue;

    // Check if this overlaps significantly with an existing section
    let merged = false;
    for (let i = 0; i < result.length; i++) {
      const existing = result[i];
      const eIds = new Set(
        (existing.items ?? []).map((i) => i.titleID).filter(Boolean),
      );

      // Count overlap
      let overlap = 0;
      for (const id of wIds) {
        if (eIds.has(id)) overlap++;
      }

      const smaller = Math.min(wIds.size, eIds.size);
      if (smaller > 0 && overlap / smaller > 0.5) {
        // Keep the one with more items
        if ((w.items?.length ?? 0) > (existing.items?.length ?? 0)) {
          result[i] = w;
        }
        merged = true;
        break;
      }
    }

    if (!merged) {
      result.push(w);
    }
  }

  return result;
}

function extractCardsFromContainer(container: Element): AmazonWidgetItem[] {
  const items: AmazonWidgetItem[] = [];
  const seenIds = new Set<string>();

  // Amazon uses <article data-card-title="..."> for each card
  const articleCards = container.querySelectorAll("article[data-card-title]");
  if (articleCards.length > 0) {
    for (const article of articleCards) {
      const link = article.querySelector(
        'a[href*="/dp/"], a[href*="/detail/"]',
      );
      const href = link?.getAttribute("href") ?? "";
      const titleID =
        href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
        href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
        href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];

      if (titleID && seenIds.has(titleID)) continue;
      if (titleID) seenIds.add(titleID);

      const title = article.getAttribute("data-card-title") ?? undefined;
      const img = article.querySelector("img");
      const imgUrl = img?.getAttribute("src") ?? undefined;

      if (title || titleID) {
        items.push({
          titleID,
          title,
          image: imgUrl ? { url: imgUrl } : undefined,
        });
      }
    }
    return items;
  }

  // Fallback: look for links with /dp/ or /detail/
  const cards = container.querySelectorAll(
    'a[href*="/dp/"], a[href*="/detail/"]',
  );

  for (const card of cards) {
    const link = card.closest("a") ?? card.querySelector("a");
    const href = link?.getAttribute("href") ?? "";
    const titleID =
      href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
      href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
      href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];

    if (titleID && seenIds.has(titleID)) continue;
    if (titleID) seenIds.add(titleID);

    const img = card.querySelector("img");
    const imgUrl = img?.getAttribute("src") ?? undefined;
    if (imgUrl && (imgUrl.includes("1x1") || imgUrl.includes("pixel")))
      continue;

    // Try to find title from nearby article or button
    const article = card.closest("article[data-card-title]");
    const btn = card.parentElement?.querySelector("button[aria-label]");
    const title =
      article?.getAttribute("data-card-title") ??
      btn?.getAttribute("aria-label") ??
      card.getAttribute("aria-label") ??
      link?.getAttribute("aria-label") ??
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

/**
 * Fetch titles for a batch of ASINs by loading their /dp/ pages
 * and extracting the title from the HTML <title> tag.
 * Returns a map of ASIN → title.
 */
export async function fetchTitlesForAsins(
  asins: string[],
): Promise<Map<string, string>> {
  const titles = new Map<string, string>();

  // Fetch in parallel, max 5 concurrent
  const CONCURRENCY = 5;
  const queue = [...asins];

  async function worker() {
    while (queue.length > 0) {
      const asin = queue.shift();
      if (!asin) break;
      try {
        const resp = await fetch(`${AMAZON_ORIGIN}/dp/${asin}`, {
          credentials: "include",
          headers: {
            Accept: "text/html",
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        if (!resp.ok) continue;
        // Only read first chunk for the <title> tag
        const text = await resp.text();
        const match = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (match) {
          // Amazon titles are like "Watch Title | Prime Video"
          let title = match[1].trim();
          // Strip common suffixes
          title = title
            .replace(/\s*\|\s*Prime Video.*$/i, "")
            .replace(/\s*-\s*Amazon\.com.*$/i, "")
            .replace(/^Amazon\.com:\s*/i, "")
            .replace(/^Watch\s+/i, "")
            .trim();
          if (title) titles.set(asin, title);
        }
      } catch {
        /* skip */
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return titles;
}

/**
 * Resolve a playback envelope to a direct video URL via GetVodPlaybackResources.
 * Returns the highest-quality MP4 URL or null if resolution fails.
 */
export async function resolvePlaybackUrl(
  playbackEnvelope: string,
  titleId: string,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      deviceID: crypto.randomUUID(),
      deviceTypeID: "AOAGZA014O5RE",
      gascEnabled: "false",
      marketplaceID: "ATVPDKIKX0DER",
      uxLocale: "en_US",
      firmware: "1",
      titleId,
    });

    const body = {
      globalParameters: {
        deviceCapabilityFamily: "WebPlayer",
        playbackEnvelope,
        capabilityDiscriminators: {
          operatingSystem: { name: "Mac OS X", version: "10.15.7" },
          middleware: { name: "Chrome", version: "130.0.0.0" },
          nativeApplication: { name: "Chrome", version: "130.0.0.0" },
          hfrControlMode: "Legacy",
          displayResolution: { height: 1080, width: 1920 },
        },
      },
      vodPlaylistedPlaybackUrlsRequest: {
        device: {
          maxVideoResolution: "1080p",
          supportedStreamingTechnologies: ["DASH"],
          streamingTechnologies: {
            DASH: {
              bitrateAdaptations: ["CBR", "CVBR"],
              codecs: ["H264"],
              drmKeyScheme: "DualKey",
              drmType: "Widevine",
              dynamicRangeFormats: ["None"],
              edgeDeliveryAuthorizationSchemes: ["PVExchangeV1", "Transparent"],
              fragmentRepresentations: ["ByteOffsetRange", "SeparateFile"],
              frameRates: ["Standard"],
              segmentInfoType: "Base",
              timedTextRepresentations: ["NotInManifestNorStream"],
              trickplayRepresentations: ["NotInManifestNorStream"],
            },
          },
          displayWidth: 1920,
          displayHeight: 1080,
        },
        ads: { sitePageUrl: "https://www.amazon.com/gp/video/storefront" },
        playbackCustomizations: {},
        playbackSettingsRequest: {
          firmware: "UNKNOWN",
          playerType: "xp",
          responseFormatVersion: "1.0.0",
          titleId,
        },
      },
    };

    const resp = await fetch(
      `https://atv-ps.amazon.com/playback/prs/GetVodPlaybackResources?${params}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      },
    );

    if (!resp.ok) {
      console.warn(
        `[amazonService] GetVodPlaybackResources failed: ${resp.status}`,
      );
      return null;
    }

    const data = await resp.json();
    console.log("[amazonService] GetVodPlaybackResources response:", data);

    // Extract the DASH manifest URL from the response
    const playlist =
      data?.vodPlaylistedPlaybackUrls?.result?.playbackUrls?.intraTitlePlaylist;
    if (!Array.isArray(playlist) || playlist.length === 0) return null;

    const mainEntry =
      playlist.find((e: Record<string, unknown>) => e.type === "Main") ??
      playlist[0];
    const manifestUrl = (mainEntry?.urls as { url: string }[])?.[0]?.url;
    if (!manifestUrl) return null;

    // Return the DASH manifest URL — use dash.js to play it with audio+video
    return manifestUrl;
  } catch (err) {
    console.warn("[amazonService] resolvePlaybackUrl error:", err);
    return null;
  }
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
  const cues = enriched?.entitlementCues;
  const focusMsg =
    typeof cues?.focusMessage === "string"
      ? cues.focusMessage
      : cues?.focusMessage?.message;
  const highMsg =
    typeof cues?.highValueMessage === "string"
      ? cues.highValueMessage
      : cues?.highValueMessage?.message;
  const entitlementMsg = focusMsg ?? highMsg ?? cues?.entitlementType;

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

  // If asin is empty, just find the first /dp/ link
  const selector = asin ? `a[href*="${asin}"]` : 'a[href*="/dp/"]';
  const links = doc.querySelectorAll(selector);
  if (links.length === 0)
    return { error: `No link found for ${asin || "/dp/"}` };

  const results: unknown[] = [];
  for (const link of links) {
    const ancestors: unknown[] = [];
    let el: Element | null = link;
    for (let i = 0; i < 8 && el; i++) {
      const attrs: Record<string, string> = {};
      for (const attr of el.attributes) {
        attrs[attr.name] = attr.value.slice(0, 300);
      }
      let directText = "";
      for (const node of el.childNodes) {
        if (node.nodeType === 3) {
          const t = node.textContent?.trim();
          if (t) directText += t + " ";
        }
      }
      ancestors.push({
        depth: i,
        tag: el.tagName.toLowerCase(),
        attrs,
        childCount: el.children.length,
        directText: directText.trim().slice(0, 200) || undefined,
        fullText: el.textContent?.trim().slice(0, 300) ?? "",
        outerSnippet: el.outerHTML.slice(0, 800),
      });
      el = el.parentElement;
    }
    results.push({
      linkHref: link.getAttribute("href"),
      linkAriaLabel: link.getAttribute("aria-label"),
      imgAlt: link.querySelector("img")?.getAttribute("alt"),
      ancestors,
    });
    if (results.length >= 3) break;
  }

  return {
    asin: asin || "(first /dp/ link)",
    linkCount: links.length,
    links: results,
  };
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
