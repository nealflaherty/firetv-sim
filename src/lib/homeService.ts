import type { RowSkeleton, ContentRow, Trailer } from "./types";

const F = "/fragments/";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Stage 0: Fetch trailers */
export async function fetchTrailers(): Promise<Trailer[]> {
  await delay(300);
  return [
    {
      id: "t1",
      title: "IQBAR",
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
    { id: "row-3", title: "Trending News" },
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
          title: "The Stinky & Dirty Show",
          description:
            "Season 1, Episode 7 — Lost! When Stinky and Dirty get lost in a thick fog, they have to find their way home.",
          rating: "7.4",
          ratingCount: 425,
          runtime: 24,
          year: "2016",
          maturity: "TVG",
          features: ["CC"],
          entitlement: "Resume Watching with Prime Video",
        },
        {
          id: "c2",
          title: "Blaze and the Monster Machines",
          description: "Blaze and his driver AJ have adventures in Axle City.",
        },
        {
          id: "c3",
          title: "Bubble Guppies",
          description:
            "Preschoolers learn about the world around them in an underwater classroom.",
        },
        {
          id: "c4",
          title: "If You Give a Mouse a Cookie",
          description: "A boy and his mouse friend go on adventures.",
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
          title: "Jury Duty",
          description:
            "Set in a courtroom, an unsuspecting juror is the focus of a hidden camera show.",
          rating: "8.2",
          ratingCount: 54429,
          runtime: 30,
          year: "2023",
          maturity: "TVMA",
          features: ["CC", "UHD"],
          entitlement: "Watch Now with Prime Video",
        },
        {
          id: "c7",
          title: "Here Comes Peter Cottontail",
          description:
            "Peter Cottontail must deliver more eggs than the evil Irontail.",
        },
        {
          id: "c8",
          title: "Car City: Dino Drives!",
          description: "Cars and dinosaurs team up for adventures in Car City.",
        },
        {
          id: "c9",
          title: "Jesus Christ Superstar",
          description:
            "The rock opera depicting the last seven days of Jesus Christ.",
        },
        {
          id: "c10",
          title: "Fallout",
          description:
            "Survivors navigate a post-apocalyptic wasteland in this adaptation of the video game.",
        },
      ],
    },
    "row-3": {
      id: "row-3",
      title: "Trending News",
      items: [
        {
          id: "c11",
          title: "Fear Factor: House of Fear",
          description:
            "Dropped into an unforgiving, remote location, a group of strangers live together.",
          rating: "6.2",
          ratingCount: 657,
          year: "2026",
          maturity: "TV14",
          features: ["CC"],
          entitlement: "Free with Ads | Play now on Tubi",
        },
        {
          id: "c12",
          title: "Super Wings",
          description:
            "Jett the jet plane delivers packages to kids around the world.",
        },
        {
          id: "c13",
          title: "Leo the Wildlife Ranger",
          description: "Leo and his animal friends protect wildlife habitats.",
        },
        {
          id: "c14",
          title: "Dragon Tales",
          description:
            "Two siblings find a magical dragon scale that transports them to Dragon Land.",
        },
        {
          id: "c15",
          title: "Peter Rabbit",
          description:
            "The mischievous rabbit and his friends go on adventures in the garden.",
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
      c1: F + "The_Stinky_Dirty_Show.png",
      c2: F + "Blaze_and_the_Monster_Machines.png",
      c3: F + "Bubble_Guppies.png",
      c4: F + "If_You_Give_a_Mouse_a_Cookie.png",
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
    "row-3": {
      c11: F + "Dream_Scenario.png",
      c12: F + "Blaze_and_the_Monster_Machines.png",
      c13: F + "PAW_Patrol.png",
      c14: F + "Mickey_Mouse_Clubhouse.png",
      c15: F + "The_Stinky_Dirty_Show.png",
    },
  };

  return thumbnails[rowId] ?? {};
}
