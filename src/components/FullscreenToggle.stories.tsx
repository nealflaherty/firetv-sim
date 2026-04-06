import type { Meta, StoryObj } from "@storybook/react-vite";
import { FullscreenToggle } from "./FullscreenToggle";

const meta = {
  title: "Components/FullscreenToggle",
  component: FullscreenToggle,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: "200px",
          background: "#1a1a1a",
          position: "relative",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FullscreenToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
