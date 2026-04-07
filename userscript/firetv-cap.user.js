// ==UserScript==
// @name         Fire TV Cap
// @namespace    https://github.com/firetv-cap
// @version      0.3.0
// @description  Replace Fire TV storefront with firetv-cap prototype
// @match        https://www.amazon.com/gp/video/storefront/firetv*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const DEV_SERVER = "http://localhost:5173";

  // Stop the original page from rendering
  window.stop();

  function init() {
    GM_xmlhttpRequest({
      method: "GET",
      url: DEV_SERVER + "/",
      onload: function (response) {
        if (response.status !== 200) {
          showError("Dev server returned status " + response.status);
          return;
        }

        var parser = new DOMParser();
        var doc = parser.parseFromString(response.responseText, "text/html");

        // Clear the current page
        document.documentElement.innerHTML = "";
        document.head.innerHTML = "";
        document.body.innerHTML = "";

        // Base tag so relative URLs resolve to the dev server
        var base = document.createElement("base");
        base.href = DEV_SERVER + "/";
        document.head.appendChild(base);

        // Copy meta tags
        var metas = doc.querySelectorAll("meta");
        metas.forEach(function (meta) {
          document.head.appendChild(meta.cloneNode(true));
        });

        // Copy link tags
        var links = doc.querySelectorAll("link");
        links.forEach(function (link) {
          document.head.appendChild(link.cloneNode(true));
        });

        // Root div
        var root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);

        // Vite HMR client
        var viteClient = document.createElement("script");
        viteClient.type = "module";
        viteClient.src = DEV_SERVER + "/@vite/client";
        document.head.appendChild(viteClient);

        // Main scripts
        var scripts = doc.querySelectorAll('script[type="module"]');
        scripts.forEach(function (script) {
          var newScript = document.createElement("script");
          newScript.type = "module";
          if (script.src) {
            var url = new URL(script.getAttribute("src"), DEV_SERVER);
            newScript.src = url.href;
          } else if (script.textContent) {
            newScript.textContent = script.textContent;
          }
          document.body.appendChild(newScript);
        });

        var style = document.createElement("style");
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
