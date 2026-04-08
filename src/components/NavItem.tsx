import { motion, AnimatePresence } from "framer-motion";
import "./NavItem.css";

interface Props {
  label: string;
  img: string;
  focused?: boolean;
  selected?: boolean;
  variant?: "icon" | "app";
  onClick?: () => void;
}

export function NavItem({
  label,
  img,
  focused = false,
  selected = false,
  variant = "icon",
  onClick,
}: Props) {
  const showCircle = (focused || selected) && variant === "icon";

  return (
    <div
      className={`nav-item nav-item--${variant}${focused ? " nav-item--focused" : ""}${selected ? " nav-item--selected" : ""}`}
      onClick={onClick}
    >
      {focused && <div className="nav-item__glow" />}
      {showCircle && <div className="nav-item__circle" />}
      <img src={img} alt={label} draggable={false} />
      <AnimatePresence>
        {focused && (
          <motion.span
            className="nav-item__label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
