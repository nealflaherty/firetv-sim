import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import { AMAZON_ORIGIN } from "./constants";
import { isAmazonContext } from "./amazonService";
import { fetchVideoCollection } from "./forYouParser";

const NEWS_URL = `${AMAZON_ORIGIN}/gp/video/news`;

export interface NewsContentRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useNewsData(): {
  rows: NewsContentRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<NewsContentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { rows: parsed } = await fetchVideoCollection(
          NEWS_URL,
          "newsParser",
        );
        if (cancelled) return;

        const contentRows: NewsContentRow[] = parsed.map((r) => ({
          id: `news-${r.rowIndex}`,
          title: r.title,
          items: r.items.map((item, j) => ({
            id: item.titleID ?? `nw-${r.rowIndex}-${j}`,
            title: item.title || item.titleID || "Untitled",
            thumbnail: item.image?.url,
          })),
        }));

        setRows(contentRows);
      } catch (err) {
        console.warn("[useNewsData] Error:", err);
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
