import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeroTrailer } from "./HeroTrailer";
import type { Trailer } from "../lib/types";

const sampleTrailers: Trailer[] = [
  {
    id: "t1",
    title: "IQBAR",
    videoSrc:
      "https://abexlcnaaaaaaaamletu7vv43fzhj.mid-pop-vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fVVMgJTABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/394d/7b22/7552/4d05-9f61-1e6826fd0b69/9297c5d3-d3f7-45a4-9918-77427ee09bc8_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235484.0",
  },
  {
    id: "t2",
    title: "Back to the Future",
    videoSrc:
      "https://abexlcnaaaaaaaamlyjrns6ymqkdm.vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fR0IgHzABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/91a0/e404/5db9/4796-a1fe-6901ea12d00f/a920aba9-ebf6-46c8-bc0d-3accf0055117_video_12.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235614.0",
  },
  {
    id: "t3",
    title: "Primer",
    videoSrc:
      "https://abexlcnaaaaaaaamlsbrxqnoa6uzl.vod-dash.main.amazon.pv-cdn.net/dm/3$0CiEIAhoFZW5fR0IgHzABUgaAwAKB8AN6A4C4F4IBAQGIAQQYAQ/iad_2/ff77/6225/383e/4650-900c-96656dd7d85e/caf5918f-e089-4b42-ab9f-997c4ce36707_video_9.mp4?amznDtid=AOAGZA014O5RE&amznPN=xp&amznPV=ATVWebPlayerSDK-1.0.235614.0",
  },
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
