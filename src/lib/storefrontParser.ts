/**
 * Storefront HTML parser.
 * Fetches the Amazon Video storefront page and extracts widget/carousel data from the DOM.
 */

import { AMAZON_ORIGIN } from "./constants";
import type {
  AmazonWidget,
  AmazonWidgetItem,
  StorefrontParseResult,
} from "./amazonTypes";

const STOREFRONT_URL =
  AMAZON_ORIGIN + "/gp/video/storefront/ref=atv_dp_cnc_str_0";

export async function fetchStorefrontHtml(): Promise<StorefrontParseResult> {
  const result: StorefrontParseResult = {
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
      console.warn(`[storefrontParser] Fetch failed: ${resp.status}`);
      return result;
    }

    const html = await resp.text();
    result.htmlLength = html.length;
    const doc = new DOMParser().parseFromString(html, "text/html");

    parseInlineScripts(doc, result);
    parseJsonLd(doc, result);
    parseDataAttributes(doc, result);

    const domRows = parseDomCarousels(doc);
    result.widgets.push(...domRows);
    result.domSample = sampleDomStructure(doc);
  } catch (err) {
    console.warn("[storefrontParser] Error:", err);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Strategy 1: Inline script tags with embedded JSON
// ---------------------------------------------------------------------------

function parseInlineScripts(
  doc: Document,
  result: StorefrontParseResult,
): void {
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
      try {
        extractWidgets(
          JSON.parse(text),
          result.widgets,
          result.rawWidgetSamples,
        );
      } catch {
        for (const blob of findJsonBlobs(text)) {
          try {
            extractWidgets(
              JSON.parse(blob),
              result.widgets,
              result.rawWidgetSamples,
            );
          } catch {
            /* skip */
          }
        }
      }
    }
    scriptIdx++;
  }
}

// ---------------------------------------------------------------------------
// Strategy 2: JSON-LD structured data
// ---------------------------------------------------------------------------

function parseJsonLd(doc: Document, result: StorefrontParseResult): void {
  for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) {
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
        if (items.length > 0) result.widgets.push({ title: "Featured", items });
      }
    } catch {
      /* skip */
    }
  }
}

// ---------------------------------------------------------------------------
// Strategy 3: data-* attributes on elements
// ---------------------------------------------------------------------------

function parseDataAttributes(
  doc: Document,
  result: StorefrontParseResult,
): void {
  for (const el of doc.querySelectorAll(
    "[data-card-items], [data-asin], [data-title-id]",
  )) {
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
}

// ---------------------------------------------------------------------------
// Strategy 4: DOM carousel parsing
// ---------------------------------------------------------------------------

function parseDomCarousels(doc: Document): AmazonWidget[] {
  const widgets: AmazonWidget[] = [];

  // Strategy A: Known Amazon structure
  const carouselSections = doc.querySelectorAll(
    'section[data-testid="standard-carousel"]',
  );
  if (carouselSections.length > 0) {
    for (const section of carouselSections) {
      const items = extractCardsFromContainer(section);
      if (items.length >= 1) {
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

  // Strategy B: Generic selectors
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
      for (const container of doc.querySelectorAll(sel)) {
        const items = extractCardsFromContainer(container);
        if (items.length >= 2) {
          widgets.push({
            widgetId:
              container.getAttribute("data-testid") ??
              container.getAttribute("data-automation-id") ??
              undefined,
            title: findNearestHeading(container) ?? "Untitled Row",
            items,
          });
        }
      }
    } catch {
      /* skip */
    }
  }

  // Strategy C: Link-based grouping fallback
  if (widgets.length === 0) {
    groupLinksByRow(doc, widgets);
  }

  return deduplicateWidgets(widgets);
}

function groupLinksByRow(doc: Document, widgets: AmazonWidget[]): void {
  const titleLinks = doc.querySelectorAll(
    'a[href*="/dp/"], a[href*="/detail/"], a[href*="/gp/video/detail/"]',
  );
  const linkItems: { el: Element; item: AmazonWidgetItem }[] = [];
  const seen = new Set<string>();

  for (const link of titleLinks) {
    const href = link.getAttribute("href") ?? "";
    const titleID =
      href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
      href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
      href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];
    if (!titleID) continue;

    const img = link.querySelector("img");
    const imgUrl = img?.getAttribute("src") ?? undefined;
    if (imgUrl && (imgUrl.includes("1x1") || imgUrl.includes("pixel")))
      continue;

    const article = link.closest("article[data-card-title]");
    const btn = link.parentElement?.querySelector("button[aria-label]");
    const title =
      article?.getAttribute("data-card-title") ??
      btn?.getAttribute("aria-label") ??
      link.getAttribute("aria-label") ??
      img?.getAttribute("alt") ??
      link.textContent?.trim();

    const key =
      titleID + "|" + (link.parentElement?.parentElement?.className ?? "");
    if (seen.has(key)) continue;
    seen.add(key);

    linkItems.push({
      el: link,
      item: {
        titleID,
        title: title || undefined,
        image: imgUrl ? { url: imgUrl } : undefined,
      },
    });
  }

  const byRow = new Map<Element, AmazonWidgetItem[]>();
  for (const { el, item } of linkItems) {
    let row: Element | null = el;
    for (let i = 0; i < 6 && row; i++) {
      row = row.parentElement;
      if (!row) break;
      const cls = row.className ?? "";
      if (/carousel|slider|row|shelf/i.test(cls)) break;
    }
    if (!row)
      row =
        el.parentElement?.parentElement?.parentElement ??
        el.parentElement ??
        el;

    const existing = byRow.get(row) ?? [];
    if (!existing.some((e) => e.titleID === item.titleID)) existing.push(item);
    byRow.set(row, existing);
  }

  for (const [container, items] of byRow) {
    if (items.length >= 2) {
      widgets.push({
        title: findNearestHeading(container) ?? "Content Row",
        items,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function deduplicateWidgets(widgets: AmazonWidget[]): AmazonWidget[] {
  const result: AmazonWidget[] = [];
  for (const w of widgets) {
    const wIds = new Set((w.items ?? []).map((i) => i.titleID).filter(Boolean));
    if (wIds.size === 0) continue;
    let merged = false;
    for (let i = 0; i < result.length; i++) {
      const eIds = new Set(
        (result[i].items ?? []).map((i) => i.titleID).filter(Boolean),
      );
      let overlap = 0;
      for (const id of wIds) {
        if (eIds.has(id)) overlap++;
      }
      const smaller = Math.min(wIds.size, eIds.size);
      if (smaller > 0 && overlap / smaller > 0.5) {
        if ((w.items?.length ?? 0) > (result[i].items?.length ?? 0))
          result[i] = w;
        merged = true;
        break;
      }
    }
    if (!merged) result.push(w);
  }
  return result;
}

function extractCardsFromContainer(container: Element): AmazonWidgetItem[] {
  const items: AmazonWidgetItem[] = [];
  const seenIds = new Set<string>();

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
      const imgUrl =
        article.querySelector("img")?.getAttribute("src") ?? undefined;
      if (title || titleID)
        items.push({
          titleID,
          title,
          image: imgUrl ? { url: imgUrl } : undefined,
        });
    }
    return items;
  }

  for (const card of container.querySelectorAll(
    'a[href*="/dp/"], a[href*="/detail/"]',
  )) {
    const link = card.closest("a") ?? card.querySelector("a");
    const href = link?.getAttribute("href") ?? "";
    const titleID =
      href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
      href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
      href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];
    if (titleID && seenIds.has(titleID)) continue;
    if (titleID) seenIds.add(titleID);
    const imgUrl = card.querySelector("img")?.getAttribute("src") ?? undefined;
    if (imgUrl && (imgUrl.includes("1x1") || imgUrl.includes("pixel")))
      continue;
    const article = card.closest("article[data-card-title]");
    const btn = card.parentElement?.querySelector("button[aria-label]");
    const title =
      article?.getAttribute("data-card-title") ??
      btn?.getAttribute("aria-label") ??
      card.getAttribute("aria-label") ??
      link?.getAttribute("aria-label") ??
      link?.textContent?.trim();
    if (title || titleID)
      items.push({
        titleID,
        title: title || undefined,
        image: imgUrl ? { url: imgUrl } : undefined,
      });
  }
  return items;
}

function findNearestHeading(el: Element): string | null {
  let current: Element | null = el;
  for (let i = 0; i < 5 && current; i++) {
    const heading = current.querySelector(
      "h2, h3, h4, [class*='heading'], [class*='Heading']",
    );
    if (heading?.textContent?.trim()) return heading.textContent.trim();
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

function findJsonBlobs(text: string): string[] {
  const blobs: string[] = [];
  const re = /[=:]\s*(\{[\s\S]{50,}?\})\s*[;,\n]/g;
  let match;
  while ((match = re.exec(text)) !== null) blobs.push(match[1]);
  return blobs;
}

function extractWidgets(
  obj: unknown,
  out: AmazonWidget[],
  rawSamples: unknown[],
  depth = 0,
): void {
  if (depth > 8 || !obj || typeof obj !== "object") return;
  const o = obj as Record<string, unknown>;
  if (Array.isArray(o.items) && o.items.length > 0) {
    const firstItem = o.items[0] as Record<string, unknown> | undefined;
    const looksLikeContent =
      firstItem &&
      typeof firstItem === "object" &&
      !("itemType" in firstItem && firstItem.itemType === "WatchlistAction") &&
      !(
        "__type" in firstItem &&
        String(firstItem.__type).includes("OverflowMenu")
      );
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
  if (Array.isArray(o.widgets)) {
    for (const w of o.widgets) extractWidgets(w, out, rawSamples, depth + 1);
  }
  for (const val of Object.values(o)) {
    if (val && typeof val === "object")
      extractWidgets(val, out, rawSamples, depth + 1);
  }
}

function sampleDomStructure(doc: Document): unknown {
  const body = doc.body;
  if (!body) return { error: "no body" };
  const sample: unknown[] = [];
  function describeEl(el: Element, depth: number): unknown {
    const attrs: Record<string, string> = {};
    for (const attr of el.attributes) {
      if (
        ["class", "id", "role", "aria-label"].includes(attr.name) ||
        attr.name.startsWith("data-")
      )
        attrs[attr.name] = attr.value.slice(0, 200);
    }
    const desc: Record<string, unknown> = {
      tag: el.tagName.toLowerCase(),
      attrs,
      childCount: el.children.length,
    };
    if (el.children.length === 0 && el.textContent?.trim())
      desc.text = el.textContent.trim().slice(0, 100);
    if (depth < 3 && el.children.length > 0 && el.children.length <= 20)
      desc.children = Array.from(el.children).map((c) =>
        describeEl(c, depth + 1),
      );
    else if (el.children.length > 20) {
      desc.childrenSample = Array.from(el.children)
        .slice(0, 5)
        .map((c) => describeEl(c, depth + 1));
      desc.childrenTruncated = el.children.length;
    }
    return desc;
  }
  for (const child of body.children) {
    sample.push(describeEl(child, 0));
    if (sample.length >= 10) break;
  }
  return { bodyChildCount: body.children.length, topLevel: sample };
}
