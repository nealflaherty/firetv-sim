/**
 * Parser for Amazon Luna games page (https://www.amazon.com/luna/).
 *
 * The Luna page is a client-side rendered React SPA, so we load it
 * in a hidden iframe and scrape the rendered DOM for game data.
 */

import { AMAZON_ORIGIN } from "./constants";

export interface LunaGame {
  id: string;
  title: string;
  image?: string;
  href?: string;
}

export interface LunaRow {
  title: string;
  games: LunaGame[];
}

export interface LunaParseResult {
  rows: LunaRow[];
  totalGames: number;
}

const LUNA_URL = `${AMAZON_ORIGIN}/luna/`;

/** Timeout for waiting for the SPA to render (ms) */
const RENDER_TIMEOUT = 15000;
const POLL_INTERVAL = 500;
/** Minimum images to consider the page rendered */
const MIN_GAME_IMAGES = 5;

export async function fetchLunaGames(): Promise<LunaParseResult> {
  const result: LunaParseResult = { rows: [], totalGames: 0 };

  try {
    const doc = await loadLunaInIframe();
    if (!doc) return result;

    result.rows = extractGameRows(doc);
    result.totalGames = result.rows.reduce((s, r) => s + r.games.length, 0);
    console.log(
      `[lunaParser] Found ${result.rows.length} rows, ${result.totalGames} games`,
    );
  } catch (err) {
    console.warn("[lunaParser] Error:", err);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Iframe loader — renders the Luna SPA and returns the document
// ---------------------------------------------------------------------------

function loadLunaInIframe(): Promise<Document | null> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;width:1280px;height:720px;opacity:0;pointer-events:none;";
    iframe.src = LUNA_URL;
    document.body.appendChild(iframe);

    let resolved = false;
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    };

    // Safety timeout
    const timeout = setTimeout(cleanup, RENDER_TIMEOUT + 2000);

    iframe.addEventListener("load", () => {
      let attempts = 0;
      const maxAttempts = Math.ceil(RENDER_TIMEOUT / POLL_INTERVAL);

      const poll = () => {
        attempts++;
        try {
          const doc =
            iframe.contentDocument ?? iframe.contentWindow?.document ?? null;
          if (!doc) {
            if (attempts < maxAttempts) {
              setTimeout(poll, POLL_INTERVAL);
            } else {
              cleanup();
            }
            return;
          }

          // Check if enough game images have rendered
          const imgs = doc.querySelectorAll("img[src][alt]");
          const gameImgs = [...imgs].filter(
            (img) =>
              img.getAttribute("alt")!.length > 3 &&
              !img.getAttribute("src")!.includes("sprite") &&
              !img.getAttribute("src")!.includes("pixel") &&
              !img.getAttribute("src")!.includes("1x1"),
          );

          if (gameImgs.length >= MIN_GAME_IMAGES || attempts >= maxAttempts) {
            resolved = true;
            clearTimeout(timeout);
            // Clone the document content before removing iframe
            const clone = doc.cloneNode(true) as Document;
            iframe.remove();
            resolve(clone);
          } else {
            setTimeout(poll, POLL_INTERVAL);
          }
        } catch {
          if (attempts < maxAttempts) {
            setTimeout(poll, POLL_INTERVAL);
          } else {
            cleanup();
          }
        }
      };

      // Give the SPA a moment to start rendering
      setTimeout(poll, 1500);
    });
  });
}

// ---------------------------------------------------------------------------
// Extract game rows from the rendered Luna DOM
// ---------------------------------------------------------------------------

function extractGameRows(doc: Document): LunaRow[] {
  const allGames: LunaGame[] = [];
  const seen = new Set<string>();

  // Find game links — Luna uses /luna/game/{slug}/{ASIN} URLs
  const gameLinks = doc.querySelectorAll('a[href*="/luna/game/"]');
  for (const link of gameLinks) {
    const href = link.getAttribute("href") ?? "";
    const asinMatch = href.match(/\/([A-Z0-9]{10})$/);
    const asin = asinMatch?.[1];
    if (!asin || seen.has(asin)) continue;

    // Find the best image inside this link
    // Tile images (box art) have short alt text (just the title)
    // Hero banners have "Title: long description" format
    const imgs = link.querySelectorAll("img[alt]");
    let bestImg: Element | null = null;
    let bestTitle = "";

    for (const img of imgs) {
      const alt = img.getAttribute("alt") ?? "";
      if (!alt || alt.length < 2) continue;

      // Only keep tile images — they're inside a <picture> with class _ctz3yu
      // This excludes hero banners (_1od7t7v), badge icons, and other placements
      const picture = img.closest("picture");
      if (!picture) continue;
      const pictureClass = picture.className?.toString() ?? "";
      if (!pictureClass.includes("_ctz3yu")) continue;

      if (!bestImg || alt.length < bestTitle.length) {
        bestImg = img;
        bestTitle = alt;
      }
    }

    if (!bestImg) continue;

    // Clean title — remove description after colon if present
    const title = bestTitle.split(":")[0].trim();
    if (!title) continue;

    seen.add(asin);
    allGames.push({
      id: asin,
      title,
      image: bestImg.getAttribute("src") ?? undefined,
      href,
    });
  }

  if (allGames.length === 0) return [];
  return [{ title: "Luna Games", games: allGames }];
}
