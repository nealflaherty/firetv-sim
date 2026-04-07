// ==UserScript==
// @name         Fire TV API Sniffer
// @namespace    https://github.com/firetv-cap
// @version      0.1.0
// @description  Intercept and log API calls on Amazon Video storefront
// @match        https://www.amazon.com/gp/video/storefront*
// @match        https://www.amazon.com/gp/video/offers*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // Keywords that suggest video/content API calls
  const CONTENT_KEYWORDS = [
    "video",
    "browse",
    "storefront",
    "catalog",
    "content",
    "title",
    "season",
    "episode",
    "asin",
    "detail",
    "recommendation",
    "carousel",
    "widget",
    "slate",
    "playback",
    "stream",
    "manifest",
    "license",
    "search",
    "suggest",
    "autocomplete",
    "atv",
    "pv",
    "prime",
    "firetv",
  ];

  // Store captured calls
  window.__apiCalls = [];

  function isContentCall(url) {
    const lower = url.toLowerCase();
    return CONTENT_KEYWORDS.some((kw) => lower.includes(kw));
  }

  function logCall(method, url, body, response, type) {
    const isContent = isContentCall(url);
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      method,
      url,
      body: body || null,
      responseStatus: response?.status,
      responseBody: null,
      isContent,
    };

    // Try to capture response body
    if (response && typeof response.clone === "function") {
      response
        .clone()
        .text()
        .then((text) => {
          try {
            entry.responseBody = JSON.parse(text);
            // Capture enrichItemMetadata responses
            if (
              url.includes("enrichItemMetadata") &&
              entry.responseBody?.enrichedItems
            ) {
              window.__enrichedItems.push(...entry.responseBody.enrichedItems);
              console.log(
                `%c📦 Captured ${entry.responseBody.enrichedItems.length} enriched items`,
                "color: #43e97b; font-weight: bold",
              );
            }
          } catch {
            entry.responseBody = text.slice(0, 2000);
          }
        })
        .catch(() => {});
    }

    window.__apiCalls.push(entry);

    if (isContent) {
      console.groupCollapsed(
        `%c🎬 [${type}] ${method} ${url.slice(0, 120)}`,
        "color: #4facfe; font-weight: bold",
      );
      if (body) console.log("Body:", body);
      console.log("Entry:", entry);
      console.groupEnd();
    }
  }

  // Patch fetch
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const [input, init] = args;
    const url = typeof input === "string" ? input : input?.url || String(input);
    const method = init?.method || "GET";
    const body = init?.body;

    let bodyData = null;
    if (body) {
      try {
        bodyData = typeof body === "string" ? JSON.parse(body) : body;
      } catch {
        bodyData =
          typeof body === "string" ? body.slice(0, 1000) : String(body);
      }
    }

    return originalFetch.apply(this, args).then((response) => {
      logCall(method, url, bodyData, response, "fetch");
      return response;
    });
  };

  // Patch XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__method = method;
    this.__url = typeof url === "string" ? url : String(url);
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    let bodyData = null;
    if (body) {
      try {
        bodyData = typeof body === "string" ? JSON.parse(body) : body;
      } catch {
        bodyData =
          typeof body === "string" ? body.slice(0, 1000) : String(body);
      }
    }

    this.addEventListener("load", () => {
      logCall(
        this.__method,
        this.__url,
        bodyData,
        {
          status: this.status,
          clone: () => ({ text: () => Promise.resolve(this.responseText) }),
        },
        "xhr",
      );
    });

    return originalSend.apply(this, [body]);
  };

  // Store enrichItemMetadata responses separately for easy access
  window.__enrichedItems = [];

  // Helper functions available in console
  window.__showContentCalls = function () {
    const content = window.__apiCalls.filter((c) => c.isContent);
    console.table(
      content.map((c) => ({
        type: c.type,
        method: c.method,
        url: c.url.slice(0, 100),
        status: c.responseStatus,
        hasBody: !!c.body,
      })),
    );
    return content;
  };

  window.__showAllCalls = function () {
    console.table(
      window.__apiCalls.map((c) => ({
        type: c.type,
        method: c.method,
        url: c.url.slice(0, 100),
        status: c.responseStatus,
        isContent: c.isContent,
      })),
    );
    return window.__apiCalls;
  };

  window.__getCallsByUrl = function (pattern) {
    return window.__apiCalls.filter((c) =>
      c.url.toLowerCase().includes(pattern.toLowerCase()),
    );
  };

  window.__showEnriched = function () {
    console.log("Enriched items:", window.__enrichedItems);
    return window.__enrichedItems;
  };

  window.__findAsin = function (asin) {
    const calls = window.__apiCalls.filter((c) => {
      const bodyStr = JSON.stringify(c.body || "");
      const respStr = JSON.stringify(c.responseBody || "");
      return bodyStr.includes(asin) || respStr.includes(asin);
    });
    console.log(`Found ${calls.length} calls mentioning ${asin}:`, calls);
    return calls;
  };

  console.log(
    "%c🎬 Fire TV API Sniffer active",
    "color: #4facfe; font-size: 14px; font-weight: bold",
  );
  console.log("Commands:");
  console.log("  __showContentCalls()  — show video/content API calls");
  console.log("  __showAllCalls()      — show all intercepted calls");
  console.log('  __getCallsByUrl("x")  — filter calls by URL pattern');
  console.log('  __findAsin("B00...")   — find calls mentioning an ASIN');
  console.log("  __showEnriched()      — show enrichItemMetadata results");
  console.log("  __apiCalls            — raw array of all calls");
})();
