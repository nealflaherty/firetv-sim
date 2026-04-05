import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavItem } from "./NavItem";
import { NAV_ITEMS, APP_SHORTCUTS } from "../layout";

const meta = {
  title: "Components/NavItem",
  component: NavItem,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 120, height: 80, position: "relative" }}>
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

export const AppShortcut: Story = {
  args: { label: APP_SHORTCUTS[0].label, img: APP_SHORTCUTS[0].img },
};

export const AppShortcutFocused: Story = {
  args: {
    label: APP_SHORTCUTS[0].label,
    img: APP_SHORTCUTS[0].img,
    focused: true,
  },
};
