import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import * as dashjs from "dashjs";
import type { ContentItem } from "../lib/types";
import "./DetailPanel.css";

interface Props {
  item: ContentItem | null;
  visible: boolean;
}

function formatRuntime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

const makeContainerVariants = (delay: number) => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: delay,
      staggerChildren: 0.08,
    },
  },
});

const lineVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export function DetailPanel({ item, visible }: Props) {
  const wasVisible = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dashRef = useRef<dashjs.MediaPlayerClass | null>(null);

  useEffect(() => {
    wasVisible.current = visible;
  }, [visible]);

  // Manage DASH playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = visible && item?.videoSrc ? item.videoSrc : "";
    const isDash = src.endsWith(".mpd") || src.includes(".mpd?");

    // Clean up previous dash player
    if (dashRef.current) {
      dashRef.current.reset();
      dashRef.current = null;
    }

    if (!src) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    if (isDash) {
      const player = dashjs.MediaPlayer().create();
      player.initialize(video, src, true);
      player.updateSettings({
        streaming: { buffer: { fastSwitchEnabled: true } },
      });
      dashRef.current = player;
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (dashRef.current) {
        dashRef.current.reset();
        dashRef.current = null;
      }
    };
  }, [item?.id, item?.videoSrc, visible]);

  const delay = wasVisible.current ? 0 : 0.35;
  const hasVideo = visible && !!item?.videoSrc;

  // Generate a higher-res hero image from the thumbnail URL
  const heroImage = item?.thumbnail
    ? item.thumbnail
        .replace(/_SX\d+/, "_SX1280")
        .replace(/_UR\d+,\d+/, "_UR1920,1080")
    : null;

  return (
    <div
      className={`detail-panel-wrapper${visible ? " detail-panel-wrapper--open" : ""}`}
    >
      <div className="detail-panel">
        {/* Background image — shown when no video is playing */}
        {heroImage && !hasVideo && (
          <div
            className="detail-panel__bg"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        )}
        {/* Trailer video — single persistent element, src managed by effect */}
        <video
          ref={videoRef}
          className="detail-panel__video"
          style={{ display: hasVideo ? undefined : "none" }}
          playsInline
        />
        <motion.div
          className="detail-panel__content"
          key={item?.id}
          variants={makeContainerVariants(delay)}
          initial="hidden"
          animate={visible && item ? "visible" : "hidden"}
        >
          {item && (
            <>
              <motion.div
                className="detail-slot--title"
                variants={lineVariants}
              >
                <h1 className="detail-title">{item.title}</h1>
              </motion.div>
              <motion.div className="detail-slot--meta" variants={lineVariants}>
                <div className="detail-meta">
                  {item.rating && (
                    <span className="detail-text">★ {item.rating}</span>
                  )}
                  {item.ratingCount != null && (
                    <span className="detail-text">
                      ({formatCount(item.ratingCount)})
                    </span>
                  )}
                  {item.runtime != null && (
                    <span className="detail-text">
                      {formatRuntime(item.runtime)}
                    </span>
                  )}
                  {item.year && (
                    <span className="detail-text">{item.year}</span>
                  )}
                  {item.maturity && (
                    <span className="detail-bordered">{item.maturity}</span>
                  )}
                  {item.features?.map((f) => (
                    <span key={f} className="detail-bordered">
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
              <motion.div className="detail-slot--desc" variants={lineVariants}>
                {item.description && (
                  <p className="detail-desc">{item.description}</p>
                )}
              </motion.div>
              <motion.div
                className="detail-slot--action"
                variants={lineVariants}
              >
                {item.entitlement && (
                  <p className="detail-entitlement">
                    <img
                      className="detail-entitlement__check"
                      src="/fragments/blue_check.svg"
                      alt=""
                    />
                    {item.entitlement}
                  </p>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
