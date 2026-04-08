import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import { isAmazonContext } from "./amazonService";
import { fetchForYou } from "./forYouParser";
import { enrichItemMetadata } from "./enrichApi";
import { ENRICH_BATCH_SIZE } from "./constants";

export interface ForYouContentRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useForYouData(): {
  rows: ForYouContentRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<ForYouContentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { rows: forYouRows } = await fetchForYou();
        if (cancelled) return;

        const initial: ForYouContentRow[] = forYouRows.map((r) => ({
          id: `foryou-${r.rowIndex}`,
          title: r.title,
          items: r.items.map((item, j) => ({
            id: item.titleID ?? `fy-${r.rowIndex}-${j}`,
            title: item.title || item.titleID || "Untitled",
            thumbnail: item.image?.url,
          })),
        }));

        setRows(initial);

        // Enrich all items
        const allIds = new Set<string>();
        for (const r of initial)
          for (const item of r.items)
            if (item.id && !item.id.startsWith("fy-")) allIds.add(item.id);

        const idArr = [...allIds];
        for (let i = 0; i < idArr.length; i += ENRICH_BATCH_SIZE) {
          if (cancelled) return;
          const batch = idArr.slice(i, i + ENRICH_BATCH_SIZE);
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
                    title: e.title || item.title,
                    description: high ?? e.synopsis,
                    entitlement: focus ?? cues?.entitlementType,
                    thumbnail:
                      item.thumbnail ??
                      e.images?.packshot ??
                      e.images?.covershot ??
                      e.images?.hero,
                  };
                }),
              })),
            );
          } catch {
            /* continue */
          }
        }
      } catch (err) {
        console.warn("[useForYouData] Error:", err);
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
