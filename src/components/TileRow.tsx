import { useMemo } from "react";
import type { ContentItem } from "../lib/types";
import { TileItem } from "./TileItem";
import "./TileRow.css";

const VISIBLE_COMPACT = 5;
const FOCUS_SCALE = 1.22;
const ROW_SCALE = 1.04;

interface Props {
  items: ContentItem[];
  focusedIndex: number | null;
  expanded?: boolean;
  onItemClick?: (index: number) => void;
}

export function TileRow({
  items,
  focusedIndex,
  expanded = false,
  onItemClick,
}: Props) {
  const hasFocus = focusedIndex !== null;

  const scrollOffset = useMemo(() => {
    if (focusedIndex === null || focusedIndex === 0) return 0;
    if (!expanded && focusedIndex < VISIBLE_COMPACT) return 0;
    return focusedIndex;
  }, [expanded, focusedIndex]);

  const baseWidth = `calc((100% - var(--tile-gap) * ${VISIBLE_COMPACT - 1}) / ${VISIBLE_COMPACT})`;

  return (
    <div
      className={`tile-row${expanded ? " tile-row--expanded" : ""}${hasFocus ? " tile-row--has-focus" : ""}`}
    >
      <div
        className="tile-row__track"
        style={{
          transform:
            scrollOffset > 0
              ? `translateX(calc(${-scrollOffset} * (${baseWidth} + var(--tile-gap))))`
              : undefined,
        }}
      >
        {items.map((item, i) => {
          const isOverflow = i >= VISIBLE_COMPACT;
          const isFocused = focusedIndex === i;
          let opacity = 1;

          if (isOverflow && !expanded) {
            opacity = 0;
          } else if (
            expanded &&
            focusedIndex !== null &&
            items.length > VISIBLE_COMPACT
          ) {
            const dist = Math.abs(i - focusedIndex);
            if (dist > VISIBLE_COMPACT + 1) opacity = 0;
            else if (dist > VISIBLE_COMPACT) opacity = 0.3;
          }

          // All tiles in a focused row are slightly bigger
          const scale = hasFocus
            ? isFocused
              ? FOCUS_SCALE * ROW_SCALE
              : ROW_SCALE
            : 1;

          // Add margin-right to compensate for visual growth from scale
          // (transform: scale doesn't affect layout)
          const growthFactor = scale - 1;
          const marginRight =
            growthFactor > 0
              ? `calc(${baseWidth} * ${growthFactor})`
              : undefined;

          return (
            <TileItem
              key={item.id}
              label={item.title}
              img={item.thumbnail}
              gradient={item.gradient}
              focused={isFocused}
              onClick={onItemClick ? () => onItemClick(i) : undefined}
              style={{
                opacity,
                flexBasis: baseWidth,
                transform: `scale(${scale})`,
                transformOrigin: "left center",
                marginRight,
                transition:
                  "opacity 0.4s ease, transform 0.3s ease, margin-right 0.3s ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
