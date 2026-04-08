/**
 * Amazon Video enrichment and playback APIs.
 */

import { AMAZON_ORIGIN, DEVICE_TYPE_ID, MARKETPLACE_ID } from "./constants";
import type {
  EnrichRequest,
  EnrichResponse,
  EnrichedItem,
} from "./amazonTypes";

/**
 * Enrich items with metadata via the storefront API.
 * Uses form-urlencoded format with X-Requested-With header.
 */
export async function enrichItemMetadata(
  req: EnrichRequest,
): Promise<EnrichedItem[]> {
  const { titleIds } = req;
  if (titleIds.length === 0) return [];

  const formBody = new URLSearchParams({
    metadataToEnrich: JSON.stringify({
      placement: "HOVER",
      playback: true,
      preroll: true,
      trailer: true,
      watchlist: true,
    }),
    titleIDsToEnrich: JSON.stringify(titleIds),
    journeyIngressContext: "",
    currentUrl: "https://www.amazon.com/gp/video/storefront",
  });

  try {
    const resp = await fetch(
      `${AMAZON_ORIGIN}/gp/video/api/enrichItemMetadata`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: formBody.toString(),
      },
    );

    if (!resp.ok) {
      console.warn(`[enrichApi] enrichItemMetadata failed: ${resp.status}`);
      return [];
    }

    const text = await resp.text();
    if (
      text.trimStart().startsWith("<!") ||
      text.trimStart().startsWith("<html")
    ) {
      console.warn("[enrichApi] Returned HTML — possible auth redirect");
      return [];
    }

    const data = JSON.parse(text) as EnrichResponse;

    if (data.enrichedItems && data.enrichedItems.length > 0) {
      return data.enrichedItems;
    }

    if (data.enrichments && typeof data.enrichments === "object") {
      const items: EnrichedItem[] = [];
      for (const [key, val] of Object.entries(data.enrichments)) {
        if (val && typeof val === "object") {
          items.push({
            titleID: key,
            ...(val as Record<string, unknown>),
          } as EnrichedItem);
        }
      }
      if (items.length > 0) return items;
    }

    console.warn("[enrichApi] Unexpected response shape:", Object.keys(data));
    return [];
  } catch (err) {
    console.warn("[enrichApi] Error:", err);
    return [];
  }
}

/**
 * Resolve a playback envelope to a DASH manifest URL via GetVodPlaybackResources.
 */
export async function resolvePlaybackUrl(
  playbackEnvelope: string,
  titleId: string,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      deviceID: crypto.randomUUID(),
      deviceTypeID: DEVICE_TYPE_ID,
      gascEnabled: "false",
      marketplaceID: MARKETPLACE_ID,
      uxLocale: "en_US",
      firmware: "1",
      titleId,
    });

    const body = {
      globalParameters: {
        deviceCapabilityFamily: "WebPlayer",
        playbackEnvelope,
        capabilityDiscriminators: {
          operatingSystem: { name: "Mac OS X", version: "10.15.7" },
          middleware: { name: "Chrome", version: "130.0.0.0" },
          nativeApplication: { name: "Chrome", version: "130.0.0.0" },
          hfrControlMode: "Legacy",
          displayResolution: { height: 1080, width: 1920 },
        },
      },
      vodPlaylistedPlaybackUrlsRequest: {
        device: {
          maxVideoResolution: "1080p",
          supportedStreamingTechnologies: ["DASH"],
          streamingTechnologies: {
            DASH: {
              bitrateAdaptations: ["CBR", "CVBR"],
              codecs: ["H264"],
              drmKeyScheme: "DualKey",
              drmType: "Widevine",
              dynamicRangeFormats: ["None"],
              edgeDeliveryAuthorizationSchemes: ["PVExchangeV1", "Transparent"],
              fragmentRepresentations: ["ByteOffsetRange", "SeparateFile"],
              frameRates: ["Standard"],
              segmentInfoType: "Base",
              timedTextRepresentations: ["NotInManifestNorStream"],
              trickplayRepresentations: ["NotInManifestNorStream"],
            },
          },
          displayWidth: 1920,
          displayHeight: 1080,
        },
        ads: { sitePageUrl: "https://www.amazon.com/gp/video/storefront" },
        playbackCustomizations: {},
        playbackSettingsRequest: {
          firmware: "UNKNOWN",
          playerType: "xp",
          responseFormatVersion: "1.0.0",
          titleId,
        },
      },
    };

    const resp = await fetch(
      `https://atv-ps.amazon.com/playback/prs/GetVodPlaybackResources?${params}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      },
    );

    if (!resp.ok) {
      console.warn(
        `[enrichApi] GetVodPlaybackResources failed: ${resp.status}`,
      );
      return null;
    }

    const data = await resp.json();
    const playlist =
      data?.vodPlaylistedPlaybackUrls?.result?.playbackUrls?.intraTitlePlaylist;
    if (!Array.isArray(playlist) || playlist.length === 0) return null;

    const mainEntry =
      playlist.find((e: Record<string, unknown>) => e.type === "Main") ??
      playlist[0];
    const manifestUrl = (mainEntry?.urls as { url: string }[])?.[0]?.url;
    return manifestUrl ?? null;
  } catch (err) {
    console.warn("[enrichApi] resolvePlaybackUrl error:", err);
    return null;
  }
}
