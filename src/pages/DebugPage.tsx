import { useState } from "react";
import {
  isAmazonContext,
  fetchStorefrontHtml,
  enrichItemMetadata,
  fetchAmazonStorefront,
  inspectAsinInDom,
  resolvePlaybackUrl,
} from "../lib/amazonService";
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
