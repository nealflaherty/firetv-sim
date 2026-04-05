import "./Breadcrumb.css";

interface Props {
  visible: boolean;
}

export function Breadcrumb({ visible }: Props) {
  if (!visible) return null;
  return (
    <div className="breadcrumb">
      <img src="/fragments/Home_breadcrumb.png" alt="Home" draggable={false} />
    </div>
  );
}
