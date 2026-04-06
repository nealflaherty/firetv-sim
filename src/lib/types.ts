/** Stage 1: Row skeleton — just the category/theme info */
export interface RowSkeleton {
  id: string;
  title: string;
}

/** Stage 2: Content item metadata (no thumbnail yet) */
export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  rating?: string;
  ratingCount?: number;
  runtime?: number; // duration in minutes
  year?: string;
  maturity?: string;
  features?: string[];
  entitlement?: string;
  thumbnail?: string; // populated in stage 3
  gradient?: string; // gradient background for placeholder tiles
}

/** Stage 2: Row with content loaded */
export interface ContentRow extends RowSkeleton {
  items: ContentItem[];
}

/** Trailer for the hero carousel */
export interface Trailer {
  id: string;
  title: string;
  videoSrc: string;
}

/** Full home page data at each loading stage */
export interface HomeData {
  trailers: Trailer[];
  rows: ContentRow[];
}
