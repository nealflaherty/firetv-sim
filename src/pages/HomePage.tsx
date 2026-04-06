import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_TOP, NAV_H, ALL_NAV, ROW_1, ROW_2 } from "../layout";
import { HeroTrailer, type TrailerItem } from "../components/HeroTrailer";
import { NavBar } from "../components/NavBar";
import { DetailPanel } from "../components/DetailPanel";
import { TileRow } from "../components/TileRow";
import "./HomePage.css";

const TRAILERS: TrailerItem[] = [
  {
    videoSrc:
      "https://abexlcnaaaaaaaamletu7vv43fzhj.mid-pop-vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fVVMgJTABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/394d/7b22/7552/4d05-9f61-1e6826fd0b69/9297c5d3-d3f7-45a4-9918-77427ee09bc8_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235484.0",
  },
  {
    videoSrc:
      "https://abexlcnaaaaaaaamlyjrns6ymqkdm.vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fR0IgHzABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/91a0/e404/5db9/4796-a1fe-6901ea12d00f/a920aba9-ebf6-46c8-bc0d-3accf0055117_video_12.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235614.0",
  },
  {
    videoSrc:
      "https://abexlcnaaaaaaaamlsbrxqnoa6uzl.vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fR0IgHzABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/ff77/6225/383e/4650-900c-96656dd7d85e/caf5918f-e089-4b42-ab9f-997c4ce36707_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235614.0",
  },
];

const NAV_ROW = ALL_NAV.map((_item, i) => ({ id: `nav-${i}` }));
const TILE_ROW_1 = ROW_1.items.map((_item, i) => ({ id: `r1-${i}` }));
const TILE_ROW_2 = ROW_2.items.map((_item, i) => ({ id: `r2-${i}` }));

const ROWS = [NAV_ROW, TILE_ROW_1, TILE_ROW_2];
const INITIAL: [number, number] = [0, 4];

export function HomePage() {
  const [pos, setPos] = useState(INITIAL);
  const [expanded, setExpanded] = useState(true);
  const expandedRef = useRef(true);
  const [trailerIndex, setTrailerIndex] = useState(0);

  const advanceTrailer = useCallback(() => {
    setTrailerIndex((i) => (i + 1) % TRAILERS.length);
  }, []);

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

      // Left/right in expanded state controls the trailer carousel (wraps around)
      if (expandedRef.current) {
        if (key === "ArrowLeft") {
          setTrailerIndex((i) => (i - 1 + TRAILERS.length) % TRAILERS.length);
        } else if (key === "ArrowRight") {
          setTrailerIndex((i) => (i + 1) % TRAILERS.length);
        }
        return;
      }

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
          <HeroTrailer
            expanded={expanded}
            trailers={TRAILERS}
            activeIndex={trailerIndex}
            onAdvance={advanceTrailer}
          />

          <div
            className="below-hero"
            style={{
              transform: expanded
                ? `translateY(${100 - NAV_TOP - NAV_H}%)`
                : undefined,
            }}
          >
            <div
              className="below-hero__spacer"
              style={{ height: `${NAV_TOP}%` }}
            >
              <div className="carousel-controls">
                <button
                  className={`carousel-controls__learn-more${expanded ? " carousel-controls__learn-more--active" : ""}`}
                >
                  Learn More
                </button>
                <div className="carousel-controls__dots">
                  {[0, 1, 2].map((dot) => {
                    const last = TRAILERS.length - 1;
                    const activeDot =
                      trailerIndex === 0 ? 0 : trailerIndex >= last ? 2 : 1;
                    return (
                      <span
                        key={dot}
                        className={`carousel-controls__dot${dot === activeDot ? " carousel-controls__dot--active" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <NavBar
              focusedIndex={row === 0 ? col : null}
              showBreadcrumb={state === "row2"}
              translucent={expanded}
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
