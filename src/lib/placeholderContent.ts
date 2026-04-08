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
  rows: {
    title: string;
    items: { title: string; description: string; thumbnail?: string }[];
  }[];
}

const F = "/fragments/";

const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "My Stuff": {
    rows: [
      {
        title: "Watchlist",
        items: [
          {
            title: "Moana (Bonus Content)",
            description: "Go behind the scenes of the animated adventure.",
            thumbnail: F + "Moana__Bonus_Content_.png",
          },
          {
            title: "Sesame Street: Elmo Says Boo!",
            description:
              "Elmo and friends celebrate Halloween on Sesame Street.",
            thumbnail: F + "Sesame_Street__Elmo_Says_Boo_.png",
          },
          {
            title: "Twilight (4K UHD)",
            description:
              "A teenage girl risks everything when she falls in love with a vampire.",
            thumbnail: F + "Twilight__4K_UHD_.png",
          },
          {
            title: "Almost Love",
            description:
              "Five interconnected couples navigate love in New York City.",
            thumbnail: F + "Almost_Love.png",
          },
          {
            title: "Good Will Hunting",
            description: "A janitor at MIT has a gift for mathematics.",
            thumbnail: F + "Good_Will_Hunting_-_Edited_Version.png",
          },
        ],
      },
      {
        title: "Purchases and Rentals",
        items: [
          {
            title: "Blaze and the Monster Machines Season 4",
            description: "Blaze and AJ take on new adventures in Axle City.",
            thumbnail: F + "Blaze_and_the_Monster_Machines_Season_4.png",
          },
          {
            title: "Supernatural: The Complete Second Season",
            description:
              "Sam and Dean continue hunting supernatural creatures.",
            thumbnail: F + "Supernatural__The_Complete_Second_Season.png",
          },
          {
            title: "Nirvanna the Band the Show the Movie",
            description: "Two best friends try to get a gig at a local bar.",
            thumbnail: F + "Nirvanna_the_Band_the_Show_the_Movie.png",
          },
          {
            title: "New Girl Season 4",
            description: "Jess and her roommates navigate life and love in LA.",
            thumbnail: F + "New_Girl_Season_4.png",
          },
          {
            title: "Planet Earth Season 1",
            description: "David Attenborough narrates the natural world.",
            thumbnail:
              F + "Planet_Earth_Season_1__Narrator_-_David_Attenborough_.png",
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
        title: "Browse",
        items: [
          {
            title: "Appstore",
            description: "Browse and download apps for your Fire TV.",
            thumbnail: F + "Appstore.png",
          },
          { title: "Free", description: "Watch free movies and TV shows." },
          {
            title: "Movies",
            description: "Browse movies across all services.",
            thumbnail: F + "Movies.png",
          },
          {
            title: "TV Shows",
            description: "Browse TV shows across all services.",
            thumbnail: F + "TV_Shows.png",
          },
          { title: "Games", description: "Browse games for your Fire TV." },
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
            title: "CNN Headlines",
            description: "Breaking news and live coverage from CNN.",
            thumbnail: F + "CNN_Headlines.png",
          },
          {
            title: "CSI: Crime Scene Investigation",
            description:
              "A team of forensic investigators solve crimes in Las Vegas.",
            thumbnail: F + "CSI__Crime_Scene_Investigation.png",
          },
          {
            title: "Introduction to Astrophysics",
            description:
              "Explore the universe through the lens of astrophysics.",
            thumbnail: F + "Introduction_to_Astrophysics.png",
          },
          {
            title: "PAW Patrol",
            description: "Live episodes of the rescue pup adventures.",
          },
          {
            title: "South Park",
            description:
              "The animated comedy series from Trey Parker and Matt Stone.",
            thumbnail: F + "South_Park.png",
          },
        ],
      },
      {
        title: "Guide",
        items: [
          {
            title: "SpongeBob SquarePants",
            description:
              "The adventures of a sea sponge and his friends in Bikini Bottom.",
            thumbnail: F + "SpongeBob_SquarePants.png",
          },
          {
            title: "SpongeBob SquarePants Universe",
            description: "Explore the expanded SpongeBob universe.",
          },
          {
            title: "CNN Headlines",
            description: "24/7 news coverage.",
            thumbnail: F + "CNN_Headlines.png",
          },
          { title: "CSI", description: "Crime scene investigation drama." },
          { title: "PAW Patrol", description: "More rescue adventures." },
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
        title: "Movies we think you'll like",
        items: [
          {
            title: "Super Wings S6",
            description:
              "Jett the jet plane delivers packages to kids around the world.",
            thumbnail: F + "Super_Wings_S6.png",
          },
          {
            title: "Thomas & Friends Classic",
            description: "The classic adventures of Thomas the Tank Engine.",
            thumbnail: F + "Thomas___Friends_Classic.png",
          },
          {
            title: "Tumble Leaf - Season 1",
            description:
              "A blue fox named Fig explores a whimsical land of adventure.",
            thumbnail: F + "Tumble_Leaf_-_Season_1.png",
          },
          {
            title: "Blue's Clues Season 6",
            description: "Blue and friends solve clues and puzzles together.",
            thumbnail: F + "Blue_s_Clues_Season_6.png",
          },
          {
            title: "Tayo the Little Bus",
            description: "A friendly little bus learns about the city.",
            thumbnail: F + "Tayo_the_Little_Bus.png",
          },
        ],
      },
      {
        title: "Popular movies",
        items: [
          {
            title: "S4: The Bob Lazar Story",
            description: "The story of Bob Lazar and Area 51.",
            thumbnail: F + "S4__The_Bob_Lazar_Story.png",
          },
          {
            title: "The Passion of the Christ",
            description: "The final twelve hours of Jesus of Nazareth's life.",
            thumbnail: F + "The_Passion_of_the_Christ.png",
          },
          {
            title: "PAW Patrol: Rescue Wheels",
            description: "The pups get new vehicles for their rescue missions.",
            thumbnail: F + "PAW_Patrol__Rescue_Wheels.png",
          },
          {
            title: "Fire Ants: The Invincible Army",
            description:
              "A documentary about the remarkable world of fire ants.",
            thumbnail: F + "Fire_Ants__The_Invincible_Army.png",
          },
          {
            title: "Mafia's Greatest Hits",
            description: "Stories of the most notorious mobsters in history.",
            thumbnail:
              F +
              "Mafia_s_Greatest_Hits_-_Tony_Spilotro__The_Las_Vegas_Enforcer.png",
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
            title: "Mickey Mouse Clubhouse",
            description:
              "Mickey and friends solve problems using basic skills and teamwork.",
            thumbnail: F + "Mickey_Mouse_Clubhouse.png",
          },
          {
            title: "The Lion Guard",
            description:
              "Kion, son of Simba, leads the Lion Guard to protect the Pride Lands.",
          },
          {
            title: "The Exile",
            description: "A dramatic tale of survival and redemption.",
          },
          {
            title: "SuperKitties",
            description:
              "Four brave kittens use their superpowers to save Kittydale.",
          },
          {
            title: "Mickey Mouse Clubhouse+",
            description: "More adventures with Mickey and the gang.",
          },
        ],
      },
      {
        title: "Disney Junior",
        items: [
          {
            title: "Minnie's Bow-Toons: Party Palace",
            description: "Minnie and Daisy run a party planning business.",
          },
          {
            title: "Minnie's Bow-Toons: Pet Hotel",
            description: "Minnie opens a pet hotel for adorable animals.",
          },
          {
            title: "Minnie's Bow-Toons",
            description: "Minnie Mouse and her bow-tique adventures.",
          },
          {
            title: "Mickey's Mousekersize",
            description: "Get moving with Mickey and friends.",
          },
          {
            title: "Meet Spidey and his Amazing Friends",
            description: "Young Peter Parker teams up with Miles and Gwen.",
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
    title: row.title,
    items: row.items.map((item, i) => {
      const idx = seed + r * 7 + i * 3;
      return {
        id: `${category}-${r}-${i}`,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        gradient: item.thumbnail
          ? undefined
          : GRADIENTS[idx % GRADIENTS.length],
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
