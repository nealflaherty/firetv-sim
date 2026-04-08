import { useState } from "react";
import { isAmazonContext } from "../lib/amazonService";
import "./InstallBanner.css";

const USERSCRIPT_URL =
  "https://main.d35b9flhyyxzu1.amplifyapp.com/firetv-sim.user.js";

export function InstallBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (isAmazonContext() || dismissed) return null;

  return (
    <div className="install-banner">
      <span>
        Install the{" "}
        <a href={USERSCRIPT_URL} target="_blank" rel="noopener noreferrer">
          Fire TV Sim userscript
        </a>{" "}
        then visit{" "}
        <a
          href="https://www.amazon.com/gp/video/storefront/firetv"
          target="_blank"
          rel="noopener noreferrer"
        >
          amazon.com/gp/video/storefront/firetv
        </a>{" "}
        for the best experience with live Amazon data.
      </span>
      <button
        className="install-banner__close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
