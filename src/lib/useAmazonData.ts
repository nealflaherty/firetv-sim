import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import {
  isAmazonContext,
  fetchStorefrontHtml,
  enrichItemMetadata,
  fetchTitlesForAsins,
} from "./amazonService";

export interface AmazonRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useAmazonData(): {
  rows: AmazonRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<AmazonRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { widgets } = await fetchStorefrontHtml();
        if (cancelled) return;

        // Map widgets to rows with basic info
        const initial: AmazonRow[] = widgets
          .filter((w) => (w.items?.length ?? 0) > 0)
          .map((w, i) => ({
            id: w.widgetId ?? `amz-${i}`,
            title: w.title ?? `Row ${i + 1}`,
            items: (w.items ?? []).map((item, j) => ({
              id: item.titleID ?? `amz-${i}-${j}`,
              title: item.title || item.titleID || "Untitled",
              thumbnail: item.image?.url,
            })),
          }));

        setRows(initial);

        // Enrich in batches
        const allIds = new Set<string>();
        for (const r of initial)
          for (const item of r.items)
            if (item.id && !item.id.startsWith("amz-")) allIds.add(item.id);

        const BATCH = 13;
        const idArr = [...allIds];

        for (let i = 0; i < idArr.length; i += BATCH) {
          if (cancelled) return;
          const batch = idArr.slice(i, i + BATCH);
          try {
            const enriched = await enrichItemMetadata({ titleIds: batch });
            if (cancelled) return;
            if (enriched.length === 0) continue;

            const enrichMap = new Map(enriched.map((e) => [e.titleID, e]));
            setRows((prev) =>
              prev.map((row) => ({
                ...row,
                items: row.items.map((item) => {
                  const e = enrichMap.get(item.id);
                  if (!e) return item;
                  const cues = e.entitlementCues;
                  const focus =
                    typeof cues?.focusMessage === "string"
                      ? cues.focusMessage
                      : (cues?.focusMessage as { message?: string })?.message;
                  const high =
                    typeof cues?.highValueMessage === "string"
                      ? cues.highValueMessage
                      : (cues?.highValueMessage as { message?: string })
                          ?.message;
                  return {
                    ...item,
                    title: item.title || e.title || item.id,
                    description: high ?? e.synopsis,
                    entitlement: focus ?? cues?.entitlementType,
                  };
                }),
              })),
            );
          } catch {
            /* continue */
          }
        }
      } catch (err) {
        console.warn("[useAmazonData] Error:", err);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading };
}
