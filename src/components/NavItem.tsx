import { motion, AnimatePresence } from "framer-motion";
import "./NavItem.css";

interface Props {
  label: string;
  img: string;
  focused?: boolean;
  variant?: "icon" | "app";
}

const glowTransition = { duration: 0.08, ease: [0.4, 0, 0.2, 1] as const };

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
      {focused && (
        <motion.div
          className="nav-item__glow"
          layoutId="nav-glow"
          transition={{ layout: glowTransition }}
        />
      )}
      {focused && variant === "icon" && (
        <motion.div
          className="nav-item__circle"
          layoutId="nav-circle"
          transition={{ layout: glowTransition }}
        />
      )}
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
