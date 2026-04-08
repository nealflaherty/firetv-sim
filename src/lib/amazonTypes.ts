/** Raw widget/carousel extracted from the storefront HTML */
export interface AmazonWidget {
  widgetId?: string;
  title?: string;
  items?: AmazonWidgetItem[];
}

/** Individual item within a widget */
export interface AmazonWidgetItem {
  titleID?: string;
  title?: string;
  image?: { url?: string };
  synopsis?: string;
  releaseYear?: string | number;
  runtimeSeconds?: number;
  ratingCount?: number;
  customerReviewStarRating?: number;
  maturityRating?: { displayString?: string };
}

/** Response shape from enrichItemMetadata API */
export interface EnrichResponse {
  enrichedItems?: EnrichedItem[];
  enrichments?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  __type?: string;
}

/** Enriched metadata for a single title */
export interface EnrichedItem {
  titleID?: string;
  title?: string;
  synopsis?: string;
  releaseYear?: number;
  runtimeSeconds?: number;
  customerReviewStarRating?: number;
  ratingCount?: number;
  maturityRating?: { displayString?: string };
  images?: { packshot?: string; hero?: string; covershot?: string };
  entitlementCues?: {
    entitlementType?: string;
    focusMessage?: string | { icon?: string; message?: string };
    highValueMessage?: string | { icon?: string; message?: string };
  };
  trailer?: {
    correlationId?: string;
    playbackEnvelope?: string;
    playbackURL?: string;
    playbackID?: string;
    videoMaterialType?: string;
  };
  prerollsEnvelope?: {
    playbackEnvelope?: string;
    playbackId?: string;
  };
  watchlistAction?: {
    endpoint?: string;
  };
}

/** Request params for enrichItemMetadata */
export interface EnrichRequest {
  titleIds: string[];
}

/** Result from fetchStorefrontHtml */
export interface StorefrontParseResult {
  widgets: AmazonWidget[];
  rawScripts: { index: number; length: number; snippet: string }[];
  rawWidgetSamples: unknown[];
  domSample: unknown;
  htmlLength: number;
}
