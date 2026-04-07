import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_NAV } from "../layout";
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

// Panel position: how far down from the top of the viewport
// expanded: almost off-screen, just nav bar visible at bottom
// compact: halfway, hero visible above
// content: flush with top, fills the screen
const PANEL_Y = {
  expanded: "calc(100vh - 7vw)",
  compact: "50vh",
  content: "0vh",
};

export function HomePage() {
  const { trailers, rows, thumbnails, loading } = useHomeData();

  const [pos, setPos] = useState(INITIAL);
  const [expanded, setExpanded] = useState(true);
  const expandedRef = useRef(true);
  const [trailerIndex, setTrailerIndex] = useState(0);
  const [selectedNavIndex, setSelectedNavIndex] = useState(HOME_NAV_INDEX);

  const advanceTrailer = useCallback(() => {
    setTrailerIndex((i) => (i + 1) % Math.max(1, trailers.length));
  }, [trailers.length]);

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

  const contentRows = useMemo(() => {
    const navIdx = pos[0] === 0 ? pos[1] : selectedNavIndex;
    if (navIdx === HOME_NAV_INDEX) return homeContentRows;
    const label = ALL_NAV[navIdx]?.label ?? "Unknown";
    return generateContentForCategory(label);
  }, [pos, selectedNavIndex, homeContentRows]);

  const activeNavIndex = pos[0] === 0 ? pos[1] : selectedNavIndex;

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

      // H key — go to Home (compact nav with Home selected)
      if (key === "h" || key === "H") {
        e.preventDefault();
        expandedRef.current = false;
        setExpanded(false);
        setPos([0, HOME_NAV_INDEX]);
        setSelectedNavIndex(HOME_NAV_INDEX);
        return;
      }

      // Enter — select current item
      if (key === "Enter") {
        e.preventDefault();
        if (expandedRef.current) {
          // From expanded, go to compact nav
          expandedRef.current = false;
          setExpanded(false);
          return;
        }
        // From nav bar, go into content
        if (pos[0] === 0) {
          setSelectedNavIndex(pos[1]);
          setPos([1, 0]);
        }
        return;
      }

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
          const next = Math.max(0, c - 1);
          if (r === 0 && next !== c) setSelectedNavIndex(next);
          return [r, next];
        }
        if (key === "ArrowRight") {
          const next = Math.min(ROWS[r].length - 1, c + 1);
          if (r === 0 && next !== c) setSelectedNavIndex(next);
          return [r, next];
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

  // Determine panel position
  const panelY = expanded
    ? PANEL_Y.expanded
    : inContent
      ? PANEL_Y.content
      : PANEL_Y.compact;

  return (
    <div className="home-page">
      <FullscreenToggle />
      <div className="viewport">
        {/* Hero trailer — always fills the viewport behind the panel */}
        {!loading.trailers && (
          <HeroTrailer
            expanded={expanded}
            trailers={trailers}
            activeIndex={trailerIndex}
            onAdvance={advanceTrailer}
            transition={transition}
          />
        )}

        {/* Sliding panel — nav bar + content */}
        <div
          className="panel"
          style={{
            transform: `translateY(${panelY})`,
            backgroundColor: expanded ? "transparent" : "var(--color-bg)",
            transition:
              "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Carousel controls — above the nav bar */}
          <div className="panel__controls">
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
          </div>

          {/* Nav bar */}
          <NavBar
            focusedIndex={row === 0 ? col : null}
            selectedIndex={selectedNavIndex}
            showBreadcrumb={row >= 2}
            breadcrumbLabel={ALL_NAV[selectedNavIndex]?.label ?? ""}
            mode={expanded ? "expanded" : inContent ? "content" : "compact"}
          />

          {/* Content area — detail panel + tile rows */}
          <div className="panel__content">
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
          </div>
        </div>
      </div>
    </div>
  );
}
