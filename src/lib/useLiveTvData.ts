import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import { isAmazonContext } from "./amazonService";
import { fetchLiveTv } from "./liveTvParser";

export interface LiveTvContentRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useLiveTvData(): {
  rows: LiveTvContentRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<LiveTvContentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { rows: liveTvRows } = await fetchLiveTv();
        if (cancelled) return;

        const contentRows: LiveTvContentRow[] = liveTvRows.map((r) => ({
          id: `livetv-${r.rowIndex}`,
          title: r.title,
          items: r.items.map((item, j) => ({
            id: item.titleID ?? `lt-${r.rowIndex}-${j}`,
            title: item.title || item.titleID || "Untitled",
            thumbnail: item.image?.url,
          })),
        }));

        setRows(contentRows);
      } catch (err) {
        console.warn("[useLiveTvData] Error:", err);
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
