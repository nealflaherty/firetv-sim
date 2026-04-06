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
  showBreadcrumb?: boolean;
  breadcrumbLabel?: string;
  translucent?: boolean;
}

const NAV_ITEMS_OFFSET = 0;
const APP_SHORTCUTS_OFFSET = NAV_ITEMS.length;
const OVERFLOW_INDEX = APP_SHORTCUTS_OFFSET + APP_SHORTCUTS.length;
const SETTINGS_INDEX = OVERFLOW_INDEX + 1;

export function NavBar({
  focusedIndex,
  showBreadcrumb = false,
  breadcrumbLabel = "",
  translucent = false,
}: Props) {
  return (
    <div className={`nav-bar${translucent ? " nav-bar--translucent" : ""}`}>
      <div
        className={`nav-bar__items${showBreadcrumb ? " nav-bar__items--hidden" : ""}`}
      >
        <div className="nav-bar__group nav-bar__group--menu">
          {NAV_ITEMS.map((item, i) => (
            <NavItem
              key={item.label}
              label={item.label}
              img={item.img}
              focused={focusedIndex === NAV_ITEMS_OFFSET + i}
            />
          ))}
        </div>

        <div className="nav-bar__separator" />

        <div className="nav-bar__group nav-bar__group--apps">
          {APP_SHORTCUTS.map((item, i) => (
            <NavItem
              key={item.label}
              label={item.label}
              img={item.img}
              focused={focusedIndex === APP_SHORTCUTS_OFFSET + i}
              variant="app"
            />
          ))}
        </div>

        <div className="nav-bar__group nav-bar__group--utils">
          <NavItem
            label={NAV_OVERFLOW.label}
            img={NAV_OVERFLOW.img}
            focused={focusedIndex === OVERFLOW_INDEX}
            variant="app"
          />
          <NavItem
            label={NAV_SETTINGS.label}
            img={NAV_SETTINGS.img}
            focused={focusedIndex === SETTINGS_INDEX}
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
