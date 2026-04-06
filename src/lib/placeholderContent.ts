import type { ContentItem } from "./types";

const GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #fccb90, #d57eeb)",
  "linear-gradient(135deg, #e0c3fc, #8ec5fc)",
  "linear-gradient(135deg, #f5576c, #ff6a00)",
  "linear-gradient(135deg, #667eea, #43e97b)",
];

interface CategoryContent {
  rows: { title: string; items: { title: string; description: string }[] }[];
}

const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "My Stuff": {
    rows: [
      {
        title: "Continue Watching",
        items: [
          {
            title: "The Office",
            description:
              "Season 3, Episode 12 — Michael starts his own paper company.",
          },
          {
            title: "Breaking Bad",
            description: "Season 5, Episode 3 — Walt expands his empire.",
          },
          {
            title: "Stranger Things",
            description: "Season 4, Episode 7 — Eleven faces her past.",
          },
          {
            title: "The Mandalorian",
            description: "Season 2, Episode 5 — A familiar face returns.",
          },
          {
            title: "Fleabag",
            description: "Season 2, Episode 4 — The priest makes a confession.",
          },
        ],
      },
      {
        title: "Your Watchlist",
        items: [
          {
            title: "Oppenheimer",
            description: "The story of the atomic bomb and the man behind it.",
          },
          {
            title: "Dune: Part Two",
            description: "Paul Atreides unites with the Fremen.",
          },
          {
            title: "Poor Things",
            description:
              "A young woman is brought back to life by a scientist.",
          },
          {
            title: "Killers of the Flower Moon",
            description: "The Osage murders and the birth of the FBI.",
          },
          {
            title: "Past Lives",
            description:
              "Two childhood friends reconnect decades later in New York.",
          },
        ],
      },
    ],
  },
  Games: {
    rows: [
      {
        title: "Popular Games",
        items: [
          {
            title: "Trivia Royale",
            description: "Test your knowledge against players worldwide.",
          },
          {
            title: "Word Scramble",
            description:
              "Unscramble letters to form words before time runs out.",
          },
          {
            title: "Puzzle Quest",
            description: "Match gems and cast spells in this RPG puzzler.",
          },
          {
            title: "Space Invaders",
            description: "Classic arcade action on your Fire TV.",
          },
          {
            title: "Crossy Road",
            description: "Hop across roads, rivers, and train tracks.",
          },
        ],
      },
      {
        title: "New Releases",
        items: [
          {
            title: "Dungeon Dash",
            description: "Navigate procedurally generated dungeons.",
          },
          {
            title: "Rhythm Fire",
            description: "Tap along to the beat of popular songs.",
          },
          {
            title: "Chess Masters",
            description: "Play chess against AI or friends.",
          },
          {
            title: "Retro Racer",
            description: "Pixel-art racing through neon cities.",
          },
          {
            title: "Solitaire Deluxe",
            description: "The classic card game with modern visuals.",
          },
        ],
      },
    ],
  },
  Find: {
    rows: [
      {
        title: "Trending Now",
        items: [
          {
            title: "Shogun",
            description: "An English sailor navigates feudal Japan.",
          },
          {
            title: "The Bear",
            description: "A chef returns home to run the family restaurant.",
          },
          {
            title: "Fallout",
            description: "Survivors navigate a post-apocalyptic wasteland.",
          },
          {
            title: "Baby Reindeer",
            description: "A comedian deals with a stalker.",
          },
          {
            title: "Ripley",
            description:
              "A con artist assumes another man's identity in 1960s Italy.",
          },
        ],
      },
      {
        title: "Top Rated Movies",
        items: [
          {
            title: "The Shawshank Redemption",
            description: "Two imprisoned men bond over years.",
          },
          {
            title: "The Godfather",
            description: "The aging patriarch transfers control to his son.",
          },
          {
            title: "The Dark Knight",
            description: "Batman faces the Joker in Gotham City.",
          },
          {
            title: "Pulp Fiction",
            description: "Interconnected stories of crime in Los Angeles.",
          },
          {
            title: "Schindler's List",
            description: "A businessman saves over a thousand Jewish refugees.",
          },
        ],
      },
    ],
  },
  Free: {
    rows: [
      {
        title: "Free with Ads",
        items: [
          {
            title: "Tubi Originals",
            description: "Exclusive content streaming free on Tubi.",
          },
          {
            title: "Pluto TV Movies",
            description: "Hundreds of movies streaming free 24/7.",
          },
          {
            title: "Freevee Picks",
            description: "Ad-supported movies and shows from Freevee.",
          },
          {
            title: "IMDb TV Spotlight",
            description: "Curated free content from IMDb TV.",
          },
          {
            title: "Crackle Hits",
            description: "Popular movies and shows streaming free.",
          },
        ],
      },
      {
        title: "Free Live Channels",
        items: [
          {
            title: "News Now",
            description: "Live breaking news coverage 24/7.",
          },
          {
            title: "Sports Highlights",
            description: "Catch up on the latest sports action.",
          },
          {
            title: "Comedy Central",
            description: "Stand-up specials and comedy shows.",
          },
          {
            title: "Movie Classics",
            description: "Timeless films from Hollywood's golden age.",
          },
          {
            title: "Kids Zone",
            description: "Family-friendly cartoons and shows.",
          },
        ],
      },
    ],
  },
  Live: {
    rows: [
      {
        title: "Live Now",
        items: [
          {
            title: "CNN Live",
            description: "Breaking news and live coverage.",
          },
          {
            title: "ESPN SportsCenter",
            description: "Live sports updates and highlights.",
          },
          { title: "NBC Nightly News", description: "Evening news broadcast." },
          {
            title: "Fox Weather",
            description: "Live weather forecasts and storm tracking.",
          },
          {
            title: "Bloomberg TV",
            description: "Live financial news and market data.",
          },
        ],
      },
      {
        title: "Upcoming",
        items: [
          {
            title: "Thursday Night Football",
            description: "Live NFL action every Thursday.",
          },
          {
            title: "Premier League",
            description: "English football live matches.",
          },
          {
            title: "NBA Courtside",
            description: "Live basketball games and analysis.",
          },
          {
            title: "Concert Live",
            description: "Live music performances and festivals.",
          },
          {
            title: "Award Show",
            description: "Live coverage of major award ceremonies.",
          },
        ],
      },
    ],
  },
  Netflix: {
    rows: [
      {
        title: "Trending on Netflix",
        items: [
          {
            title: "Squid Game S2",
            description: "The deadly games return with new players.",
          },
          {
            title: "Wednesday",
            description: "Wednesday Addams investigates a murder spree.",
          },
          {
            title: "The Night Agent",
            description: "An FBI agent uncovers a conspiracy.",
          },
          {
            title: "Ginny & Georgia",
            description: "A mother-daughter duo start fresh in New England.",
          },
          {
            title: "You",
            description: "A charming bookstore manager with a dark side.",
          },
        ],
      },
      {
        title: "Netflix Originals",
        items: [
          {
            title: "Glass Onion",
            description: "Detective Blanc solves a murder on a private island.",
          },
          {
            title: "All Quiet on the Western Front",
            description: "A young German soldier faces WWI.",
          },
          {
            title: "The Adam Project",
            description:
              "A time-traveling pilot teams up with his younger self.",
          },
          {
            title: "Don't Look Up",
            description: "Two astronomers try to warn the world of a comet.",
          },
          {
            title: "The Power of the Dog",
            description: "A rancher torments his brother's new wife.",
          },
        ],
      },
    ],
  },
  "Prime Video": {
    rows: [
      {
        title: "Included with Prime",
        items: [
          {
            title: "The Boys",
            description: "Vigilantes take on corrupt superheroes.",
          },
          {
            title: "Reacher",
            description: "Jack Reacher investigates a murder in a small town.",
          },
          {
            title: "The Marvelous Mrs. Maisel",
            description: "A housewife pursues stand-up comedy.",
          },
          {
            title: "Citadel",
            description: "Two spies must rebuild a global spy agency.",
          },
          {
            title: "Upload",
            description:
              "A man's consciousness is uploaded to a virtual afterlife.",
          },
        ],
      },
      {
        title: "Rent or Buy",
        items: [
          {
            title: "Barbie",
            description: "Barbie and Ken leave Barbieland for the real world.",
          },
          {
            title: "John Wick 4",
            description: "John Wick takes on his most lethal adversaries.",
          },
          {
            title: "Guardians of the Galaxy Vol. 3",
            description: "The Guardians face their final mission.",
          },
          {
            title: "Spider-Man: Across the Spider-Verse",
            description: "Miles Morales journeys across the multiverse.",
          },
          {
            title: "Mission: Impossible — Dead Reckoning",
            description: "Ethan Hunt faces a dangerous new threat.",
          },
        ],
      },
    ],
  },
  YouTube: {
    rows: [
      {
        title: "Trending Videos",
        items: [
          {
            title: "MrBeast Challenge",
            description: "Extreme challenges with massive prizes.",
          },
          {
            title: "Veritasium",
            description: "Science and engineering explained.",
          },
          {
            title: "Kurzgesagt",
            description: "Animated science and philosophy.",
          },
          {
            title: "Mark Rober",
            description: "Engineering and science experiments.",
          },
          {
            title: "Linus Tech Tips",
            description: "Tech reviews and PC builds.",
          },
        ],
      },
      {
        title: "Recommended",
        items: [
          {
            title: "Cooking with Babish",
            description: "Recreating dishes from movies and TV.",
          },
          {
            title: "Corridor Crew",
            description: "VFX artists react to movie effects.",
          },
          {
            title: "Tom Scott",
            description: "Amazing places and interesting things.",
          },
          {
            title: "Fireship",
            description: "Fast-paced tech and coding news.",
          },
          {
            title: "Numberphile",
            description: "Videos about numbers and mathematics.",
          },
        ],
      },
    ],
  },
  "Disney+": {
    rows: [
      {
        title: "Featured on Disney+",
        items: [
          {
            title: "Loki Season 2",
            description: "The God of Mischief navigates the multiverse.",
          },
          {
            title: "Ahsoka",
            description: "Ahsoka Tano searches for Grand Admiral Thrawn.",
          },
          {
            title: "Elemental",
            description:
              "Fire and water elements discover they have a lot in common.",
          },
          {
            title: "The Little Mermaid",
            description: "A live-action retelling of the classic tale.",
          },
          {
            title: "Secret Invasion",
            description: "Nick Fury uncovers a Skrull conspiracy.",
          },
        ],
      },
      {
        title: "Disney Classics",
        items: [
          {
            title: "The Lion King",
            description: "A young lion prince flees his kingdom.",
          },
          {
            title: "Frozen",
            description: "A fearless princess sets off to find her sister.",
          },
          {
            title: "Moana",
            description:
              "A teenager sails across the ocean to save her people.",
          },
          {
            title: "Toy Story",
            description: "A cowboy doll is threatened by a new spaceman toy.",
          },
          {
            title: "Finding Nemo",
            description: "A clownfish searches the ocean for his son.",
          },
        ],
      },
    ],
  },
  News: {
    rows: [
      {
        title: "Top Stories",
        items: [
          {
            title: "World Report",
            description: "Global news coverage and analysis.",
          },
          {
            title: "Tech Today",
            description: "The latest in technology and innovation.",
          },
          {
            title: "Market Watch",
            description: "Financial markets and economic news.",
          },
          {
            title: "Climate Update",
            description: "Environmental news and climate science.",
          },
          {
            title: "Health & Science",
            description: "Medical breakthroughs and health news.",
          },
        ],
      },
      {
        title: "Local News",
        items: [
          { title: "City Report", description: "News from your local area." },
          {
            title: "Weather Forecast",
            description: "Your local weather outlook.",
          },
          {
            title: "Traffic Update",
            description: "Real-time traffic conditions.",
          },
          {
            title: "Community Events",
            description: "What's happening in your neighborhood.",
          },
          {
            title: "Sports Local",
            description: "Local sports teams and scores.",
          },
        ],
      },
    ],
  },
  "Amazon Kids": {
    rows: [
      {
        title: "Popular with Kids",
        items: [
          {
            title: "Peppa Pig",
            description: "Peppa and her family go on everyday adventures.",
          },
          {
            title: "Bluey",
            description: "An Australian Blue Heeler puppy and her family.",
          },
          {
            title: "CoComelon",
            description: "Nursery rhymes and kids' songs.",
          },
          {
            title: "Sesame Street",
            description: "Learning and fun on Sesame Street.",
          },
          {
            title: "Dora the Explorer",
            description: "Dora goes on adventures with her monkey Boots.",
          },
        ],
      },
      {
        title: "Learning & Education",
        items: [
          {
            title: "Number Blocks",
            description: "Learn math with colorful number characters.",
          },
          {
            title: "Storybots",
            description: "Curious creatures answer kids' biggest questions.",
          },
          {
            title: "Wild Kratts",
            description: "Brothers explore animal habitats and powers.",
          },
          {
            title: "Magic School Bus",
            description: "Ms. Frizzle takes her class on science field trips.",
          },
          {
            title: "Word World",
            description:
              "Animals made of letters go on word-building adventures.",
          },
        ],
      },
    ],
  },
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function generateContentForCategory(
  category: string,
): { id: string; items: ContentItem[] }[] {
  const content = CATEGORY_CONTENT[category];
  if (!content) {
    return generateFallbackRows(category);
  }

  const seed = hashCode(category);
  return content.rows.map((row, r) => ({
    id: `${category}-row-${r}`,
    items: row.items.map((item, i) => {
      const idx = seed + r * 7 + i * 3;
      return {
        id: `${category}-${r}-${i}`,
        title: item.title,
        description: item.description,
        gradient: GRADIENTS[idx % GRADIENTS.length],
      };
    }),
  }));
}

function generateFallbackRows(
  category: string,
): { id: string; items: ContentItem[] }[] {
  const seed = hashCode(category);
  return [0, 1].map((r) => ({
    id: `${category}-row-${r}`,
    items: Array.from({ length: 5 }, (_, i) => {
      const idx = seed + r * 7 + i * 3;
      return {
        id: `${category}-${r}-${i}`,
        title: `${category} Item ${idx + 1}`,
        description: "Content coming soon.",
        gradient: GRADIENTS[idx % GRADIENTS.length],
      };
    }),
  }));
}
