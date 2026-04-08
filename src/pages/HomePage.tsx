import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_NAV } from "../layout";
import { useHomeData } from "../lib/useHomeData";
import { useAmazonData } from "../lib/useAmazonData";
import { useNavigation, HOME_NAV_INDEX } from "../lib/useNavigation";
import { generateContentForCategory } from "../lib/placeholderContent";
import { useMyStuffData } from "../lib/useMyStuffData";
import { useLunaData } from "../lib/useLunaData";
import { useForYouData } from "../lib/useForYouData";
import type { ContentItem } from "../lib/types";
import { HeroTrailer } from "../components/HeroTrailer";
import { NavBar } from "../components/NavBar";
import { DetailPanel, DetailBackground } from "../components/DetailPanel";
import { RowScroller } from "../components/RowScroller";
import { FullscreenToggle } from "../components/FullscreenToggle";
import { ControlsOverlay } from "../components/ControlsOverlay";
import { VideoPlayer } from "../components/VideoPlayer";
import "./HomePage.css";

const NAV_ROW_LENGTH = ALL_NAV.length;

const transition = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };

const PANEL_Y = {
  expanded: "calc(100vh - 7vw)",
  compact: "50vh",
  content: "0vh",
};

export function HomePage() {
  const { trailers, rows, thumbnails, loading } = useHomeData();
  const { rows: amazonRows, resolveTrailer } = useAmazonData();
  const { rows: myStuffRows } = useMyStuffData();
  const { rows: lunaRows } = useLunaData();
  const { rows: forYouRows } = useForYouData();

  // Build content rows based on selected nav
  const homeContentRows = useMemo(() => {
    const result: { id: string; title?: string; items: ContentItem[] }[] = [];
    for (const [id, row] of rows) {
      const thumbs = thumbnails.get(id) ?? {};
      result.push({
        id,
        title: row.title,
        items: row.items.map((item) => ({
          ...item,
          thumbnail: thumbs[item.id] ?? item.thumbnail,
        })),
      });
    }
    return result;
  }, [rows, thumbnails]);

  // Resolve content rows for the active nav category
  const contentRowsForNav = useMemo(
    () => (navIdx: number) => {
      if (navIdx === HOME_NAV_INDEX) {
        return forYouRows.length > 0 ? forYouRows : homeContentRows;
      }
      const label = ALL_NAV[navIdx]?.label ?? "Unknown";
      if (label === "Prime Video" && amazonRows.length > 0) return amazonRows;
      if (label === "My Stuff" && myStuffRows.length > 0) return myStuffRows;
      if (label === "Games" && lunaRows.length > 0) return lunaRows;
      return generateContentForCategory(label);
    },
    [homeContentRows, amazonRows, myStuffRows, lunaRows, forYouRows],
  );

  // Row lengths for navigation bounds
  const maxRowLengths = useMemo(() => {
    // Use a generous upper bound — actual bounds checked in navigation
    const maxRows = 30;
    return [NAV_ROW_LENGTH, ...Array(maxRows).fill(100)];
  }, []);

  // --- Video player state ---
  const [playingTitleId, setPlayingTitleId] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const contentRowsRef = useRef<
    { id: string; title?: string; items: ContentItem[] }[]
  >([]);

  const handlePlay = useCallback((rowIdx: number, colIdx: number) => {
    const item = contentRowsRef.current[rowIdx]?.items[colIdx];
    if (item?.id) {
      setPlayingTitleId(item.id);
      setPlayingUrl(item.linkUrl ?? null);
    }
  }, []);

  const nav = useNavigation(maxRowLengths, trailers.length, handlePlay);

  // Now compute the actual content rows based on nav state
  const activeContentRows = useMemo(() => {
    const navIdx = nav.row === 0 ? nav.col : nav.selectedNavIndex;
    return contentRowsForNav(navIdx);
  }, [nav.row, nav.col, nav.selectedNavIndex, contentRowsForNav]);

  // Keep ref in sync for the play callback
  useEffect(() => {
    contentRowsRef.current = activeContentRows;
  }, [activeContentRows]);

  const selectedRow = activeContentRows[nav.row - 1];
  const selectedItem = selectedRow?.items[nav.col] ?? null;

  // Resolve trailer video when an item is focused
  useEffect(() => {
    if (selectedItem?.id && !selectedItem.videoSrc && resolveTrailer) {
      resolveTrailer(selectedItem.id);
    }
  }, [selectedItem?.id, selectedItem?.videoSrc, resolveTrailer]);

  const panelY = nav.expanded
    ? PANEL_Y.expanded
    : nav.inContent
      ? PANEL_Y.content
      : PANEL_Y.compact;

  return (
    <div className="home-page">
      <ControlsOverlay />
      <FullscreenToggle />
      <VideoPlayer
        titleId={playingTitleId}
        url={playingUrl}
        onClose={() => {
          setPlayingTitleId(null);
          setPlayingUrl(null);
        }}
      />
      <div className="viewport">
        {!loading.trailers && (
          <HeroTrailer
            expanded={nav.expanded}
            trailers={trailers}
            activeIndex={nav.trailerIndex}
            onAdvance={nav.advanceTrailer}
            transition={transition}
          />
        )}

        <div
          className="panel"
          style={{
            transform: `translateY(${panelY})`,
            backgroundColor: nav.expanded ? "transparent" : "var(--color-bg)",
            transition:
              "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="panel__controls">
            <div className="carousel-controls">
              <button
                className={`carousel-controls__learn-more${nav.expanded ? " carousel-controls__learn-more--active" : ""}`}
              >
                Learn More
              </button>
              <div className="carousel-controls__dots">
                {[0, 1, 2].map((dot) => {
                  const last = Math.max(0, trailers.length - 1);
                  const activeDot =
                    nav.trailerIndex === 0
                      ? 0
                      : nav.trailerIndex >= last
                        ? 2
                        : 1;
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

          <DetailBackground
            item={nav.inContent && !playingTitleId ? selectedItem : null}
            visible={nav.inContent && !playingTitleId}
          />

          <NavBar
            focusedIndex={nav.row === 0 ? nav.col : null}
            selectedIndex={nav.selectedNavIndex}
            showBreadcrumb={nav.row >= 2}
            breadcrumbLabel={ALL_NAV[nav.selectedNavIndex]?.label ?? ""}
            mode={
              nav.expanded ? "expanded" : nav.inContent ? "content" : "compact"
            }
            onItemClick={nav.clickNav}
          />

          <div className="panel__content">
            <AnimatePresence initial={false}>
              {nav.inContent && (
                <motion.div
                  key="detail"
                  className="detail-motion-wrapper"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "33vh", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition}
                >
                  <DetailPanel item={selectedItem} visible={nav.inContent} />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ position: "relative" }}>
              <AnimatePresence initial={false}>
                <RowScroller
                  key={nav.activeNavIndex}
                  contentRows={activeContentRows}
                  focusedRow={nav.row >= 1 ? nav.row - 1 : -1}
                  focusedCol={nav.col}
                  inContent={nav.inContent}
                  scrollToRow={nav.row >= 2 ? nav.row - 1 : -1}
                  onItemClick={nav.clickTile}
                />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
