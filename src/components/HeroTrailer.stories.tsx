import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeroTrailer } from "./HeroTrailer";
import type { Trailer } from "../lib/types";

const sampleTrailers: Trailer[] = [
  { id: "t1", title: "Trailer 1", videoSrc: "" },
  { id: "t2", title: "Trailer 2", videoSrc: "" },
  { id: "t3", title: "Trailer 3", videoSrc: "" },
];

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
          height: "100vh",
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
  args: { expanded: true, trailers: sampleTrailers, activeIndex: 0 },
};

export const Collapsed: Story = {
  args: { expanded: false, trailers: sampleTrailers, activeIndex: 0 },
};

export const SecondTrailer: Story = {
  args: { expanded: true, trailers: sampleTrailers, activeIndex: 1 },
};

export const LastTrailer: Story = {
  args: { expanded: true, trailers: sampleTrailers, activeIndex: 2 },
};
