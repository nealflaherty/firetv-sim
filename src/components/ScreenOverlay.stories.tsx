import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScreenOverlay } from "./ScreenOverlay";
import type { UINode } from "../lib/parseUIDump";

const meta = {
  title: "Components/ScreenOverlay",
  component: ScreenOverlay,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ScreenOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

function makeNode(overrides: Partial<UINode> = {}): UINode {
  return {
    className: "android.widget.ImageView",
    resourceId: "",
    contentDesc: "",
    text: "",
    bounds: { left: 0, top: 0, right: 0, bottom: 0 },
    clickable: false,
    focused: false,
    selected: false,
    children: [],
    ...overrides,
  };
}

const sampleNodes: UINode[] = [
  makeNode({
    contentDesc: "Home",
    bounds: { left: 476, top: 540, right: 572, bottom: 620 },
    clickable: true,
    focused: true,
  }),
  makeNode({
    contentDesc: "Netflix",
    bounds: { left: 740, top: 540, right: 884, bottom: 620 },
    clickable: true,
  }),
  makeNode({
    contentDesc: "Prime Video",
    bounds: { left: 892, top: 540, right: 1036, bottom: 620 },
    clickable: true,
  }),
  makeNode({
    contentDesc: "YouTube",
    bounds: { left: 1044, top: 540, right: 1188, bottom: 620 },
    clickable: true,
  }),
  makeNode({
    contentDesc: "Blaze and the Monster Machines",
    bounds: { left: 104, top: 682, right: 440, bottom: 865 },
    clickable: true,
  }),
  makeNode({
    contentDesc: "PAW Patrol",
    bounds: { left: 1480, top: 682, right: 1816, bottom: 865 },
    clickable: true,
  }),
  makeNode({
    text: "Learn More",
    bounds: { left: 140, top: 388, right: 286, bottom: 421 },
  }),
];

export const Default: Story = {
  args: {
    screenshotUrl: "/capture/screenshot_20260403_201959.png",
    nodes: sampleNodes,
    width: 960,
    height: 540,
  },
};

export const SmallSize: Story = {
  args: {
    ...Default.args,
    width: 480,
    height: 270,
  },
};

export const NoNodes: Story = {
  args: {
    ...Default.args,
    nodes: [],
  },
};

export const FocusedNode: Story = {
  args: {
    ...Default.args,
    nodes: [
      makeNode({
        contentDesc: "Home",
        bounds: { left: 476, top: 540, right: 572, bottom: 620 },
        clickable: true,
        focused: true,
      }),
    ],
  },
};
