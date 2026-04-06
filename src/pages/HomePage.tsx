import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_TOP, NAV_H, ALL_NAV } from "../layout";
import { useHomeData } from "../lib/useHomeData";
import { HeroTrailer } from "../components/HeroTrailer";
import { NavBar } from "../components/NavBar";
import { DetailPanel } from "../components/DetailPanel";
import { TileRow } from "../components/TileRow";
import "./HomePage.css";

const NAV_ROW = ALL_NAV.map((_item, i) => ({ id: `nav-${i}` }));
const INITIAL: [number, number] = [0, 4];

const transition = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };

export function HomePage() {
  const { trailers, rows, thumbnails, loading } = useHomeData();

  const [pos, setPos] = useState(INITIAL);
  const [expanded, setExpanded] = useState(true);
  const expandedRef = useRef(true);
  const [trailerIndex, setTrailerIndex] = useState(0);

  const advanceTrailer = useCallback(() => {
    setTrailerIndex((i) => (i + 1) % Math.max(1, trailers.length));
  }, [trailers.length]);

  const contentRows = useMemo(() => {
    const result: {
      id: string;
      items: { id: string; title: string; thumbnail?: string }[];
    }[] = [];
    for (const [id, row] of rows) {
      const thumbs = thumbnails.get(id) ?? {};
      result.push({
        id,
        items: row.items.map((item) => ({
          ...item,
          thumbnail: thumbs[item.id] ?? item.thumbnail,
        })),
      });
    }
    return result;
  }, [rows, thumbnails]);

  const navRowItems = NAV_ROW;
  const tileRowSizes = contentRows.map((r) => r.items.length);
  const ROWS = useMemo(
    () => [
      navRowItems,
      ...tileRowSizes.map((len) =>
        Array.from({ length: len }, (_, i) => ({ id: `t-${i}` })),
      ),
    ],
    [tileRowSizes],
  );

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

      if (expandedRef.current) {
        if (key === "ArrowLeft")
          setTrailerIndex((i) => (i - 1 + trailers.length) % trailers.length);
        else if (key === "ArrowRight")
          setTrailerIndex((i) => (i + 1) % trailers.length);
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
  }, [ROWS, trailers.length]);

  const inContent = row >= 1;
  const contentRowIndex = row - 1;
  const selectedRow = contentRows[contentRowIndex];
  const selectedItem = selectedRow?.items[col] ?? null;

  return (
    <div className="home-page">
      <div className="viewport">
        {!loading.trailers && (
          <HeroTrailer
            expanded={expanded}
            trailers={trailers}
            activeIndex={trailerIndex}
            onAdvance={advanceTrailer}
          />
        )}

        <motion.div
          className="below-hero"
          animate={{ y: expanded ? `${100 - NAV_TOP - NAV_H}%` : "0%" }}
          transition={transition}
        >
          <motion.div
            className={`below-hero__spacer${expanded ? " below-hero__spacer--expanded" : ""}`}
            animate={{ height: inContent ? "0%" : `${NAV_TOP}%` }}
            transition={transition}
          >
            <div className="carousel-controls">
              <button
                className={`carousel-controls__learn-more${expanded ? " carousel-controls__learn-more--active" : ""}`}
              >
                Learn More
              </button>
              <div className="carousel-controls__dots">
                {[0, 1, 2].map((dot) => {
                  const last = Math.max(0, trailers.length - 1);
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
          </motion.div>

          <NavBar
            focusedIndex={row === 0 ? col : null}
            showBreadcrumb={row >= 2}
            translucent={expanded}
          />

          <div className="content-rows">
            <AnimatePresence initial={false}>
              {inContent && (
                <motion.div
                  key="detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "33vh", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition}
                >
                  <DetailPanel item={selectedItem} visible={inContent} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="tile-scroll"
              animate={{
                y:
                  row >= 2 ? `calc(-100% / ${contentRows.length} - 1vw)` : "0%",
              }}
              transition={transition}
            >
              {contentRows.map((cr, i) => (
                <TileRow
                  key={cr.id}
                  items={cr.items}
                  focusedIndex={row === i + 1 ? col : null}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
