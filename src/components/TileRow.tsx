import type { ContentItem } from "../lib/types";
import { TileItem } from "./TileItem";
import "./TileRow.css";

interface Props {
  items: ContentItem[];
  focusedIndex: number | null;
}

export function TileRow({ items, focusedIndex }: Props) {
  return (
    <div className="tile-row">
      {items.map((item, i) => (
        <TileItem
          key={item.id}
          label={item.title}
          img={item.thumbnail}
          focused={focusedIndex === i}
        />
      ))}
    </div>
  );
}
