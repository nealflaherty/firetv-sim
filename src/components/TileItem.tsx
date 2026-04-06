import "./TileItem.css";

interface Props {
  label: string;
  img?: string;
  focused?: boolean;
}

export function TileItem({ label, img, focused = false }: Props) {
  return (
    <div className={`tile${focused ? " focused" : ""}`}>
      {img ? (
        <img src={img} alt={label} draggable={false} />
      ) : (
        <div className="tile__placeholder">{label}</div>
      )}
    </div>
  );
}
