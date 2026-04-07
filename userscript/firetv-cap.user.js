// ==UserScript==
// @name         Fire TV Cap
// @namespace    https://github.com/firetv-cap
// @version      0.1.0
// @description  Replace Fire TV storefront with firetv-cap prototype
// @match        https://www.amazon.com/gp/video/storefront/firetv*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const DEV_SERVER = "http://localhost:5173";

  // Stop the original page from loading
  window.stop();

  // Clear the page and set up the shell
  document.documentElement.innerHTML = `
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Fire TV Cap</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a1a; }
        iframe {
          width: 100%;
          height: 100%;
          border: none;
          position: fixed;
          top: 0;
          left: 0;
        }
        .firetv-cap-error {
          color: #999;
          font-family: -apple-system, sans-serif;
          text-align: center;
          padding-top: 40vh;
          font-size: 14px;
        }
        .firetv-cap-error a { color: #4facfe; }
      </style>
    </head>
    <body>
      <iframe id="firetv-cap-frame" src="${DEV_SERVER}"></iframe>
    </body>
  `;

  // Forward keyboard events from the parent to the iframe
  const iframe = document.getElementById("firetv-cap-frame");

  iframe.addEventListener("load", () => {
    // Check if the dev server is actually running
    try {
      iframe.contentWindow.document;
    } catch (e) {
      document.body.innerHTML = `
        <div class="firetv-cap-error">
          <p>Could not connect to firetv-cap dev server.</p>
          <p>Make sure it's running: <code>npm run dev</code></p>
          <p>Then reload this page.</p>
          <br/>
          <a href="${DEV_SERVER}" target="_blank">Open dev server directly →</a>
        </div>
      `;
    }
  });

  iframe.addEventListener("error", () => {
    document.body.innerHTML = `
      <div class="firetv-cap-error">
        <p>Dev server not running at <code>${DEV_SERVER}</code></p>
        <p>Start it with: <code>npm run dev</code></p>
      </div>
    `;
  });
})();
