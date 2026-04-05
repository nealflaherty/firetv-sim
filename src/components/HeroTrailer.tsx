import { HERO_H, HERO_CTA, HERO_DOTS } from "../layout";
import "./HeroTrailer.css";

interface Props {
  expanded: boolean;
  videoSrc: string;
}

export function HeroTrailer({ expanded, videoSrc }: Props) {
  return (
    <div
      className={`hero${expanded ? " hero--expanded" : ""}`}
      style={{ height: expanded ? "100%" : `${HERO_H}%` }}
    >
      <video
        className="hero__bg"
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
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
        >
          <img
            src="/fragments/IQBAR_Plant_Based_Protein_Bars_2.png"
            alt=""
            draggable={false}
          />
          <img
            src="/fragments/Learn_More.png"
            alt="Learn More"
            draggable={false}
          />
        </div>
        <div
          className="hero__dots"
          style={{ left: `${HERO_DOTS.left}%`, top: `${HERO_DOTS.top}%` }}
        >
          <span className="hero__dot hero__dot--active" />
          <span className="hero__dot" />
          <span className="hero__dot" />
        </div>
      </div>
    </div>
  );
}
