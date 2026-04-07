import { useRef } from "react";
import { motion } from "framer-motion";
import type { Trailer } from "../lib/types";
import { HERO_CTA } from "../layout";
import "./HeroTrailer.css";

interface Props {
  expanded: boolean;
  trailers: Trailer[];
  activeIndex: number;
  onAdvance?: () => void;
  transition?: object;
}

export function HeroTrailer({
  expanded,
  trailers,
  activeIndex,
  onAdvance,
  transition,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const current = trailers[activeIndex];
  if (!current) return null;

  return (
    <motion.div
      className={`hero${expanded ? " hero--expanded" : ""}`}
      animate={{ height: "100%", y: expanded ? "0%" : "-25%" }}
      transition={transition}
      style={{ overflow: "hidden" }}
    >
      <video
        key={activeIndex}
        ref={videoRef}
        className="hero__bg hero__bg--active"
        src={current.videoSrc}
        autoPlay
        muted
        playsInline
        onEnded={onAdvance}
      />

      <div className="hero__overlay" style={{ opacity: expanded ? 0 : 1 }}>
        <div
          className="hero__cta"
          style={{
            left: `${HERO_CTA.left}%`,
            top: `${HERO_CTA.top}%`,
            width: `${HERO_CTA.width}%`,
            height: `${HERO_CTA.height}%`,
          }}
        />
      </div>
    </motion.div>
  );
}
