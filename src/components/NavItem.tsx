import "./NavItem.css";

interface Props {
  label: string;
  img: string;
  focused?: boolean;
}

export function NavItem({ label, img, focused = false }: Props) {
  return (
    <div className={`nav-item${focused ? " focused" : ""}`}>
      <img src={img} alt={label} draggable={false} />
      {focused && <span className="nav-item__label">{label}</span>}
    </div>
  );
}
