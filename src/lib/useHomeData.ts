import { useEffect, useState } from "react";
import type { RowSkeleton, ContentRow, Trailer } from "./types";
import {
  fetchTrailers,
  fetchRowSkeletons,
  fetchRowContent,
  fetchRowThumbnails,
} from "./homeService";

export interface HomeDataState {
  trailers: Trailer[];
  skeletons: RowSkeleton[];
  rows: Map<string, ContentRow>;
  thumbnails: Map<string, Record<string, string>>;
  loading: {
    trailers: boolean;
    skeletons: boolean;
    content: boolean;
    thumbnails: boolean;
  };
}

export function useHomeData(): HomeDataState {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [skeletons, setSkeletons] = useState<RowSkeleton[]>([]);
  const [rows, setRows] = useState<Map<string, ContentRow>>(new Map());
  const [thumbnails, setThumbnails] = useState<
    Map<string, Record<string, string>>
  >(new Map());
  const [loading, setLoading] = useState({
    trailers: true,
    skeletons: true,
    content: true,
    thumbnails: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Stage 0 + 1: fetch trailers and row skeletons in parallel
      const [t, s] = await Promise.all([fetchTrailers(), fetchRowSkeletons()]);
      if (cancelled) return;
      setTrailers(t);
      setSkeletons(s);
      setLoading((l) => ({ ...l, trailers: false, skeletons: false }));

      // Stage 2: fetch content for all rows in parallel
      const contentResults = await Promise.all(
        s.map((sk) => fetchRowContent(sk.id)),
      );
      if (cancelled) return;
      const rowMap = new Map<string, ContentRow>();
      for (const r of contentResults) rowMap.set(r.id, r);
      setRows(rowMap);
      setLoading((l) => ({ ...l, content: false }));

      // Stage 3: fetch thumbnails for all rows in parallel
      const thumbResults = await Promise.all(
        s.map(async (sk) => ({
          id: sk.id,
          thumbs: await fetchRowThumbnails(sk.id),
        })),
      );
      if (cancelled) return;
      const thumbMap = new Map<string, Record<string, string>>();
      for (const { id, thumbs } of thumbResults) thumbMap.set(id, thumbs);
      setThumbnails(thumbMap);
      setLoading((l) => ({ ...l, thumbnails: false }));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { trailers, skeletons, rows, thumbnails, loading };
}
