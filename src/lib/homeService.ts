import type { RowSkeleton, ContentRow, Trailer } from "./types";

const F = "/fragments/";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Stage 0: Fetch trailers */
export async function fetchTrailers(): Promise<Trailer[]> {
  await delay(300);
  return [
    {
      id: "t1",
      title: "Nirvanna the Band the Show the Movie",
      videoSrc:
        "https://abexlcnaaaaaaaamletu7vv43fzhj.mid-pop-vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fVVMgJTABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/394d/7b22/7552/4d05-9f61-1e6826fd0b69/9297c5d3-d3f7-45a4-9918-77427ee09bc8_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235484.0",
    },
    {
      id: "t2",
      title: "Back to the Future",
      videoSrc:
        "https://abexlcnaaaaaaaamlyjrns6ymqkdm.vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fR0IgHzABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/91a0/e404/5db9/4796-a1fe-6901ea12d00f/a920aba9-ebf6-46c8-bc0d-3accf0055117_video_12.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235614.0",
    },
    {
      id: "t3",
      title: "Primer",
      videoSrc:
        "https://abexlcnaaaaaaaamlsbrxqnoa6uzl.vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fR0IgHzABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/ff77/6225/383e/4650-900c-96656dd7d85e/caf5918f-e089-4b42-ab9f-997c4ce36707_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235614.0",
    },
  ];
}

/** Stage 1: Fetch row skeletons (themes/categories) */
export async function fetchRowSkeletons(): Promise<RowSkeleton[]> {
  await delay(200);
  return [
    { id: "row-1", title: "Next up for you" },
    { id: "row-2", title: "Recommended free movies and TV shows" },
  ];
}

/** Stage 2: Fetch content for a row (metadata, no thumbnails) */
export async function fetchRowContent(rowId: string): Promise<ContentRow> {
  await delay(400);

  const rows: Record<string, ContentRow> = {
    "row-1": {
      id: "row-1",
      title: "Next up for you",
      items: [
        {
          id: "c1",
          title: "Blaze and the Monster Machines",
          description: "Blaze and his driver AJ have adventures in Axle City.",
        },
        {
          id: "c2",
          title: "If You Give a Mouse a Cookie",
          description: "A boy and his mouse friend go on adventures.",
        },
        {
          id: "c3",
          title: "The Stinky & Dirty Show",
          description: "A garbage truck and backhoe loader go on adventures.",
        },
        {
          id: "c4",
          title: "Mickey Mouse Clubhouse",
          description: "Mickey and friends solve problems using basic skills.",
        },
        {
          id: "c5",
          title: "PAW Patrol",
          description: "A team of rescue pups and a tech-savvy boy.",
        },
      ],
    },
    "row-2": {
      id: "row-2",
      title: "Recommended free movies and TV shows",
      items: [
        {
          id: "c6",
          title: "Dream Scenario",
          description:
            "An ordinary family man finds his life turned upside down when millions of strangers suddenly start seeing him in their dreams.",
          rating: "6.8",
          ratingCount: 93018,
          runtime: 101,
          year: "2023",
          maturity: "R",
          features: ["X-Ray", "CC", "UHD"],
          entitlement: "Free with Ads | Play now on Tubi",
        },
        {
          id: "c7",
          title: "Weekend Games",
          description: "Play Jeopardy!, Song Quiz, and more.",
        },
        {
          id: "c8",
          title: "Tubi",
          description: "Watch free movies and TV shows.",
        },
        {
          id: "c9",
          title: "Bring It On",
          description:
            "A champion cheerleading squad discovers their routines were stolen.",
        },
        {
          id: "c10",
          title: "Booty Burn Challenge",
          description: "A fitness challenge to get in shape.",
        },
      ],
    },
  };

  return rows[rowId] ?? { id: rowId, title: "", items: [] };
}

/** Stage 3: Fetch thumbnails for a row */
export async function fetchRowThumbnails(
  rowId: string,
): Promise<Record<string, string>> {
  await delay(600);

  const thumbnails: Record<string, Record<string, string>> = {
    "row-1": {
      c1: F + "Blaze_and_the_Monster_Machines.png",
      c2: F + "If_You_Give_a_Mouse_a_Cookie.png",
      c3: F + "The_Stinky_Dirty_Show.png",
      c4: F + "Mickey_Mouse_Clubhouse.png",
      c5: F + "PAW_Patrol.png",
    },
    "row-2": {
      c6: F + "Dream_Scenario.png",
      c7:
        F + "Weekend_Games_-_Jeopardy_Song_Quiz_CoComelon_formerly_Volley.png",
      c8: F + "Tubi_Watch_Free_Movies_TV_Shows.png",
      c9: F + "Bring_It_On.png",
      c10: F + "Booty_Burn_Challenge.png",
    },
  };

  return thumbnails[rowId] ?? {};
}
