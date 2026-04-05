import type { Meta, StoryObj } from "@storybook/react-vite";
import { OverlayPage } from "./OverlayPage";

const meta = {
  title: "Pages/OverlayPage",
  component: OverlayPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof OverlayPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
