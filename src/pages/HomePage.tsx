import { useEffect, useRef, useState } from "react";
import {
  HERO_H,
  HERO_CTA,
  HERO_DOTS,
  NAV_TOP,
  NAV_H,
  ALL_NAV,
  ROW_1,
  ROW_2,
  tileStyle,
} from "../layout";
import "./HomePage.css";

const NAV_ROW = ALL_NAV.map((_item, i) => ({ id: `nav-${i}` }));
const TILE_ROW_1 = ROW_1.items.map((_item, i) => ({ id: `r1-${i}` }));
const TILE_ROW_2 = ROW_2.items.map((_item, i) => ({ id: `r2-${i}` }));

const ROWS = [NAV_ROW, TILE_ROW_1, TILE_ROW_2];
const INITIAL: [number, number] = [0, 4];

export function HomePage() {
  const [pos, setPos] = useState(INITIAL);
  const [expanded, setExpanded] = useState(true);
  const expandedRef = useRef(true);

  const [row, col] = pos;

  useEffect(() => {
    const move = (e: KeyboardEvent) => {
      const key = e.key;
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key))
        return;
      e.preventDefault();

      if (key === "ArrowUp") {
        if (expandedRef.current) return;
        setPos(([r, c]) => {
          if (r === 0) {
            expandedRef.current = true;
            setExpanded(true);
            return [r, c];
          }
          return [r - 1, r - 1 === 0 ? c : 0];
        });
        return;
      }

      if (key === "ArrowDown") {
        if (expandedRef.current) {
          expandedRef.current = false;
          setExpanded(false);
          return;
        }
        setPos(([r, c]) => (r < ROWS.length - 1 ? [r + 1, 0] : [r, c]));
        return;
      }

      if (expandedRef.current) return;

      setPos(([r, c]) => {
        if (key === "ArrowLeft") return [r, Math.max(0, c - 1)];
        if (key === "ArrowRight")
          return [r, Math.min(ROWS[r].length - 1, c + 1)];
        return [r, c];
      });
    };

    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, []);

  const isFocused = (r: number, c: number) => row === r && col === c;
  const inContent = row >= 1;
  const state = row === 0 ? "hero" : row === 1 ? "row1" : "row2";

  const DETAIL_H = 24;

  const shift =
    state === "hero" ? 0 : state === "row1" ? NAV_TOP : NAV_TOP + NAV_H;
  const tileOffset1 = row >= 1 ? DETAIL_H : 0;
  const tileOffset2 = row >= 1 ? DETAIL_H : 0;

  const selectedLabel =
    row === 1 ? ROW_1.items[col]?.label : ROW_2.items[col]?.label;

  return (
    <div className="home-page">
      <div className={`viewport state-${state}`}>
        {/* Content layer — hero, nav, detail, tiles all in 1080-space */}
        <div
          className="content-layer"
          style={{ transform: `translateY(-${shift}%)` }}
        >
          <div
            className={`hero${expanded ? " hero--expanded" : ""}`}
            style={{ height: expanded ? "100%" : `${HERO_H}%` }}
          >
            <video
              className="hero__bg"
              src="https://abexlcnaaaaaaaamletu7vv43fzhj.mid-pop-vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fVVMgJTABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/394d/7b22/7552/4d05-9f61-1e6826fd0b69/9297c5d3-d3f7-45a4-9918-77427ee09bc8_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235484.0"
              autoPlay
              muted
              loop
              playsInline
            />
            <div
              className="hero__overlay"
              style={{ opacity: expanded ? 0 : 1 }}
            >
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

          <div
            className="below-hero"
            style={{
              transform: expanded
                ? `translateY(${100 - NAV_TOP - NAV_H}%)`
                : undefined,
            }}
          >
            <div
              className="nav-bg"
              style={{ top: `${NAV_TOP}%`, height: `${NAV_H}%` }}
            />

            {ALL_NAV.map((item, i) => (
              <div
                key={item.label}
                className={`nav-item${isFocused(0, i) ? " focused" : ""}`}
                style={{
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                }}
              >
                <img src={item.img} alt={item.label} draggable={false} />
                {isFocused(0, i) && (
                  <span className="focus-label">{item.label}</span>
                )}
              </div>
            ))}

            {inContent && (
              <div className="detail-panel" style={{ top: `${shift + 12.4}%` }}>
                <h1 className="detail-title">{selectedLabel}</h1>
                <div className="detail-meta">
                  <img
                    src="/fragments/IMDB_Rating_6_8_out_of_10.png"
                    alt="IMDb 6.8"
                  />
                  <img
                    src="/fragments/from_93018_customers.png"
                    alt="93K ratings"
                  />
                  <img src="/fragments/1_hour_41_minutes.png" alt="1h 41m" />
                  <img src="/fragments/2023.png" alt="2023" />
                  <img src="/fragments/Rated_R.png" alt="R" />
                  <img src="/fragments/X-ray_available.png" alt="X-Ray" />
                  <img
                    src="/fragments/Closed_captioning_available.png"
                    alt="CC"
                  />
                  <img src="/fragments/Available_in_UHD.png" alt="UHD" />
                </div>
                <p className="detail-desc">
                  <img
                    src="/fragments/An_ordinary_family_man_Nicolas_Cage_finds_his_life_turned_upside_down_when_milli.png"
                    alt="Description"
                  />
                </p>
                <div className="detail-entitlement">
                  <img
                    src="/fragments/Free_with_Ads_Play_now_on_Tubi.png"
                    alt="Free with Ads"
                  />
                </div>
              </div>
            )}

            {ROW_1.items.map((item, i) => {
              const s = tileStyle(ROW_1, i);
              return (
                <div
                  key={item.label}
                  className={`tile${isFocused(1, i) ? " focused" : ""}`}
                  style={{
                    ...s,
                    top: `${parseFloat(s.top) + tileOffset1}%`,
                    opacity: row >= 2 ? 0 : 1,
                  }}
                >
                  <img src={item.img} alt={item.label} draggable={false} />
                </div>
              );
            })}

            {ROW_2.items.map((item, i) => {
              const s = tileStyle(ROW_2, i);
              return (
                <div
                  key={item.label}
                  className={`tile${isFocused(2, i) ? " focused" : ""}`}
                  style={{ ...s, top: `${parseFloat(s.top) + tileOffset2}%` }}
                >
                  <img src={item.img} alt={item.label} draggable={false} />
                </div>
              );
            })}
          </div>
        </div>

        {state === "row2" && (
          <div className="breadcrumb">
            <img
              src="/fragments/Home_breadcrumb.png"
              alt="Home"
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
