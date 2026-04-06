import type { Row } from "../layout";
import { TileItem } from "./TileItem";
import "./TileRow.css";

interface Props {
  row: Row;
  focusedIndex: number | null;
  scrolledOut?: boolean;
  shiftUp?: boolean;
}

export function TileRow({
  row,
  focusedIndex,
  scrolledOut = false,
  shiftUp = false,
}: Props) {
  let className = "tile-row";
  if (scrolledOut) className += " tile-row--scrolled-out";
  else if (shiftUp) className += " tile-row--shift-up";

  return (
    <div className={className}>
      {row.items.map((item, i) => (
        <TileItem
          key={item.label}
          label={item.label}
          img={item.img}
          focused={focusedIndex === i}
        />
      ))}
    </div>
  );
}
