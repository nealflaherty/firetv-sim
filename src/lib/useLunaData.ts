import { useEffect, useState } from "react";
import type { ContentItem } from "./types";
import { isAmazonContext } from "./amazonService";
import { fetchLunaGames } from "./lunaParser";

export interface LunaContentRow {
  id: string;
  title: string;
  items: ContentItem[];
}

export function useLunaData(): {
  rows: LunaContentRow[];
  loading: boolean;
} {
  const [rows, setRows] = useState<LunaContentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { rows: lunaRows } = await fetchLunaGames();
        if (cancelled) return;

        const contentRows: LunaContentRow[] = lunaRows
          .filter((r) => r.games.length > 0)
          .map((r, i) => ({
            id: `luna-${i}`,
            title: r.title,
            items: r.games.map((g, j) => ({
              id: g.id,
              title: g.title,
              thumbnail: g.image,
              linkUrl: g.href ? `https://www.amazon.com${g.href}` : undefined,
              gradient: g.image
                ? undefined
                : `linear-gradient(135deg, hsl(${(j * 47) % 360}, 60%, 30%), hsl(${(j * 47 + 60) % 360}, 60%, 20%))`,
            })),
          }));

        setRows(contentRows);
      } catch (err) {
        console.warn("[useLunaData] Error:", err);
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
