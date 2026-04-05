import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeroTrailer } from "./HeroTrailer";

const meta = {
  title: "Components/HeroTrailer",
  component: HeroTrailer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1920/1080",
          background: "#000",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeroTrailer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: { expanded: true, videoSrc: "" },
};

export const Collapsed: Story = {
  args: { expanded: false, videoSrc: "" },
};
