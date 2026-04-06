/*
 * Layout constants from the UI automation XML dump.
 * All values as percentages of 1920×1080 source resolution.
 */

const W = 1920;
const H = 1080;

const px = (x: number) => (x / W) * 100;
const py = (y: number) => (y / H) * 100;
const pw = (w: number) => (w / W) * 100;
const ph = (h: number) => (h / H) * 100;

const F = "/fragments/";

export const HERO_H = py(524);
export const HERO_CTA = {
  left: px(104),
  top: py(356),
  width: pw(218),
  height: ph(96),
};

export const NAV_TOP = py(524);
export const NAV_H = ph(96);

export interface LayoutItem {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  img: string;
}

function item(
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  img: string,
): LayoutItem {
  return {
    label,
    left: px(x),
    top: py(y),
    width: pw(w),
    height: ph(h),
    img: F + img,
  };
}

export const NAV_ITEMS: LayoutItem[] = [
  item("My Stuff", 92, 540, 96, 80, "My_Stuff.svg"),
  item("Games", 188, 540, 96, 80, "Games.svg"),
  item("Find", 284, 540, 96, 80, "Find.svg"),
  item("Free", 380, 540, 96, 80, "Free.svg"),
  item("Home", 476, 540, 96, 80, "Home.svg"),
  item("Live", 572, 540, 96, 80, "Live.svg"),
];

export const APP_SHORTCUTS: LayoutItem[] = [
  item("Netflix", 740, 540, 144, 80, "Netflix.png"),
  item("Prime Video", 892, 540, 144, 80, "Prime_Video.png"),
  item("YouTube", 1044, 540, 144, 80, "YouTube.png"),
  item("Disney+", 1196, 540, 144, 80, "Disney.png"),
  item("News", 1348, 540, 144, 80, "News.png"),
  item("Amazon Kids", 1500, 540, 144, 80, "Amazon_Kids_for_Fire_TV.png"),
];

export const NAV_OVERFLOW = item(
  "More Apps",
  1652,
  540,
  80,
  80,
  "More_Apps_press_select_to_view_all_of_your_apps_and_channels.png",
);
export const NAV_SETTINGS = item(
  "Settings",
  1740,
  540,
  80,
  80,
  "Settings_for_Neal.png",
);

export const ALL_NAV: LayoutItem[] = [
  ...NAV_ITEMS,
  ...APP_SHORTCUTS,
  NAV_OVERFLOW,
  NAV_SETTINGS,
];
