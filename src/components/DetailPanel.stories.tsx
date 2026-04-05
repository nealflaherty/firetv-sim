import type { Meta, StoryObj } from "@storybook/react-vite";
import { DetailPanel } from "./DetailPanel";

const meta = {
  title: "Components/DetailPanel",
  component: DetailPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", background: "#000100" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { title: "Dream Scenario", visible: true },
};

export const Closed: Story = {
  args: { title: "Dream Scenario", visible: false },
};
