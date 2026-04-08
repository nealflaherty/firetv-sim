import { useCallback, useEffect, useRef, useState } from "react";
import { AMAZON_ORIGIN } from "../lib/constants";
import "./VideoPlayer.css";

interface Props {
  /** ASIN / titleID to play, or null to hide */
  titleId: string | null;
  /** Optional custom URL to load instead of the default video player URL */
  url?: string | null;
  onClose: () => void;
}

/**
 * Full-screen iframe overlay that loads Amazon's video player page
 * or a custom URL (e.g. Luna game detail page).
 * Since the userscript runs on amazon.com we're same-origin,
 * so X-Frame-Options: SAMEORIGIN won't block us.
 */
export function VideoPlayer({ titleId, url, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [mouseActive, setMouseActive] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const playerUrl = url
    ? url
    : titleId
      ? `${AMAZON_ORIGIN}/gp/video/detail/${titleId}/ref=atv_dp_atf_est_uhd_mv_wfb_t1ADAAAAAA0wr0?autoplay=1&t=0`
      : null;

  // Dismiss on Escape or Backspace
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.key === "Escape" ||
        e.key === "Backspace" ||
        e.key === "b" ||
        e.key === "B"
      ) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!titleId) return;
    // Listen on parent window (capture phase)
    window.addEventListener("keydown", handleKey, true);

    // Also listen inside the iframe once it loads — the iframe steals focus
    // so parent keydown never fires while it's focused
    const iframe = iframeRef.current;
    const attachToIframe = () => {
      try {
        const iframeDoc =
          iframe?.contentDocument ?? iframe?.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.addEventListener("keydown", handleKey, true);

          // Hide Amazon's nav bar inside the iframe
          if (!iframeDoc.getElementById("firetv-sim-iframe-style")) {
            const style = iframeDoc.createElement("style");
            style.id = "firetv-sim-iframe-style";
            style.textContent =
              "#retail_nav_bar, #nav-main, #nav-belt { height: 0 !important; overflow: hidden !important; }";
            iframeDoc.head.appendChild(style);
          }
        }
      } catch {
        // Can't access iframe DOM
      }
    };

    if (iframe) {
      iframe.addEventListener("load", attachToIframe);
      // Also try immediately in case it's already loaded
      attachToIframe();
    }

    return () => {
      window.removeEventListener("keydown", handleKey, true);
      if (iframe) iframe.removeEventListener("load", attachToIframe);
      try {
        const iframeDoc =
          iframe?.contentDocument ?? iframe?.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.removeEventListener("keydown", handleKey, true);
        }
      } catch {
        // ignore
      }
    };
  }, [titleId, handleKey]);

  // Reset loading state when titleId changes
  useEffect(() => {
    if (titleId) setLoading(true);
  }, [titleId]);

  // Show back button on mouse movement, auto-hide after 3s
  useEffect(() => {
    if (!titleId) return;

    const show = () => {
      setMouseActive(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setMouseActive(false), 3000);
    };

    window.addEventListener("mousemove", show);
    return () => {
      window.removeEventListener("mousemove", show);
      clearTimeout(hideTimer.current);
    };
  }, [titleId]);

  const isVideoUrl = !url;

  // Poll the iframe for an actively playing <video> element
  useEffect(() => {
    if (!titleId || !playerUrl) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval>;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    const checkVideo = () => {
      try {
        // Try contentDocument first
        let doc = iframeRef.current?.contentDocument;
        // Fallback: contentWindow.document
        if (!doc) doc = iframeRef.current?.contentWindow?.document ?? null;
        if (!doc) return false;

        const video = doc.querySelector("video");
        if (video && video.readyState >= 2 && !video.paused) {
          return true;
        }
      } catch {
        // Security error — can't access iframe DOM
      }
      return false;
    };

    const onIframeLoad = () => {
      if (!isVideoUrl) {
        // Non-video pages (e.g. Luna detail) — reveal shortly after load
        fallbackTimer = setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, 800);
        return;
      }

      // Video pages — poll for playing video
      timer = setInterval(() => {
        if (checkVideo()) {
          if (!cancelled) setLoading(false);
          clearInterval(timer);
          clearTimeout(fallbackTimer);
        }
      }, 150);

      // Fallback: reveal after 4s even if we can't detect the video
      fallbackTimer = setTimeout(() => {
        if (!cancelled) setLoading(false);
        clearInterval(timer);
      }, 4000);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", onIframeLoad);
    }

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(fallbackTimer);
      if (iframe) iframe.removeEventListener("load", onIframeLoad);
    };
  }, [titleId, playerUrl]);

  if (!playerUrl) return null;

  return (
    <div className="video-player-overlay">
      {loading && (
        <div className="video-player-overlay__loading">
          <div className="video-player-overlay__spinner" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        className={`video-player-overlay__iframe${loading ? " video-player-overlay__iframe--hidden" : ""}`}
        src={playerUrl}
        allow="autoplay; encrypted-media; fullscreen"
      />
      <button
        className={`video-player-overlay__back${mouseActive ? " video-player-overlay__back--visible" : ""}`}
        onClick={onClose}
        aria-label="Close player"
      >
        ← Back
      </button>
    </div>
  );
}
