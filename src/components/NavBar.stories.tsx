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
          width: "100%",
          height: "100vh",
          background: "#1a1a1a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
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

export const Breadcrumb: Story = {
  args: { focusedIndex: null, showBreadcrumb: true },
};

export const Translucent: Story = {
  args: { focusedIndex: 4, translucent: true },
};
