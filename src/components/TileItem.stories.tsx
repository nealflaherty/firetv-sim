import type { Meta, StoryObj } from "@storybook/react-vite";
import { TileItem } from "./TileItem";

const meta = {
  title: "Components/TileItem",
  component: TileItem,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          height: 180,
          display: "flex",
          background: "#1a1a1a",
          padding: "2rem",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TileItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    label: "Blaze and the Monster Machines",
    img: "/fragments/Blaze_and_the_Monster_Machines.png",
  },
};

export const Focused: Story = {
  args: {
    label: "Blaze and the Monster Machines",
    img: "/fragments/Blaze_and_the_Monster_Machines.png",
    focused: true,
  },
};

export const WithGradient: Story = {
  args: {
    label: "Squid Game S2",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
  },
};

export const GradientFocused: Story = {
  args: {
    label: "Squid Game S2",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    focused: true,
  },
};

export const Placeholder: Story = {
  args: { label: "Loading..." },
};
