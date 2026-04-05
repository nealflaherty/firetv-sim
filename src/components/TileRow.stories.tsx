import type { Meta, StoryObj } from "@storybook/react-vite";
import { TileRow } from "./TileRow";
import { ROW_1, ROW_2 } from "../layout";

const meta = {
  title: "Components/TileRow",
  component: TileRow,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 200,
          background: "#000100",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TileRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Row1Default: Story = {
  args: { row: ROW_1, focusedIndex: null },
};

export const Row1Focused: Story = {
  args: { row: ROW_1, focusedIndex: 0 },
};

export const Row2Default: Story = {
  args: { row: ROW_2, focusedIndex: null },
};
