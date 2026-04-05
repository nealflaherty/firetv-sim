import type { Row } from "../layout";
import { TileItem } from "./TileItem";
import "./TileRow.css";

interface Props {
  row: Row;
  focusedIndex: number | null;
  scrolledOut?: boolean;
}

export function TileRow({ row, focusedIndex, scrolledOut = false }: Props) {
  return (
    <div className={`tile-row${scrolledOut ? " tile-row--scrolled-out" : ""}`}>
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
