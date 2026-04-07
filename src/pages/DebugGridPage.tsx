import { useEffect, useState } from "react";
import {
  isAmazonContext,
  fetchStorefrontHtml,
  enrichItemMetadata,
} from "../lib/amazonService";
import "./DebugGridPage.css";

interface GridItem {
  titleID?: string;
  title?: string;
  image?: string;
  entitlement?: string;
  highValue?: string;
}

interface GridSection {
  widgetId?: string;
  title: string;
  items: GridItem[];
}

export function DebugGridPage() {
  const [sections, setSections] = useState<GridSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading storefront…");
  const amazon = isAmazonContext();

  useEffect(() => {
    if (!amazon) {
      setStatus("Not on Amazon — nothing to fetch");
      setLoading(false);
      return;
    }
    load();
  }, [amazon]);

  async function load() {
    setLoading(true);
    try {
      // Step 1: parse HTML for widgets
      setStatus("Fetching storefront HTML…");
      const { widgets } = await fetchStorefrontHtml();
      setStatus(`Parsed ${widgets.length} sections. Enriching…`);

      // Build sections from widgets
      const secs: GridSection[] = widgets
        .filter((w) => (w.items?.length ?? 0) > 0)
        .map((w) => ({
          widgetId: w.widgetId,
          title: w.title ?? "Untitled",
          items: (w.items ?? []).map((item) => ({
            titleID: item.titleID,
            title: item.title || undefined,
            image: item.image?.url,
          })),
        }));

      setSections(secs);

      // Step 2: enrich in batches
      const allIds = new Set<string>();
      for (const s of secs) {
        for (const item of s.items) {
          if (item.titleID) allIds.add(item.titleID);
        }
      }

      const BATCH = 13;
      const idArr = [...allIds];
      let enriched = 0;

      for (let i = 0; i < idArr.length; i += BATCH) {
        const batch = idArr.slice(i, i + BATCH);
        setStatus(`Enriching ${i + batch.length}/${idArr.length}…`);
        try {
          const items = await enrichItemMetadata({ titleIds: batch });
          if (items.length > 0) {
            enriched += items.length;
            // Merge enriched data into sections
            const enrichMap = new Map(items.map((e) => [e.titleID, e]));
            setSections((prev) =>
              prev.map((sec) => ({
                ...sec,
                items: sec.items.map((item) => {
                  const e = item.titleID
                    ? enrichMap.get(item.titleID)
                    : undefined;
                  if (!e) return item;
                  const focus = e.entitlementCues?.focusMessage;
                  const high = e.entitlementCues?.highValueMessage;
                  return {
                    ...item,
                    title: item.title || e.title || item.titleID,
                    entitlement:
                      typeof focus === "string"
                        ? focus
                        : (focus as { message?: string })?.message,
                    highValue:
                      typeof high === "string"
                        ? high
                        : (high as { message?: string })?.message,
                  };
                }),
              })),
            );
          }
        } catch {
          /* continue with next batch */
        }
      }

      setStatus(
        `Done — ${secs.length} sections, ${allIds.size} items, ${enriched} enriched`,
      );
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
    setLoading(false);
  }

  return (
    <div className="debug-grid-page">
      <div className="debug-grid-header">
        <a href="#/debug" className="debug-grid-back">
          ← API Debug
        </a>
        <a href="#/" className="debug-grid-back">
          ← Home
        </a>
        <h1>Storefront Grid</h1>
        <span className="debug-grid-status">{status}</span>
        {!loading && (
          <button className="debug-grid-reload" onClick={load}>
            Reload
          </button>
        )}
      </div>

      {!amazon && (
        <p className="debug-grid-empty">
          This page only works when running inside the Amazon UserScript
          context.
        </p>
      )}

      {sections.map((sec, si) => (
        <div key={si} className="debug-grid-section">
          <h2 className="debug-grid-section-title">
            {sec.title}
            <span className="debug-grid-section-count">{sec.items.length}</span>
          </h2>
          <div className="debug-grid-row">
            {sec.items.map((item, ii) => (
              <div key={ii} className="debug-grid-card">
                {item.image ? (
                  <img
                    className="debug-grid-card-img"
                    src={item.image}
                    alt={item.title ?? item.titleID ?? ""}
                    loading="lazy"
                  />
                ) : (
                  <div className="debug-grid-card-placeholder" />
                )}
                <div className="debug-grid-card-info">
                  <span className="debug-grid-card-title">
                    {item.title || item.titleID || "?"}
                  </span>
                  {item.highValue && (
                    <span className="debug-grid-card-meta">
                      {item.highValue}
                    </span>
                  )}
                  {item.entitlement && (
                    <span className="debug-grid-card-entitlement">
                      {item.entitlement}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
