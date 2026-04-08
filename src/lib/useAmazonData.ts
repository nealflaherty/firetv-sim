import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentItem } from "./types";
import {
  isAmazonContext,
  fetchStorefrontHtml,
  enrichItemMetadata,
  resolvePlaybackUrl,
} from "./amazonService";

export interface AmazonRow {
  id: string;
  title: string;
  items: ContentItem[];
}

// Cache trailer envelopes from enrichment (titleID → { envelope, playbackID })
interface TrailerInfo {
  playbackEnvelope: string;
  playbackID: string;
}

export function useAmazonData(): {
  rows: AmazonRow[];
  loading: boolean;
  resolveTrailer: (titleId: string) => Promise<string | null>;
} {
  const [rows, setRows] = useState<AmazonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const trailerCache = useRef(new Map<string, TrailerInfo>());
  const resolvedUrls = useRef(new Map<string, string | null>());

  useEffect(() => {
    if (!isAmazonContext()) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { widgets } = await fetchStorefrontHtml();
        if (cancelled) return;

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

            // Cache trailer envelopes
            for (const e of enriched) {
              if (
                e.titleID &&
                e.trailer?.playbackEnvelope &&
                e.trailer?.playbackID
              ) {
                trailerCache.current.set(e.titleID, {
                  playbackEnvelope: e.trailer.playbackEnvelope,
                  playbackID: e.trailer.playbackID,
                });
              }
            }

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

  // Resolve a trailer URL on demand, with caching
  const resolveTrailer = useCallback(
    async (titleId: string): Promise<string | null> => {
      // Check resolved cache first
      if (resolvedUrls.current.has(titleId)) {
        return resolvedUrls.current.get(titleId) ?? null;
      }

      const info = trailerCache.current.get(titleId);
      if (!info) return null;

      try {
        const url = await resolvePlaybackUrl(
          info.playbackEnvelope,
          info.playbackID,
        );
        resolvedUrls.current.set(titleId, url);

        // Update the item's videoSrc in rows
        if (url) {
          setRows((prev) =>
            prev.map((row) => ({
              ...row,
              items: row.items.map((item) =>
                item.id === titleId ? { ...item, videoSrc: url } : item,
              ),
            })),
          );
        }

        return url;
      } catch {
        resolvedUrls.current.set(titleId, null);
        return null;
      }
    },
    [],
  );

  return { rows, loading, resolveTrailer };
}
