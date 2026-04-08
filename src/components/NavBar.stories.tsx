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

export const CompactHomeFocused: Story = {
  args: { focusedIndex: 4, mode: "compact" },
};

export const CompactNetflixFocused: Story = {
  args: { focusedIndex: 6, mode: "compact" },
};

export const ContentWithSelection: Story = {
  args: { focusedIndex: null, selectedIndex: 4, mode: "content" },
};

export const ContentPrimeSelected: Story = {
  args: { focusedIndex: null, selectedIndex: 7, mode: "content" },
};

export const Expanded: Story = {
  args: { focusedIndex: 4, mode: "expanded" },
};

export const BreadcrumbMode: Story = {
  args: {
    focusedIndex: null,
    selectedIndex: 7,
    showBreadcrumb: true,
    breadcrumbLabel: "Prime Video",
    mode: "content",
  },
};

export const NoFocus: Story = {
  args: { focusedIndex: null, mode: "compact" },
};
