import { useEffect, useRef } from "react";
import { HERO_H, HERO_CTA } from "../layout";
import "./HeroTrailer.css";

export interface TrailerItem {
  videoSrc: string;
}

interface Props {
  expanded: boolean;
  trailers: TrailerItem[];
  activeIndex: number;
  onAdvance?: () => void;
}

export function HeroTrailer({
  expanded,
  trailers,
  activeIndex,
  onAdvance,
}: Props) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    trailers.forEach((_, i) => {
      const video = videoRefs.current[i];
      if (!video) return;
      if (i === activeIndex) {
        video.currentTime = 0;
        video.play();
      } else {
        video.pause();
      }
    });
  }, [activeIndex, trailers]);

  const current = trailers[activeIndex];
  if (!current) return null;

  return (
    <div
      className={`hero${expanded ? " hero--expanded" : ""}`}
      style={{ height: expanded ? "100%" : `${HERO_H}%` }}
    >
      {trailers.map((trailer, i) => (
        <video
          key={i}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          className={`hero__bg${i === activeIndex ? " hero__bg--active" : ""}`}
          src={trailer.videoSrc}
          muted
          playsInline
          onEnded={i === activeIndex ? onAdvance : undefined}
        />
      ))}

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

      <div className="hero__bottom">
        <button
          className={`hero__learn-more${expanded ? " hero__learn-more--active" : ""}`}
        >
          Learn More
        </button>
        <div className="hero__dots">
          {[0, 1, 2].map((dot) => {
            const last = trailers.length - 1;
            const activeDot =
              activeIndex === 0 ? 0 : activeIndex >= last ? 2 : 1;
            return (
              <span
                key={dot}
                className={`hero__dot${dot === activeDot ? " hero__dot--active" : ""}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
