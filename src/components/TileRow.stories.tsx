import type { Meta, StoryObj } from "@storybook/react-vite";
import { TileRow } from "./TileRow";
import type { ContentItem } from "../lib/types";

const sampleItems: ContentItem[] = [
  {
    id: "c1",
    title: "Blaze and the Monster Machines",
    thumbnail: "/fragments/Blaze_and_the_Monster_Machines.png",
  },
  {
    id: "c2",
    title: "If You Give a Mouse a Cookie",
    thumbnail: "/fragments/If_You_Give_a_Mouse_a_Cookie.png",
  },
  {
    id: "c3",
    title: "The Stinky & Dirty Show",
    thumbnail: "/fragments/The_Stinky_Dirty_Show.png",
  },
  {
    id: "c4",
    title: "Mickey Mouse Clubhouse",
    thumbnail: "/fragments/Mickey_Mouse_Clubhouse.png",
  },
  { id: "c5", title: "PAW Patrol", thumbnail: "/fragments/PAW_Patrol.png" },
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
  args: { items: sampleItems, focusedIndex: null },
};

export const FirstFocused: Story = {
  args: { items: sampleItems, focusedIndex: 0 },
};

export const MiddleFocused: Story = {
  args: { items: sampleItems, focusedIndex: 2 },
};
