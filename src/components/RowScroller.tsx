import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ContentItem } from "../lib/types";
import { TileRow } from "./TileRow";

export interface ContentRowData {
  id: string;
  title?: string;
  items: ContentItem[];
}

interface Props {
  contentRows: ContentRowData[];
  focusedRow: number;
  focusedCol: number;
  inContent: boolean;
  scrollToRow: number;
  onItemClick?: (rowIndex: number, colIndex: number) => void;
}

export function RowScroller({
  contentRows,
  focusedRow,
  focusedCol,
  inContent,
  scrollToRow,
  onItemClick,
}: Props) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (scrollToRow < 0) {
      setScrollY(0);
      return;
    }
    const el = rowRefs.current[scrollToRow];
    if (el) {
      setScrollY(-el.offsetTop);
    }
  }, [scrollToRow]);

  return (
    <motion.div
      className="tile-scroll"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: scrollY }}
      exit={{ opacity: 0, position: "absolute" as const, inset: 0 }}
      transition={{
        opacity: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
        y: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      {contentRows.map((cr, i) => {
        const isFocusedRow = focusedRow === i;
        return (
          <div
            key={cr.id}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            style={{
              position: "relative",
              zIndex: isFocusedRow ? 10 : 1,
              opacity: scrollToRow >= 0 && i < scrollToRow ? 0 : 1,
              transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {cr.title && (
              <div
                className={`tile-section-title${isFocusedRow ? " tile-section-title--focused" : ""}`}
              >
                {cr.title}
              </div>
            )}
            <TileRow
              items={cr.items}
              focusedIndex={isFocusedRow ? focusedCol : null}
              expanded={inContent}
              onItemClick={
                onItemClick ? (col) => onItemClick(i, col) : undefined
              }
            />
          </div>
        );
      })}
    </motion.div>
  );
}
