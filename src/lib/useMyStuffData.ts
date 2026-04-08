import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import { isAmazonContext } from "./amazonService";
import { fetchMyStuff } from "./myStuffParser";
import { enrichItemMetadata } from "./enrichApi";
import { ENRICH_BATCH_SIZE } from "./constants";

export interface MyStuffRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useMyStuffData(): {
  rows: MyStuffRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<MyStuffRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { watchlist, library } = await fetchMyStuff();
        if (cancelled) return;

        const initial: MyStuffRow[] = [];

        if (watchlist.length > 0) {
          initial.push({
            id: "mystuff-watchlist",
            title: "Watchlist",
            items: watchlist.map((item, i) => ({
              id: item.titleID ?? `wl-${i}`,
              title: item.title || item.titleID || "Untitled",
              thumbnail: item.image?.url,
            })),
          });
        }

        if (library.length > 0) {
          initial.push({
            id: "mystuff-library",
            title: "Purchases and Rentals",
            items: library.map((item, i) => ({
              id: item.titleID ?? `lib-${i}`,
              title: item.title || item.titleID || "Untitled",
              thumbnail: item.image?.url,
            })),
          });
        }

        setRows(initial);

        // Enrich all items for metadata
        const allIds = new Set<string>();
        for (const r of initial)
          for (const item of r.items)
            if (
              item.id &&
              !item.id.startsWith("wl-") &&
              !item.id.startsWith("lib-")
            )
              allIds.add(item.id);

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
                  };
                }),
              })),
            );
          } catch {
            /* continue */
          }
        }
      } catch (err) {
        console.warn("[useMyStuffData] Error:", err);
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
