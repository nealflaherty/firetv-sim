import {
  NAV_ITEMS,
  APP_SHORTCUTS,
  NAV_OVERFLOW,
  NAV_SETTINGS,
} from "../layout";
import { NavItem } from "./NavItem";
import "./NavBar.css";

interface Props {
  focusedIndex: number | null;
  selectedIndex?: number | null;
  showBreadcrumb?: boolean;
  breadcrumbLabel?: string;
  mode?: "expanded" | "compact" | "content";
}

const NAV_ITEMS_OFFSET = 0;
const APP_SHORTCUTS_OFFSET = NAV_ITEMS.length;
const OVERFLOW_INDEX = APP_SHORTCUTS_OFFSET + APP_SHORTCUTS.length;
const SETTINGS_INDEX = OVERFLOW_INDEX + 1;

export function NavBar({
  focusedIndex,
  selectedIndex = null,
  showBreadcrumb = false,
  breadcrumbLabel = "",
  mode = "content",
}: Props) {
  const isFocusMode = mode === "compact";

  return (
    <div className={`nav-bar nav-bar--${mode}`}>
      <div
        className={`nav-bar__items${showBreadcrumb ? " nav-bar__items--hidden" : ""}`}
      >
        <div className="nav-bar__group nav-bar__group--menu">
          {NAV_ITEMS.map((item, i) => {
            const idx = NAV_ITEMS_OFFSET + i;
            return (
              <NavItem
                key={item.label}
                label={item.label}
                img={item.img}
                focused={isFocusMode && focusedIndex === idx}
                selected={!isFocusMode && selectedIndex === idx}
              />
            );
          })}
        </div>

        <div className="nav-bar__separator" />

        <div className="nav-bar__group nav-bar__group--apps">
          {APP_SHORTCUTS.map((item, i) => {
            const idx = APP_SHORTCUTS_OFFSET + i;
            return (
              <NavItem
                key={item.label}
                label={item.label}
                img={item.img}
                focused={isFocusMode && focusedIndex === idx}
                selected={!isFocusMode && selectedIndex === idx}
                variant="app"
              />
            );
          })}
        </div>

        <div className="nav-bar__group nav-bar__group--utils">
          <NavItem
            label={NAV_OVERFLOW.label}
            img={NAV_OVERFLOW.img}
            focused={isFocusMode && focusedIndex === OVERFLOW_INDEX}
            selected={!isFocusMode && selectedIndex === OVERFLOW_INDEX}
            variant="app"
          />
          <NavItem
            label={NAV_SETTINGS.label}
            img={NAV_SETTINGS.img}
            focused={isFocusMode && focusedIndex === SETTINGS_INDEX}
            selected={!isFocusMode && selectedIndex === SETTINGS_INDEX}
            variant="app"
          />
        </div>
      </div>

      <div
        className={`nav-bar__breadcrumb${showBreadcrumb ? " nav-bar__breadcrumb--visible" : ""}`}
      >
        <span className="nav-bar__breadcrumb-text">{breadcrumbLabel}</span>
      </div>
    </div>
  );
}
