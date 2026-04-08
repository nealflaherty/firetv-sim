// ==UserScript==
// @name         Fire TV Sim
// @namespace    https://www.amazon.com/gp/video/storefront/firetv
// @version      0.4.0
// @description  Replace Fire TV storefront with firetv-sim prototype
// @homepageURL  https://www.amazon.com/gp/video/storefront/firetv
// @match        https://www.amazon.com/gp/video/storefront/firetv*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      main.d35b9flhyyxzu1.amplifyapp.com
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // Determine the server to load from:
  // 1. ?dev=<host:port> query param → use that as the dev server (enables Vite HMR)
  // 2. Default → Amplify hosted app
  var AMPLIFY_URL = "https://main.d35b9flhyyxzu1.amplifyapp.com";
  var params = new URLSearchParams(window.location.search);
  var devParam = params.get("dev");
  var SERVER = devParam
    ? devParam.startsWith("http")
      ? devParam
      : "http://" + devParam
    : AMPLIFY_URL;
  var IS_DEV = SERVER.includes("localhost") || SERVER.includes("127.0.0.1");

  // Strip trailing slash
  if (SERVER.endsWith("/")) SERVER = SERVER.slice(0, -1);

  console.log("[firetv-sim] Loading from: " + SERVER);

  // Stop the original page from rendering
  window.stop();

  function init() {
    GM_xmlhttpRequest({
      method: "GET",
      url: SERVER + "/",
      onload: function (response) {
        if (response.status !== 200) {
          showError("Server returned status " + response.status);
          return;
        }

        var parser = new DOMParser();
        var doc = parser.parseFromString(response.responseText, "text/html");

        // Clear the current page
        document.documentElement.innerHTML = "";
        document.head.innerHTML = "";
        document.body.innerHTML = "";

        // Base tag so relative URLs resolve to the server
        var base = document.createElement("base");
        base.href = SERVER + "/";
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

        // Vite HMR client (only for local dev servers)
        if (IS_DEV) {
          var viteClient = document.createElement("script");
          viteClient.type = "module";
          viteClient.src = SERVER + "/@vite/client";
          document.head.appendChild(viteClient);
        }

        // Main scripts
        var scripts = doc.querySelectorAll('script[type="module"]');
        scripts.forEach(function (script) {
          var newScript = document.createElement("script");
          newScript.type = "module";
          if (script.src) {
            var url = new URL(script.getAttribute("src"), SERVER);
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

        console.log("[firetv-sim] Loaded from " + SERVER);
      },
      onerror: function () {
        showError("Could not connect to server at " + SERVER);
      },
    });
  }

  function showError(msg) {
    document.documentElement.innerHTML =
      '<head></head><body style="background:#1a1a1a;color:#999;font-family:sans-serif;text-align:center;padding-top:40vh">' +
      "<p>" +
      msg +
      "</p>" +
      '<p style="margin-top:1em">Server: <code>' +
      SERVER +
      "</code></p>" +
      '<p style="margin-top:0.5em;font-size:0.9em;color:#666">Use <code>?dev=host:port</code> to specify a different server</p>' +
      "</body>";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
