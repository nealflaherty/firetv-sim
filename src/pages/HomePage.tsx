import { useEffect, useRef, useState } from "react";
import { NAV_TOP, NAV_H, ALL_NAV, ROW_1, ROW_2 } from "../layout";
import { HeroTrailer } from "../components/HeroTrailer";
import { NavBar } from "../components/NavBar";
import { DetailPanel } from "../components/DetailPanel";
import { TileRow } from "../components/TileRow";
import "./HomePage.css";

const HERO_VIDEO_SRC =
  "https://abexlcnaaaaaaaamletu7vv43fzhj.mid-pop-vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fVVMgJTABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/394d/7b22/7552/4d05-9f61-1e6826fd0b69/9297c5d3-d3f7-45a4-9918-77427ee09bc8_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235484.0";

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

  const inContent = row >= 1;
  const state = row === 0 ? "hero" : row === 1 ? "row1" : "row2";

  // row2 uses same shift as row1 — nav bar stays visible, just shows breadcrumb
  const shift = state === "hero" ? 0 : NAV_TOP;
  const selectedLabel =
    row === 1 ? ROW_1.items[col]?.label : ROW_2.items[col]?.label;

  return (
    <div className="home-page">
      <div className={`viewport state-${state}`}>
        <div
          className="content-layer"
          style={{ transform: `translateY(-${shift}%)` }}
        >
          <HeroTrailer expanded={expanded} videoSrc={HERO_VIDEO_SRC} />

          <div
            className="below-hero"
            style={{
              transform: expanded
                ? `translateY(${100 - NAV_TOP - NAV_H}%)`
                : undefined,
            }}
          >
            {/* Spacer for the hero area above the nav */}
            <div
              className="below-hero__spacer"
              style={{ height: `${NAV_TOP}%` }}
            />

            <NavBar
              focusedIndex={row === 0 ? col : null}
              showBreadcrumb={state === "row2"}
            />

            <div className="content-rows">
              <DetailPanel title={selectedLabel ?? ""} visible={inContent} />

              <TileRow
                row={ROW_1}
                focusedIndex={row === 1 ? col : null}
                scrolledOut={row >= 2}
              />
              <TileRow row={ROW_2} focusedIndex={row === 2 ? col : null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
