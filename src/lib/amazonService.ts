/**
 * Amazon Video storefront service — thin facade.
 *
 * Re-exports from focused modules and provides high-level convenience functions.
 */

import type { ContentRow, ContentItem, Trailer, RowSkeleton } from "./types";
import type { AmazonWidgetItem, EnrichedItem } from "./amazonTypes";
import { AMAZON_ORIGIN } from "./constants";
import { fetchStorefrontHtml } from "./storefrontParser";
import { enrichItemMetadata } from "./enrichApi";

// Re-export everything consumers need
export { fetchStorefrontHtml } from "./storefrontParser";
export { enrichItemMetadata, resolvePlaybackUrl } from "./enrichApi";
export type {
  EnrichedItem,
  EnrichRequest,
  AmazonWidget,
  AmazonWidgetItem,
  StorefrontParseResult,
} from "./amazonTypes";

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Check if we're running inside the Amazon page context */
export function isAmazonContext(): boolean {
  try {
    return window.location.hostname.includes("amazon.com");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// DOM inspector (debug tool)
// ---------------------------------------------------------------------------

const STOREFRONT_URL =
  AMAZON_ORIGIN + "/gp/video/storefront/ref=atv_dp_cnc_str_0";

export async function inspectAsinInDom(asin: string): Promise<unknown> {
  const resp = await fetch(STOREFRONT_URL, {
    credentials: "include",
    headers: { Accept: "text/html" },
  });
  if (!resp.ok) return { error: `fetch failed: ${resp.status}` };

  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
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
      for (const attr of el.attributes)
        attrs[attr.name] = attr.value.slice(0, 300);
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

// ---------------------------------------------------------------------------
// Mapping: Amazon data → app types
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

  return {
    id: raw.titleID ?? `item-${Math.random().toString(36).slice(2, 8)}`,
    title: raw.title || enriched?.title || "Untitled",
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
    thumbnail:
      raw.image?.url ??
      enriched?.images?.packshot ??
      enriched?.images?.covershot,
    entitlement: focusMsg ?? highMsg ?? cues?.entitlementType,
  };
}

function mapWidgetToRow(
  widget: { widgetId?: string; title?: string; items?: AmazonWidgetItem[] },
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
// High-level convenience functions
// ---------------------------------------------------------------------------

/** Fetch storefront data, parse widgets, enrich metadata, return mapped rows. */
export async function fetchAmazonStorefront(): Promise<{
  rows: ContentRow[];
  trailers: Trailer[];
}> {
  const { widgets } = await fetchStorefrontHtml();

  const allTitleIds = new Set<string>();
  for (const w of widgets)
    for (const item of w.items ?? [])
      if (item.titleID) allTitleIds.add(item.titleID);

  const titleIdArray = [...allTitleIds];
  const enrichedMap = new Map<string, EnrichedItem>();
  const BATCH = 20;

  for (let i = 0; i < titleIdArray.length; i += BATCH) {
    const batch = titleIdArray.slice(i, i + BATCH);
    const results = await enrichItemMetadata({ titleIds: batch });
    for (const item of results)
      if (item.titleID) enrichedMap.set(item.titleID, item);
  }

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

/** Fetch just row skeletons from the storefront. */
export async function fetchAmazonRowSkeletons(): Promise<RowSkeleton[]> {
  const { widgets } = await fetchStorefrontHtml();
  return widgets
    .filter((w) => (w.items?.length ?? 0) > 0)
    .map((w, i) => ({
      id: w.widgetId ?? `amazon-row-${i}`,
      title: w.title ?? `Row ${i + 1}`,
    }));
}
