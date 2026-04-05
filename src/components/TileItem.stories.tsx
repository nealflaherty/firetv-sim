import type { Meta, StoryObj } from "@storybook/react-vite";
import { TileItem } from "./TileItem";
import { ROW_1, ROW_2 } from "../layout";

const meta = {
  title: "Components/TileItem",
  component: TileItem,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ height: 180, display: "flex" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TileItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: ROW_1.items[0].label, img: ROW_1.items[0].img },
};

export const Focused: Story = {
  args: { label: ROW_1.items[0].label, img: ROW_1.items[0].img, focused: true },
};

export const DreamScenario: Story = {
  args: { label: ROW_2.items[0].label, img: ROW_2.items[0].img },
};
