import type { Meta, StoryObj } from "@storybook/react-vite";
import { ControlsOverlay } from "./ControlsOverlay";

const meta = {
  title: "Components/ControlsOverlay",
  component: ControlsOverlay,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ControlsOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
