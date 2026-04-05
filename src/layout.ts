/*
 * Layout constants from the UI automation XML dump.
 * All values as percentages of 1920×1080 source resolution.
 * All positions are relative to the viewport (the 1920×1080 container).
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
export const HERO_DOTS = { left: px(104), top: py(472) };

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

export interface TileItem {
  label: string;
  img: string;
}
export interface Row {
  top: number;
  items: TileItem[];
}

const TILE_W = 336;
const TILE_H = 183;
const TILE_GAP = 8;
const ROW_X = 104;

export function tileStyle(row: Row, i: number) {
  return {
    left: `${px(ROW_X + i * (TILE_W + TILE_GAP))}%`,
    top: `${py(row.top)}%`,
    width: `${pw(TILE_W)}%`,
    height: `${ph(TILE_H)}%`,
  };
}

export const ROW_1: Row = {
  top: 682,
  items: [
    {
      label: "Blaze and the Monster Machines",
      img: F + "Blaze_and_the_Monster_Machines.png",
    },
    {
      label: "If You Give a Mouse a Cookie",
      img: F + "If_You_Give_a_Mouse_a_Cookie.png",
    },
    { label: "The Stinky & Dirty Show", img: F + "The_Stinky_Dirty_Show.png" },
    { label: "Mickey Mouse Clubhouse", img: F + "Mickey_Mouse_Clubhouse.png" },
    { label: "PAW Patrol", img: F + "PAW_Patrol.png" },
  ],
};

export const ROW_2: Row = {
  top: 879,
  items: [
    { label: "Dream Scenario", img: F + "Dream_Scenario.png" },
    {
      label: "Weekend Games",
      img:
        F + "Weekend_Games_-_Jeopardy_Song_Quiz_CoComelon_formerly_Volley.png",
    },
    { label: "Tubi", img: F + "Tubi_Watch_Free_Movies_TV_Shows.png" },
    { label: "Bring It On", img: F + "Bring_It_On.png" },
    { label: "Booty Burn Challenge", img: F + "Booty_Burn_Challenge.png" },
  ],
};
