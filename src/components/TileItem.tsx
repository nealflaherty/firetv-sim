import "./TileItem.css";

interface Props {
  label: string;
  img: string;
  focused?: boolean;
}

export function TileItem({ label, img, focused = false }: Props) {
  return (
    <div className={`tile${focused ? " focused" : ""}`}>
      <img src={img} alt={label} draggable={false} />
    </div>
  );
}
