import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavBar } from "./NavBar";

const meta = {
  title: "Components/NavBar",
  component: NavBar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1920/1080",
          background: "#1a1a2e",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeFocused: Story = {
  args: { focusedIndex: 4 },
};

export const NetflixFocused: Story = {
  args: { focusedIndex: 6 },
};

export const NoFocus: Story = {
  args: { focusedIndex: null },
};
