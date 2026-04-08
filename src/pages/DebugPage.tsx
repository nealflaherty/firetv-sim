import { useState } from "react";
import {
  isAmazonContext,
  fetchStorefrontHtml,
  enrichItemMetadata,
  fetchAmazonStorefront,
  inspectAsinInDom,
  resolvePlaybackUrl,
} from "../lib/amazonService";
import { fetchLunaGames } from "../lib/lunaParser";
import { fetchMyStuff } from "../lib/myStuffParser";
import "./DebugPage.css";

type LogEntry = { time: string; msg: string; data?: unknown };

export function DebugPage() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [dataView, setDataView] = useState<unknown>(null);
  const [dataLabel, setDataLabel] = useState("");
  const [asinInput, setAsinInput] = useState("");
  const [loading, setLoading] = useState("");

  const amazon = isAmazonContext();

  function addLog(msg: string, data?: unknown) {
    setLog((prev) => [
      { time: new Date().toLocaleTimeString(), msg, data },
      ...prev,
    ]);
  }

  function showData(label: string, data: unknown) {
    setDataLabel(label);
    setDataView(data);
  }

  async function handleFetchHtml() {
    setLoading("html");
    try {
      const result = await fetchStorefrontHtml();
      addLog(
        `Fetched HTML: ${result.htmlLength} chars, ${result.widgets.length} widgets, ${result.rawScripts.length} scripts`,
      );
      showData(
        `${result.widgets.length} widgets, ${result.rawScripts.length} scripts`,
        result,
      );
    } catch (err) {
      addLog(`Error: ${err}`);
    }
    setLoading("");
  }

  async function handleEnrich() {
    const ids = asinInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      addLog("No ASINs provided");
      return;
    }
    setLoading("enrich");
    try {
      const items = await enrichItemMetadata({ titleIds: ids });
      addLog(`Enriched ${items.length} items for [${ids.join(", ")}]`);
      showData(`${items.length} enriched items`, items);
    } catch (err) {
      addLog(`Error enriching: ${err}`);
    }
    setLoading("");
  }

  async function handleRawEnrich() {
    const ids = asinInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      addLog("No ASINs provided");
      return;
    }
    setLoading("raw");
    try {
      const base = "https://www.amazon.com/gp/video/api/enrichItemMetadata";

      const formats: {
        name: string;
        url: string;
        hdrs: Record<string, string>;
        body: unknown;
      }[] = [
        {
          name: "form-encoded-correct",
          url: base,
          hdrs: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: new URLSearchParams({
            metadataToEnrich: JSON.stringify({
              placement: "HOVER",
              playback: true,
              preroll: true,
              trailer: true,
              watchlist: true,
            }),
            titleIDsToEnrich: JSON.stringify(ids),
            journeyIngressContext: "",
            currentUrl: "https://www.amazon.com/gp/video/storefront",
          }).toString(),
        },
        {
          name: "form-encoded-with-impressionData",
          url: base,
          hdrs: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: new URLSearchParams({
            metadataToEnrich: JSON.stringify({
              placement: "HOVER",
              playback: true,
              preroll: true,
              trailer: true,
              watchlist: true,
              impressionData: "",
            }),
            titleIDsToEnrich: JSON.stringify(ids),
            journeyIngressContext: "",
            currentUrl: "https://www.amazon.com/gp/video/storefront",
          }).toString(),
        },
      ];

      const results: Record<string, unknown> = {};
      for (const fmt of formats) {
        try {
          const resp = await fetch(fmt.url, {
            method: "POST",
            headers: fmt.hdrs,
            credentials: "include",
            body:
              typeof fmt.body === "string"
                ? fmt.body
                : JSON.stringify(fmt.body),
          });
          const text = await resp.text();
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = text.slice(0, 2000);
          }
          results[fmt.name] = { status: resp.status, response: parsed };
        } catch (err) {
          results[fmt.name] = { error: String(err) };
        }
      }

      addLog(`Tried ${formats.length} formats`, results);
      showData(`${formats.length} format results`, results);
    } catch (err) {
      addLog(`Raw enrich error: ${err}`);
    }
    setLoading("");
  }

  async function handleFullFetch() {
    setLoading("storefront");
    try {
      const result = await fetchAmazonStorefront();
      addLog(
        `Full fetch: ${result.rows.length} rows, ${result.trailers.length} trailers`,
      );
      showData(
        `${result.rows.length} rows, ${result.trailers.length} trailers`,
        result,
      );
    } catch (err) {
      addLog(`Error: ${err}`);
    }
    setLoading("");
  }

  function handleCheckGlobals() {
    const win = window as unknown as Record<string, unknown>;
    const apiCalls = win.__apiCalls as unknown[] | undefined;
    const enrichedItems = win.__enrichedItems as unknown[] | undefined;
    const pageData = win.__amazonPageData as unknown | undefined;

    const summary = [
      `__apiCalls: ${apiCalls?.length ?? "N/A"}`,
      `__enrichedItems: ${enrichedItems?.length ?? "N/A"}`,
      `__amazonPageData: ${pageData ? "present" : "N/A"}`,
    ].join(", ");
    addLog(summary);

    if (apiCalls && apiCalls.length > 0) {
      // Show enrich calls specifically
      const enrichCalls = apiCalls.filter((c: unknown) =>
        (c as Record<string, unknown>).url
          ?.toString()
          .includes("enrichItemMetadata"),
      );
      if (enrichCalls.length > 0) {
        showData(`${enrichCalls.length} enrich API calls`, enrichCalls);
      } else {
        showData(`Last 10 API calls`, apiCalls.slice(-10));
      }
    } else if (pageData) {
      showData("__amazonPageData", pageData);
    }
  }

  function handleShowLogData(entry: LogEntry) {
    if (entry.data) showData(entry.msg, entry.data);
  }

  return (
    <div className="debug-page">
      <div className="debug-header">
        <a href="#/" className="debug-back">
          ← Home
        </a>
        <h1>API Debug</h1>
        <span className={`debug-badge ${amazon ? "debug-badge--on" : ""}`}>
          {amazon ? "Amazon Context" : "Local Dev"}
        </span>
      </div>

      <div className="debug-controls">
        <button onClick={handleFetchHtml} disabled={!!loading}>
          {loading === "html" ? "Fetching…" : "Fetch Storefront HTML"}
        </button>

        <div className="debug-enrich-group">
          <input
            type="text"
            placeholder="ASINs (comma separated, e.g. B00BQO4PMS)"
            value={asinInput}
            onChange={(e) => setAsinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnrich()}
          />
          <button onClick={handleEnrich} disabled={!!loading}>
            {loading === "enrich" ? "Enriching…" : "Enrich"}
          </button>
          <button onClick={handleRawEnrich} disabled={!!loading}>
            {loading === "raw" ? "Testing…" : "Raw Test"}
          </button>
        </div>

        <button onClick={handleFullFetch} disabled={!!loading}>
          {loading === "storefront" ? "Fetching…" : "Full Storefront Fetch"}
        </button>

        <button onClick={handleCheckGlobals}>Check Globals</button>

        <button
          onClick={async () => {
            setLoading("ids");
            try {
              const result = await fetchStorefrontHtml();
              const allIds = new Set<string>();
              const idSamples: Record<string, string[]> = {};
              for (const w of result.widgets) {
                for (const item of w.items ?? []) {
                  if (item.titleID) {
                    allIds.add(item.titleID);
                    const bucket =
                      item.titleID.length > 10 ? "internal" : "asin";
                    (idSamples[bucket] ??= []).push(item.titleID);
                  }
                }
              }
              addLog(`Found ${allIds.size} unique IDs`, {
                total: allIds.size,
                asinCount: idSamples["asin"]?.length ?? 0,
                internalCount: idSamples["internal"]?.length ?? 0,
                asinSamples: (idSamples["asin"] ?? []).slice(0, 10),
                internalSamples: (idSamples["internal"] ?? []).slice(0, 10),
                all: [...allIds],
              });
              showData(`${allIds.size} unique IDs`, {
                asinSamples: (idSamples["asin"] ?? []).slice(0, 10),
                internalSamples: (idSamples["internal"] ?? []).slice(0, 10),
                all: [...allIds],
              });
            } catch (err) {
              addLog(`Error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "ids" ? "Scanning…" : "List All IDs"}
        </button>

        <button
          onClick={async () => {
            const id = asinInput.trim().split(/[\s,]+/)[0];
            if (!id) {
              addLog("Enter an ASIN first");
              return;
            }
            setLoading("inspect");
            try {
              const result = await inspectAsinInDom(id);
              addLog(`Inspected DOM for ${id}`, result);
              showData(`DOM around ${id}`, result);
            } catch (err) {
              addLog(`Error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "inspect" ? "Inspecting…" : "Inspect ASIN DOM"}
        </button>

        <button
          onClick={async () => {
            const id = asinInput.trim().split(/[\s,]+/)[0];
            if (!id) {
              addLog("Enter an ASIN first");
              return;
            }
            setLoading("trailer");
            try {
              // First enrich to get the trailer envelope
              const enriched = await enrichItemMetadata({ titleIds: [id] });
              const e = enriched[0];
              if (!e?.trailer?.playbackEnvelope) {
                addLog(`No trailer envelope for ${id}`, e);
                showData("Enrich result (no trailer)", e);
                setLoading("");
                return;
              }
              addLog(`Got trailer envelope for ${id}, resolving...`, {
                correlationId: e.trailer.correlationId,
                playbackURL: e.trailer.playbackURL,
                videoMaterialType: e.trailer.videoMaterialType,
                envelopeLength: e.trailer.playbackEnvelope.length,
              });
              const url = await resolvePlaybackUrl(
                e.trailer.playbackEnvelope,
                e.trailer.playbackID ?? id,
              );
              if (url) {
                addLog(`Resolved trailer URL for ${id}`, { url });
                showData("Trailer URL", { asin: id, url, trailer: e.trailer });
              } else {
                addLog(`Could not resolve trailer URL for ${id}`);
                showData("Trailer data (unresolved)", e.trailer);
              }
            } catch (err) {
              addLog(`Error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "trailer" ? "Resolving…" : "Resolve Trailer"}
        </button>

        <button
          onClick={async () => {
            setLoading("luna");
            try {
              const result = await fetchLunaGames();
              addLog(
                `Luna: ${result.rows.length} rows, ${result.totalGames} games`,
              );
              showData(`Luna: ${result.totalGames} games`, result);
            } catch (err) {
              addLog(`Luna error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "luna" ? "Fetching…" : "Fetch Luna Games"}
        </button>

        <button
          onClick={async () => {
            setLoading("luna-raw");
            try {
              const resp = await fetch("https://www.amazon.com/luna/", {
                credentials: "include",
                headers: { Accept: "text/html" },
              });
              const html = await resp.text();
              const doc = new DOMParser().parseFromString(html, "text/html");

              // Gather debug info about the page structure
              const allLinks = doc.querySelectorAll("a[href]");
              const lunaLinks: { href: string; text: string; img?: string }[] =
                [];
              for (const link of allLinks) {
                const href = link.getAttribute("href") ?? "";
                if (href.includes("/luna/") || href.includes("/dp/")) {
                  const img = link.querySelector("img");
                  lunaLinks.push({
                    href,
                    text: (
                      link.getAttribute("aria-label") ??
                      link.textContent?.trim() ??
                      ""
                    ).slice(0, 100),
                    img: img?.getAttribute("src")?.slice(0, 200),
                  });
                }
              }

              const sections = doc.querySelectorAll(
                "section, [class*='carousel'], [class*='Carousel'], [class*='row'], [class*='Row']",
              );
              const sectionInfo = [...sections].slice(0, 30).map((s) => ({
                tag: s.tagName,
                class: s.className?.toString().slice(0, 100),
                testId: s.getAttribute("data-testid"),
                childCount: s.children.length,
                text: s.textContent?.trim().slice(0, 150),
              }));

              addLog(
                `Luna raw: ${html.length} chars, ${lunaLinks.length} links, ${sections.length} sections`,
              );
              showData("Luna page structure", {
                htmlLength: html.length,
                linkCount: lunaLinks.length,
                sectionCount: sections.length,
                links: lunaLinks.slice(0, 50),
                sections: sectionInfo,
                title: doc.title,
                bodyClasses: doc.body.className,
              });
            } catch (err) {
              addLog(`Luna raw error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "luna-raw" ? "Fetching…" : "Luna Raw HTML"}
        </button>

        <button
          onClick={async () => {
            setLoading("luna-deep");
            try {
              const resp = await fetch("https://www.amazon.com/luna/", {
                credentials: "include",
                headers: { Accept: "text/html" },
              });
              const html = await resp.text();

              // Look for embedded JSON data (SPA hydration)
              const patterns = [
                {
                  name: "__NEXT_DATA__",
                  regex:
                    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
                },
                {
                  name: "window.__data",
                  regex: /window\.__data\s*=\s*(\{[\s\S]*?\});/i,
                },
                {
                  name: "window.__INITIAL_STATE__",
                  regex: /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/i,
                },
                {
                  name: "window.__PRELOADED_STATE__",
                  regex: /window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});/i,
                },
              ];

              const found: Record<string, unknown> = {};
              for (const p of patterns) {
                const m = html.match(p.regex);
                if (m) {
                  try {
                    found[p.name] = {
                      size: m[1].length,
                      parsed: JSON.parse(m[1]),
                    };
                  } catch {
                    found[p.name] = {
                      size: m[1].length,
                      snippet: m[1].slice(0, 500),
                    };
                  }
                }
              }

              // Find ALL script tags and categorize them
              const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
              let match: RegExpExecArray | null;
              const scripts: {
                index: number;
                length: number;
                hasJson: boolean;
                snippet: string;
                src?: string;
              }[] = [];
              let idx = 0;
              while ((match = scriptRegex.exec(html)) !== null) {
                const text = match[1];
                const srcMatch = match[0].match(/src="([^"]+)"/);
                if (text.length > 100 || srcMatch) {
                  scripts.push({
                    index: idx,
                    length: text.length,
                    hasJson:
                      text.includes("{") &&
                      (text.includes("game") ||
                        text.includes("Game") ||
                        text.includes("luna") ||
                        text.includes("Luna") ||
                        text.includes("asin") ||
                        text.includes("ASIN") ||
                        text.includes("title")),
                    snippet: text.slice(0, 300),
                    src: srcMatch?.[1],
                  });
                }
                idx++;
              }

              // Look for any large JSON-like blobs
              const jsonBlobRegex = /\{[^{}]{500,}/g;
              const largeBlobs: { offset: number; snippet: string }[] = [];
              let blobMatch: RegExpExecArray | null;
              while ((blobMatch = jsonBlobRegex.exec(html)) !== null) {
                if (largeBlobs.length >= 10) break;
                largeBlobs.push({
                  offset: blobMatch.index,
                  snippet: blobMatch[0].slice(0, 300),
                });
              }

              addLog(
                `Luna deep: ${scripts.length} scripts, ${Object.keys(found).length} data patterns, ${largeBlobs.length} large blobs`,
              );
              showData("Luna deep analysis", {
                htmlLength: html.length,
                knownPatterns: found,
                scripts: scripts.filter(
                  (s) => s.hasJson || s.length > 500 || s.src,
                ),
                allScriptCount: idx,
                largeJsonBlobs: largeBlobs,
              });
            } catch (err) {
              addLog(`Luna deep error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "luna-deep" ? "Analyzing…" : "Luna Deep Scan"}
        </button>

        <button
          onClick={async () => {
            setLoading("luna-api");
            try {
              // Try known Luna API patterns
              const endpoints: {
                name: string;
                url: string;
                method: string;
                headers: Record<string, string>;
                body?: string;
              }[] = [
                {
                  name: "Luna catalog (graphql)",
                  url: "https://www.amazon.com/luna/api/graphql",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify({
                    query: "{ catalog { games { id title imageUrl } } }",
                  }),
                },
                {
                  name: "Luna browse",
                  url: "https://www.amazon.com/luna/api/browse",
                  method: "GET",
                  headers: { Accept: "application/json" },
                },
                {
                  name: "Luna discover",
                  url: "https://www.amazon.com/luna/api/discover",
                  method: "GET",
                  headers: { Accept: "application/json" },
                },
                {
                  name: "Luna home",
                  url: "https://www.amazon.com/luna/api/home",
                  method: "GET",
                  headers: { Accept: "application/json" },
                },
                {
                  name: "Luna games",
                  url: "https://www.amazon.com/luna/api/games",
                  method: "GET",
                  headers: { Accept: "application/json" },
                },
                {
                  name: "Luna subscription premium",
                  url: "https://www.amazon.com/luna/api/subscription/luna-premium",
                  method: "GET",
                  headers: { Accept: "application/json" },
                },
              ];

              const results: Record<string, unknown> = {};
              for (const ep of endpoints) {
                try {
                  const resp = await fetch(ep.url, {
                    method: ep.method,
                    headers: ep.headers,
                    credentials: "include",
                    body: ep.method === "POST" ? ep.body : undefined,
                  });
                  const text = await resp.text();
                  let parsed: unknown;
                  try {
                    parsed = JSON.parse(text);
                  } catch {
                    parsed = text.slice(0, 500);
                  }
                  results[ep.name] = {
                    status: resp.status,
                    contentType: resp.headers.get("content-type"),
                    response: parsed,
                  };
                } catch (err) {
                  results[ep.name] = { error: String(err) };
                }
              }

              addLog(`Tried ${endpoints.length} Luna API endpoints`);
              showData("Luna API probe results", results);
            } catch (err) {
              addLog(`Luna API error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "luna-api" ? "Probing…" : "Luna API Probe"}
        </button>

        <button
          onClick={async () => {
            setLoading("luna-iframe");
            try {
              addLog("Loading Luna in hidden iframe, waiting for render...");
              const iframe = document.createElement("iframe");
              iframe.style.cssText =
                "position:fixed;left:-9999px;width:1280px;height:720px;opacity:0;pointer-events:none;";
              iframe.src = "https://www.amazon.com/luna/";
              document.body.appendChild(iframe);

              // Wait for the SPA to render
              const result = await new Promise<unknown>((resolve) => {
                let attempts = 0;
                const maxAttempts = 40; // 20 seconds max

                const poll = () => {
                  attempts++;
                  try {
                    const doc =
                      iframe.contentDocument ?? iframe.contentWindow?.document;
                    if (!doc) {
                      if (attempts < maxAttempts) {
                        setTimeout(poll, 500);
                        return;
                      }
                      resolve({ error: "Could not access iframe document" });
                      return;
                    }

                    // Look for rendered game content
                    const imgs = doc.querySelectorAll("img[src]");
                    const links = doc.querySelectorAll(
                      'a[href*="/luna/"], a[href*="/dp/"]',
                    );
                    const allText = doc.body?.textContent?.length ?? 0;

                    if (
                      links.length > 5 ||
                      imgs.length > 10 ||
                      (allText > 50000 && attempts > 10)
                    ) {
                      // Looks like content has rendered
                      const gameLinks: {
                        href: string;
                        text: string;
                        img?: string;
                      }[] = [];
                      for (const link of links) {
                        const href = link.getAttribute("href") ?? "";
                        if (
                          href.includes("/dp/") ||
                          href.includes("/luna/detail") ||
                          href.includes("/luna/dp")
                        ) {
                          const img = link.querySelector("img");
                          gameLinks.push({
                            href,
                            text: (
                              link.getAttribute("aria-label") ??
                              img?.getAttribute("alt") ??
                              link.textContent?.trim() ??
                              ""
                            ).slice(0, 100),
                            img: (img?.getAttribute("src") ?? "").slice(0, 200),
                          });
                        }
                      }

                      const imageList = [...imgs].slice(0, 50).map((img) => {
                        const el = img as HTMLImageElement;
                        const ancestors: string[] = [];
                        let node: Element | null = el;
                        for (let d = 0; d < 6 && node; d++) {
                          const tag = node.tagName;
                          const cls =
                            node.className?.toString().slice(0, 80) || "";
                          ancestors.push(tag + (cls ? "." + cls : ""));
                          node = node.parentElement;
                        }
                        const picture = el.closest("picture");
                        const sources = picture
                          ? [...picture.querySelectorAll("source")].map(
                              (s) => ({
                                srcset: s.getAttribute("srcset")?.slice(0, 150),
                                media: s.getAttribute("media"),
                              }),
                            )
                          : [];
                        return {
                          src: (el.getAttribute("src") ?? "").slice(0, 200),
                          alt: el.getAttribute("alt")?.slice(0, 120),
                          ancestors,
                          sources,
                          nearestLink: el
                            .closest("a")
                            ?.getAttribute("href")
                            ?.slice(0, 150),
                        };
                      });

                      resolve({
                        attempts,
                        bodyTextLength: allText,
                        totalLinks: links.length,
                        totalImages: imgs.length,
                        gameLinks: gameLinks.slice(0, 50),
                        images: imageList,
                      });
                    } else if (attempts < maxAttempts) {
                      setTimeout(poll, 500);
                    } else {
                      resolve({
                        error: "Timed out waiting for content",
                        attempts,
                        bodyTextLength: allText,
                        totalLinks: links.length,
                        totalImages: imgs.length,
                        bodySnippet: doc.body?.textContent?.slice(0, 500),
                      });
                    }
                  } catch (err) {
                    if (attempts < maxAttempts) {
                      setTimeout(poll, 500);
                      return;
                    }
                    resolve({ error: String(err), attempts });
                  }
                };

                iframe.addEventListener("load", () => setTimeout(poll, 2000));
              });

              iframe.remove();
              addLog("Luna iframe scan complete");
              showData("Luna rendered DOM", result);
            } catch (err) {
              addLog(`Luna iframe error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "luna-iframe" ? "Loading…" : "Luna Iframe Scan"}
        </button>

        <button
          onClick={async () => {
            setLoading("luna-svc");
            try {
              // Try different Luna service page types
              const pageTypes = [
                { pageType: "home", pageId: "" },
                { pageType: "browse", pageId: "" },
                { pageType: "discover", pageId: "" },
                { pageType: "game_list", pageId: "" },
                {
                  pageType: "subscription_detail",
                  pageId: "amzn1.adg.product.b085trcct6",
                },
                { pageType: "subscription_detail", pageId: "B085TRCCT6" },
                { pageType: "channel_storefront", pageId: "" },
                { pageType: "storefront", pageId: "" },
              ];

              const results: Record<string, unknown> = {};

              for (const pt of pageTypes) {
                const token = btoa(
                  JSON.stringify({
                    encryptPageId: false,
                    pageId: pt.pageId,
                    pageType: pt.pageType,
                    productStage: "Release",
                  }),
                );

                const body = {
                  clientContext: {},
                  dynamicFeatures: [],
                  featureScheme: "RETAIL_WEB_V1",
                  inputContext: { gamepadTypes: [] },
                  serviceToken: token,
                  timeout: 10000,
                };

                const label = `${pt.pageType}${pt.pageId ? ` (${pt.pageId})` : ""}`;
                try {
                  // Try the likely API endpoint
                  const resp = await fetch(
                    "https://www.amazon.com/luna/api/proxy",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                      credentials: "include",
                      body: JSON.stringify(body),
                    },
                  );
                  const text = await resp.text();
                  let parsed: unknown;
                  try {
                    parsed = JSON.parse(text);
                  } catch {
                    parsed = text.slice(0, 1000);
                  }
                  results[label] = { status: resp.status, response: parsed };
                } catch (err) {
                  results[label] = { error: String(err) };
                }
              }

              addLog(`Tried ${pageTypes.length} Luna service page types`);
              showData("Luna service probe", results);
            } catch (err) {
              addLog(`Luna service error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "luna-svc" ? "Probing…" : "Luna Service Probe"}
        </button>

        <button
          onClick={async () => {
            setLoading("luna-tempo");
            try {
              const ENDPOINT =
                "https://proxy-prod.us-east-1.tempo.digital.a2z.com/getPageRequest";

              const pageTypes = [
                { pageType: "home", pageId: "" },
                { pageType: "browse", pageId: "" },
                { pageType: "discover", pageId: "" },
                { pageType: "storefront", pageId: "" },
                { pageType: "channel_storefront", pageId: "" },
                { pageType: "subscription_detail", pageId: "B085TRCCT6" },
                { pageType: "game_list", pageId: "" },
                { pageType: "all_games", pageId: "" },
                { pageType: "library", pageId: "" },
              ];

              const results: Record<string, unknown> = {};

              for (const pt of pageTypes) {
                const token = btoa(
                  JSON.stringify({
                    encryptPageId: false,
                    pageId: pt.pageId,
                    pageType: pt.pageType,
                    productStage: "Release",
                  }),
                );

                const body = {
                  clientContext: {},
                  dynamicFeatures: [],
                  featureScheme: "RETAIL_WEB_V1",
                  inputContext: { gamepadTypes: [] },
                  serviceToken: token,
                  timeout: 10000,
                };

                const label = `${pt.pageType}${pt.pageId ? ` (${pt.pageId})` : ""}`;
                try {
                  const resp = await fetch(ENDPOINT, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Accept: "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(body),
                  });
                  const text = await resp.text();
                  let parsed: unknown;
                  try {
                    parsed = JSON.parse(text);
                  } catch {
                    parsed = text.slice(0, 2000);
                  }
                  results[label] = { status: resp.status, response: parsed };
                } catch (err) {
                  results[label] = { error: String(err) };
                }
              }

              addLog(`Tried ${pageTypes.length} Tempo page types`);
              showData("Tempo API probe", results);
            } catch (err) {
              addLog(`Tempo error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "luna-tempo" ? "Probing…" : "Luna Tempo Probe"}
        </button>

        <button
          onClick={async () => {
            setLoading("mystuff");
            try {
              const result = await fetchMyStuff();
              addLog(
                `My Stuff: ${result.watchlist.length} watchlist, ${result.library.length} library`,
              );
              showData("My Stuff", result);
            } catch (err) {
              addLog(`My Stuff error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "mystuff" ? "Fetching…" : "Fetch My Stuff"}
        </button>

        <button
          onClick={async () => {
            setLoading("foryou");
            try {
              const resp = await fetch(
                "https://www.amazon.com/gp/video/collection/mgForYou",
                {
                  credentials: "include",
                  headers: { Accept: "text/html" },
                },
              );
              const html = await resp.text();
              const doc = new DOMParser().parseFromString(html, "text/html");

              // Find all links with title IDs
              const links = doc.querySelectorAll(
                'a[href*="/dp/"], a[href*="/detail/"], a[href*="/gp/video/detail/"]',
              );
              const items: {
                href: string;
                text: string;
                img?: string;
                titleId?: string;
              }[] = [];
              const seen = new Set<string>();
              for (const link of links) {
                const href = link.getAttribute("href") ?? "";
                const titleId =
                  href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
                  href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
                  href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];
                if (titleId && seen.has(titleId)) continue;
                if (titleId) seen.add(titleId);
                const img = link.querySelector("img");
                items.push({
                  href: href.slice(0, 150),
                  text: (
                    link.getAttribute("aria-label") ??
                    img?.getAttribute("alt") ??
                    link.textContent?.trim() ??
                    ""
                  ).slice(0, 100),
                  img: img?.getAttribute("src")?.slice(0, 200),
                  titleId,
                });
              }

              // Find carousels/sections
              const sections = doc.querySelectorAll(
                'section, [class*="carousel"], [class*="Carousel"]',
              );
              const sectionInfo = [...sections].slice(0, 20).map((s) => ({
                tag: s.tagName,
                class: s.className?.toString().slice(0, 100),
                testId: s.getAttribute("data-testid"),
                heading: s
                  .querySelector("h2, h3")
                  ?.textContent?.trim()
                  ?.slice(0, 80),
                linkCount: s.querySelectorAll(
                  'a[href*="/dp/"], a[href*="/detail/"]',
                ).length,
              }));

              addLog(
                `ForYou: ${html.length} chars, ${items.length} items, ${sections.length} sections`,
              );
              showData("ForYou page", {
                htmlLength: html.length,
                title: doc.title,
                itemCount: items.length,
                items: items.slice(0, 60),
                sections: sectionInfo,
                images: [...doc.querySelectorAll("img[src]")]
                  .slice(0, 50)
                  .map((img) => ({
                    src: (img.getAttribute("src") ?? "").slice(0, 200),
                    alt: img.getAttribute("alt")?.slice(0, 80),
                    dataSrc: img.getAttribute("data-src")?.slice(0, 200),
                    parentTag: img.parentElement?.tagName,
                    parentClass: img.parentElement?.className
                      ?.toString()
                      .slice(0, 100),
                    nearestLink: img
                      .closest("a")
                      ?.getAttribute("href")
                      ?.slice(0, 100),
                    nearestSection: img
                      .closest("[data-testid]")
                      ?.getAttribute("data-testid"),
                  })),
              });
            } catch (err) {
              addLog(`ForYou error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "foryou" ? "Fetching…" : "Fetch For You"}
        </button>

        <button
          onClick={async () => {
            setLoading("livetv");
            try {
              const resp = await fetch(
                "https://www.amazon.com/gp/video/livetv",
                {
                  credentials: "include",
                  headers: { Accept: "text/html" },
                },
              );
              const html = await resp.text();
              const doc = new DOMParser().parseFromString(html, "text/html");

              const links = doc.querySelectorAll(
                'a[href*="/dp/"], a[href*="/detail/"], a[href*="/gp/video/"]',
              );
              const items: {
                href: string;
                text: string;
                img?: string;
                titleId?: string;
              }[] = [];
              const seen = new Set<string>();
              for (const link of links) {
                const href = link.getAttribute("href") ?? "";
                const titleId =
                  href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
                  href.match(/\/detail\/([A-Z0-9]{10,30})/)?.[1] ??
                  href.match(/\/gp\/video\/detail\/([A-Z0-9]{10,30})/)?.[1];
                if (titleId && seen.has(titleId)) continue;
                if (titleId) seen.add(titleId);
                const img = link.querySelector("img");
                items.push({
                  href: href.slice(0, 150),
                  text: (
                    link.getAttribute("aria-label") ??
                    img?.getAttribute("alt") ??
                    link.textContent?.trim() ??
                    ""
                  ).slice(0, 100),
                  img: img?.getAttribute("src")?.slice(0, 200),
                  titleId,
                });
              }

              const cards = doc.querySelectorAll(
                '[data-testid="card-section"]',
              );
              const cardInfo = [...cards].slice(0, 20).map((card) => {
                const cardLink = card.querySelector("a[href]");
                const cardImg = card.querySelector(
                  '[data-testid="base-image"] img[src], img[src*="pv-target-images"]',
                );
                return {
                  href: cardLink?.getAttribute("href")?.slice(0, 150),
                  text: (
                    cardLink?.getAttribute("aria-label") ??
                    cardLink?.textContent?.trim() ??
                    ""
                  ).slice(0, 100),
                  img: cardImg?.getAttribute("src")?.slice(0, 200),
                };
              });

              const sections = doc.querySelectorAll(
                '[data-testid="navigation-carousel-wrapper"], [data-testid="standard-carousel"]',
              );
              const sectionInfo = [...sections].slice(0, 20).map((s) => ({
                testId: s.getAttribute("data-testid"),
                heading: s
                  .querySelector("h2, h3")
                  ?.textContent?.trim()
                  ?.slice(0, 80),
                linkCount: s.querySelectorAll(
                  'a[href*="/dp/"], a[href*="/detail/"], a[href*="/gp/video/"]',
                ).length,
              }));

              const images = [...doc.querySelectorAll("img[src]")]
                .slice(0, 50)
                .map((img) => ({
                  src: (img.getAttribute("src") ?? "").slice(0, 200),
                  alt: img.getAttribute("alt")?.slice(0, 80),
                  nearestSection: img
                    .closest("[data-testid]")
                    ?.getAttribute("data-testid"),
                }));

              addLog(
                `LiveTV: ${html.length} chars, ${items.length} links, ${cards.length} cards, ${sections.length} sections`,
              );
              showData("LiveTV page", {
                htmlLength: html.length,
                title: doc.title,
                linkCount: items.length,
                links: items.slice(0, 40),
                cards: cardInfo,
                sections: sectionInfo,
                images: images.filter(
                  (i) =>
                    i.src.includes("pv-target-images") ||
                    i.nearestSection === "base-image",
                ),
              });
            } catch (err) {
              addLog(`LiveTV error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "livetv" ? "Fetching…" : "Fetch Live TV"}
        </button>

        <button
          onClick={async () => {
            setLoading("news");
            try {
              const resp = await fetch("https://www.amazon.com/gp/video/news", {
                credentials: "include",
                headers: { Accept: "text/html" },
              });
              const html = await resp.text();
              const doc = new DOMParser().parseFromString(html, "text/html");

              const cards = doc.querySelectorAll(
                '[data-testid="card-section"]',
              );
              const cardInfo = [...cards].slice(0, 20).map((card) => {
                const cardLink = card.querySelector("a[href]");
                const imgs = [...card.querySelectorAll("img[src]")].map(
                  (img) => ({
                    src: (img.getAttribute("src") ?? "").slice(0, 200),
                    alt: img.getAttribute("alt")?.slice(0, 80),
                    testId: img
                      .closest("[data-testid]")
                      ?.getAttribute("data-testid"),
                  }),
                );
                return {
                  href: cardLink?.getAttribute("href")?.slice(0, 150),
                  text: (
                    cardLink?.getAttribute("aria-label") ??
                    cardLink?.textContent?.trim() ??
                    ""
                  ).slice(0, 100),
                  images: imgs,
                };
              });

              // All images with pv-target or le-target or base-image
              const allImgs = [...doc.querySelectorAll("img[src]")]
                .filter((img) => {
                  const src = img.getAttribute("src") ?? "";
                  const testId =
                    img.closest("[data-testid]")?.getAttribute("data-testid") ??
                    "";
                  return (
                    src.includes("pv-target") ||
                    src.includes("le-target") ||
                    testId === "base-image"
                  );
                })
                .slice(0, 30)
                .map((img) => ({
                  src: (img.getAttribute("src") ?? "").slice(0, 200),
                  alt: img.getAttribute("alt")?.slice(0, 80),
                  testId: img
                    .closest("[data-testid]")
                    ?.getAttribute("data-testid"),
                  inCard: !!img.closest('[data-testid="card-section"]'),
                }));

              addLog(
                `News: ${html.length} chars, ${cards.length} cards, ${allImgs.length} content images`,
              );
              showData("News page", {
                htmlLength: html.length,
                cardCount: cards.length,
                cards: cardInfo,
                contentImages: allImgs,
              });
            } catch (err) {
              addLog(`News error: ${err}`);
            }
            setLoading("");
          }}
          disabled={!!loading}
        >
          {loading === "news" ? "Fetching…" : "Fetch News"}
        </button>
      </div>

      <div className="debug-panels">
        <div className="debug-panel">
          <h2>Log ({log.length})</h2>
          <div className="debug-log">
            {log.map((entry, i) => (
              <div
                key={i}
                className={`debug-log-entry${entry.data ? " debug-log-entry--clickable" : ""}`}
                onClick={() => handleShowLogData(entry)}
              >
                <span className="debug-log-time">{entry.time}</span>
                <span className="debug-log-msg">{entry.msg}</span>
                {entry.data != null && (
                  <span className="debug-log-expand">→</span>
                )}
              </div>
            ))}
            {log.length === 0 && (
              <p className="debug-empty">
                Run an action above to see results here.
              </p>
            )}
          </div>
        </div>

        <div className="debug-panel">
          <h2>Data {dataLabel && `(${dataLabel})`}</h2>
          <pre className="debug-json">
            {dataView
              ? JSON.stringify(dataView, null, 2)
              : "No data yet. Click a button above or click a log entry with →"}
          </pre>
        </div>
      </div>
    </div>
  );
}
