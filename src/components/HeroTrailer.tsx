import { useRef } from "react";
import type { Trailer } from "../lib/types";
import { HERO_H, HERO_CTA, NAV_H } from "../layout";
import "./HeroTrailer.css";

interface Props {
  expanded: boolean;
  trailers: Trailer[];
  activeIndex: number;
  onAdvance?: () => void;
}

export function HeroTrailer({
  expanded,
  trailers,
  activeIndex,
  onAdvance,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const current = trailers[activeIndex];
  if (!current) return null;

  return (
    <div
      className={`hero${expanded ? " hero--expanded" : ""}`}
      style={{ height: expanded ? "100%" : `${HERO_H + NAV_H}%` }}
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
    </div>
  );
}
