import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavItem } from "./NavItem";
import { NAV_ITEMS, APP_SHORTCUTS } from "../layout";

const meta = {
  title: "Components/NavItem",
  component: NavItem,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 120,
          height: 80,
          position: "relative",
          background: "#1a1a1a",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: NAV_ITEMS[4].label, img: NAV_ITEMS[4].img },
};

export const Focused: Story = {
  args: { label: NAV_ITEMS[4].label, img: NAV_ITEMS[4].img, focused: true },
};

export const Selected: Story = {
  args: { label: NAV_ITEMS[4].label, img: NAV_ITEMS[4].img, selected: true },
};

export const AppShortcut: Story = {
  args: {
    label: APP_SHORTCUTS[0].label,
    img: APP_SHORTCUTS[0].img,
    variant: "app",
  },
};

export const AppShortcutFocused: Story = {
  args: {
    label: APP_SHORTCUTS[0].label,
    img: APP_SHORTCUTS[0].img,
    variant: "app",
    focused: true,
  },
};

export const AppShortcutSelected: Story = {
  args: {
    label: APP_SHORTCUTS[1].label,
    img: APP_SHORTCUTS[1].img,
    variant: "app",
    selected: true,
  },
};
