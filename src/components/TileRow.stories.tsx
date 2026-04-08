import type { Meta, StoryObj } from "@storybook/react-vite";
import { TileRow } from "./TileRow";
import type { ContentItem } from "../lib/types";

const F = "/fragments/";

const fiveItems: ContentItem[] = [
  {
    id: "c1",
    title: "Blaze and the Monster Machines",
    thumbnail: F + "Blaze_and_the_Monster_Machines.png",
  },
  {
    id: "c2",
    title: "If You Give a Mouse a Cookie",
    thumbnail: F + "If_You_Give_a_Mouse_a_Cookie.png",
  },
  {
    id: "c3",
    title: "The Stinky & Dirty Show",
    thumbnail: F + "The_Stinky_Dirty_Show.png",
  },
  {
    id: "c4",
    title: "Mickey Mouse Clubhouse",
    thumbnail: F + "Mickey_Mouse_Clubhouse.png",
  },
  { id: "c5", title: "PAW Patrol", thumbnail: F + "PAW_Patrol.png" },
];

const tenItems: ContentItem[] = [
  ...fiveItems,
  { id: "c6", title: "Jury Duty", thumbnail: F + "Jury_Duty.png" },
  { id: "c7", title: "Fallout", thumbnail: F + "Fallout.png" },
  { id: "c8", title: "Dream Scenario", thumbnail: F + "Dream_Scenario.png" },
  {
    id: "c9",
    title: "Item 9",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  {
    id: "c10",
    title: "Item 10",
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
  },
];

const meta = {
  title: "Components/TileRow",
  component: TileRow,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", paddingTop: "4vw", background: "#1a1a1a" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TileRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items: fiveItems, focusedIndex: null },
};

export const FirstFocused: Story = {
  args: { items: fiveItems, focusedIndex: 0 },
};

export const MiddleFocused: Story = {
  args: { items: fiveItems, focusedIndex: 2 },
};

export const ExpandedNoFocus: Story = {
  args: { items: tenItems, focusedIndex: null, expanded: true },
};

export const ExpandedScrolled: Story = {
  args: { items: tenItems, focusedIndex: 5, expanded: true },
};

export const OverflowCompact: Story = {
  name: "10 Items (compact — only 5 visible)",
  args: { items: tenItems, focusedIndex: null },
};
