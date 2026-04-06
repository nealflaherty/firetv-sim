import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_TOP, ALL_NAV } from "../layout";
import { useHomeData } from "../lib/useHomeData";
import { generateContentForCategory } from "../lib/placeholderContent";
import { HeroTrailer } from "../components/HeroTrailer";
import { NavBar } from "../components/NavBar";
import { DetailPanel } from "../components/DetailPanel";
import { TileRow } from "../components/TileRow";
import { FullscreenToggle } from "../components/FullscreenToggle";
import "./HomePage.css";

const HOME_NAV_INDEX = 4;
const NAV_ROW = ALL_NAV.map((_item, i) => ({ id: `nav-${i}` }));
const INITIAL: [number, number] = [0, HOME_NAV_INDEX];

const transition = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };

export function HomePage() {
  const { trailers, rows, thumbnails, loading } = useHomeData();

  const [pos, setPos] = useState(INITIAL);
  const [expanded, setExpanded] = useState(true);
  const expandedRef = useRef(true);
  const [trailerIndex, setTrailerIndex] = useState(0);
  // Remember which nav item is selected when navigating into content
  const [selectedNavIndex, setSelectedNavIndex] = useState(HOME_NAV_INDEX);

  const advanceTrailer = useCallback(() => {
    setTrailerIndex((i) => (i + 1) % Math.max(1, trailers.length));
  }, [trailers.length]);

  // Build Home content rows with thumbnails merged in
  const homeContentRows = useMemo(() => {
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

  // Get content rows for the active nav item — computed after pos destructuring
  const contentRows = useMemo(() => {
    const navIdx = pos[0] === 0 ? pos[1] : selectedNavIndex;
    if (navIdx === HOME_NAV_INDEX) return homeContentRows;
    const label = ALL_NAV[navIdx]?.label ?? "Unknown";
    return generateContentForCategory(label);
  }, [pos, selectedNavIndex, homeContentRows]);

  const activeNavIndex = pos[0] === 0 ? pos[1] : selectedNavIndex;

  // Navigation grid: nav row + content rows
  const ROWS = useMemo(
    () => [
      NAV_ROW,
      ...contentRows.map((r) =>
        Array.from({ length: r.items.length }, (_, i) => ({ id: `t-${i}` })),
      ),
    ],
    [contentRows],
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
          // Going back to nav — restore the remembered nav index
          if (r === 1) return [0, selectedNavIndex];
          return [r - 1, 0];
        });
        return;
      }

      if (key === "ArrowDown") {
        if (expandedRef.current) {
          expandedRef.current = false;
          setExpanded(false);
          return;
        }
        setPos(([r, c]) => {
          if (r === 0) {
            // Remember which nav item we're leaving from
            setSelectedNavIndex(c);
            return [1, 0];
          }
          return r < ROWS.length - 1 ? [r + 1, 0] : [r, c];
        });
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
        if (key === "ArrowLeft") {
          return [r, Math.max(0, c - 1)];
        }
        if (key === "ArrowRight") {
          return [r, Math.min(ROWS[r].length - 1, c + 1)];
        }
        return [r, c];
      });
    };

    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, [ROWS, trailers.length, selectedNavIndex]);

  const inContent = row >= 1;
  const contentRowIndex = row - 1;
  const selectedRow = contentRows[contentRowIndex];
  const selectedItem = selectedRow?.items[col] ?? null;

  return (
    <div className="home-page">
      <FullscreenToggle />
      <div className="viewport">
        {!loading.trailers && (
          <HeroTrailer
            expanded={expanded}
            trailers={trailers}
            activeIndex={trailerIndex}
            onAdvance={advanceTrailer}
            transition={transition}
          />
        )}

        <motion.div
          className={`below-hero${expanded ? " below-hero--expanded" : ""}`}
          transition={transition}
        >
          <motion.div
            className={`below-hero__spacer${expanded ? " below-hero__spacer--expanded" : ""}`}
            animate={{
              height: inContent
                ? "0%"
                : expanded
                  ? "calc(100% - 7vw)"
                  : `${NAV_TOP}%`,
            }}
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
            focusedIndex={expanded ? null : row === 0 ? col : selectedNavIndex}
            showBreadcrumb={row >= 2}
            breadcrumbLabel={ALL_NAV[selectedNavIndex]?.label ?? ""}
            translucent={expanded}
          />

          <motion.div
            className="content-rows"
            animate={{
              opacity: expanded ? 0 : 1,
              height: expanded ? 0 : "auto",
            }}
            transition={transition}
            style={{ overflow: "hidden" }}
          >
            <AnimatePresence initial={false}>
              {inContent && (
                <motion.div
                  key="detail"
                  className="detail-motion-wrapper"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "33vh", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition}
                >
                  <DetailPanel item={selectedItem} visible={inContent} />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ position: "relative" }}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeNavIndex}
                  className="tile-scroll"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    y:
                      row >= 2
                        ? `calc(-100% / ${contentRows.length} - 1vw)`
                        : "0%",
                  }}
                  exit={{ opacity: 0, position: "absolute" as const, inset: 0 }}
                  transition={{
                    opacity: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
                    y: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                  }}
                >
                  {contentRows.map((cr, i) => {
                    const isFocusedRow = row === i + 1;
                    return (
                      <motion.div
                        key={cr.id}
                        animate={{ opacity: row >= 2 && i < row - 1 ? 0 : 1 }}
                        transition={transition}
                        style={{
                          position: "relative",
                          zIndex: isFocusedRow ? 10 : 1,
                        }}
                      >
                        <TileRow
                          items={cr.items}
                          focusedIndex={isFocusedRow ? col : null}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
