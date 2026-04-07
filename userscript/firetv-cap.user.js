// ==UserScript==
// @name         Fire TV Cap
// @namespace    https://github.com/firetv-cap
// @version      0.2.0
// @description  Replace Fire TV storefront with firetv-cap prototype
// @match        https://www.amazon.com/gp/video/storefront*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const DEV_SERVER = "http://localhost:5173";

  // Stop the original page from rendering
  window.stop();

  // Wait for the document to be ready enough to manipulate
  function init() {
    // Fetch the Vite dev server's index.html to get the entry point
    GM_xmlhttpRequest({
      method: "GET",
      url: DEV_SERVER + "/",
      onload: function (response) {
        if (response.status !== 200) {
          showError("Dev server returned status " + response.status);
          return;
        }

        // Parse the HTML to find script and link tags
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.responseText, "text/html");

        // Clear the current page
        document.documentElement.innerHTML = "";
        document.head.innerHTML = "";
        document.body.innerHTML = "";

        // Set up base tag so relative URLs resolve to the dev server
        const base = document.createElement("base");
        base.href = DEV_SERVER + "/";
        document.head.appendChild(base);

        // Copy meta tags
        const metas = doc.querySelectorAll("meta");
        metas.forEach(function (meta) {
          document.head.appendChild(meta.cloneNode(true));
        });

        // Copy link tags (CSS, favicon, etc.)
        const links = doc.querySelectorAll("link");
        links.forEach(function (link) {
          const newLink = link.cloneNode(true);
          document.head.appendChild(newLink);
        });

        // Set up the root div
        const root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);

        // Inject Vite's client for HMR
        const viteClient = document.createElement("script");
        viteClient.type = "module";
        viteClient.src = DEV_SERVER + "/@vite/client";
        document.head.appendChild(viteClient);

        // Find and inject the main script
        const scripts = doc.querySelectorAll('script[type="module"]');
        scripts.forEach(function (script) {
          const newScript = document.createElement("script");
          newScript.type = "module";
          if (script.src) {
            // Resolve relative URLs against the dev server
            const url = new URL(script.getAttribute("src"), DEV_SERVER);
            newScript.src = url.href;
          } else if (script.textContent) {
            newScript.textContent = script.textContent;
          }
          document.body.appendChild(newScript);
        });

        // Add a style to hide any Amazon remnants
        const style = document.createElement("style");
        style.textContent =
          "* { margin: 0; padding: 0; box-sizing: border-box; }";
        document.head.appendChild(style);
      },
      onerror: function () {
        showError("Could not connect to dev server at " + DEV_SERVER);
      },
    });
  }

  function showError(msg) {
    document.documentElement.innerHTML =
      '<head></head><body style="background:#1a1a1a;color:#999;font-family:sans-serif;text-align:center;padding-top:40vh">' +
      "<p>" +
      msg +
      "</p>" +
      '<p style="margin-top:1em">Make sure the dev server is running: <code>npm run dev</code></p>' +
      "</body>";
  }

  // Run as soon as possible
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
