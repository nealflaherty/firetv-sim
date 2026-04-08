import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import { AMAZON_ORIGIN } from "./constants";
import { isAmazonContext } from "./amazonService";
import { fetchVideoCollection } from "./forYouParser";

const KIDS_URL = `${AMAZON_ORIGIN}/gp/video/kids`;

export interface KidsContentRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useKidsData(): {
  rows: KidsContentRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<KidsContentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { rows: parsed } = await fetchVideoCollection(
          KIDS_URL,
          "kidsParser",
        );
        if (cancelled) return;

        const contentRows: KidsContentRow[] = parsed.map((r) => ({
          id: `kids-${r.rowIndex}`,
          title: r.title,
          items: r.items.map((item, j) => ({
            id: item.titleID ?? `kd-${r.rowIndex}-${j}`,
            title: item.title || item.titleID || "Untitled",
            thumbnail: item.image?.url,
          })),
        }));

        setRows(contentRows);
      } catch (err) {
        console.warn("[useKidsData] Error:", err);
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
