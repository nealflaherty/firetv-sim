import type { Meta, StoryObj } from "@storybook/react-vite";
import { DetailPanel } from "./DetailPanel";
import type { ContentItem } from "../lib/types";

const sampleItem: ContentItem = {
  id: "c6",
  title: "Dream Scenario",
  description:
    "An ordinary family man finds his life turned upside down when millions of strangers suddenly start seeing him in their dreams.",
  rating: "6.8",
  ratingCount: 93018,
  runtime: 101,
  year: "2023",
  maturity: "R",
  features: ["X-Ray", "CC", "UHD"],
  entitlement: "Free with Ads | Play now on Tubi",
  thumbnail: "/fragments/Dream_Scenario.png",
};

const minimalItem: ContentItem = {
  id: "c1",
  title: "Blaze and the Monster Machines",
  description: "Blaze and his driver AJ have adventures in Axle City.",
};

const meta = {
  title: "Components/DetailPanel",
  component: DetailPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", background: "#1a1a1a", minHeight: "40vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullMetadata: Story = {
  args: { item: sampleItem, visible: true },
};

export const MinimalMetadata: Story = {
  args: { item: minimalItem, visible: true },
};

export const Closed: Story = {
  args: { item: sampleItem, visible: false },
};

export const NoItem: Story = {
  args: { item: null, visible: true },
};
