import "./NavItem.css";

interface Props {
  label: string;
  img: string;
  focused?: boolean;
  variant?: "icon" | "app";
}

export function NavItem({
  label,
  img,
  focused = false,
  variant = "icon",
}: Props) {
  return (
    <div
      className={`nav-item nav-item--${variant}${focused ? " nav-item--focused" : ""}`}
    >
      {focused && <div className="nav-item__glow" />}
      {focused && variant === "icon" && <div className="nav-item__circle" />}
      <img src={img} alt={label} draggable={false} />
      {focused && <span className="nav-item__label">{label}</span>}
    </div>
  );
}
