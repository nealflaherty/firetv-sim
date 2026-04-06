import "./TileItem.css";

interface Props {
  label: string;
  img?: string;
  gradient?: string;
  focused?: boolean;
}

export function TileItem({ label, img, gradient, focused = false }: Props) {
  return (
    <div className={`tile${focused ? " focused" : ""}`}>
      {img ? (
        <img src={img} alt={label} draggable={false} />
      ) : gradient ? (
        <div className="tile__gradient" style={{ background: gradient }}>
          <span className="tile__gradient-label">{label}</span>
        </div>
      ) : (
        <div className="tile__placeholder">{label}</div>
      )}
    </div>
  );
}
