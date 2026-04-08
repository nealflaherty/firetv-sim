import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import { AMAZON_ORIGIN } from "./constants";
import { isAmazonContext } from "./amazonService";
import { fetchVideoCollection } from "./forYouParser";

const PRIME_URL = `${AMAZON_ORIGIN}/gp/video/prime`;

export interface FreeContentRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useFreeData(): {
  rows: FreeContentRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<FreeContentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { rows: parsed } = await fetchVideoCollection(
          PRIME_URL,
          "freeParser",
        );
        if (cancelled) return;

        const contentRows: FreeContentRow[] = parsed.map((r) => ({
          id: `free-${r.rowIndex}`,
          title: r.title,
          items: r.items.map((item, j) => ({
            id: item.titleID ?? `fr-${r.rowIndex}-${j}`,
            title: item.title || item.titleID || "Untitled",
            thumbnail: item.image?.url,
          })),
        }));

        setRows(contentRows);
      } catch (err) {
        console.warn("[useFreeData] Error:", err);
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
