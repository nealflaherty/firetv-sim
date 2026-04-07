import "./TileItem.css";

interface Props {
  label: string;
  img?: string;
  gradient?: string;
  focused?: boolean;
  style?: React.CSSProperties;
}

export function TileItem({
  label,
  img,
  gradient,
  focused = false,
  style,
}: Props) {
  return (
    <div className={`tile${focused ? " focused" : ""}`} style={style}>
      <div className="tile__inner">
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
    </div>
  );
}
