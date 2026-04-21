import { createTheme } from "@mantine/core";

const amethyst = [
  "#ebe7f8",
  "#d9d2ef",
  "#bbb0e1",
  "#9d8fd4",
  "#866fc8",
  "#7b66c3",
  "#6f5ab8",
  "#5f4da1",
  "#4f3f87",
  "#3e3269",
] as const;

const stoneGray = [
  "#f2f5f8",
  "#dee5ec",
  "#bcc9d6",
  "#9aaec1",
  "#7e96ad",
  "#6c859d",
  "#5f7890",
  "#4f6479",
  "#425366",
  "#374554",
] as const;

const skyCyan = [
  "#e6fbff",
  "#c0f3fa",
  "#93e9f5",
  "#63dfee",
  "#39d4e8",
  "#22cde4",
  "#14c8e0",
  "#00aec4",
  "#0099af",
  "#007a8c",
] as const;

const goldOre = [
  "#fff9e0",
  "#fff1b8",
  "#ffe885",
  "#ffde4f",
  "#ffd524",
  "#facc15",
  "#e2b400",
  "#c79d00",
  "#a78600",
  "#7f6700",
] as const;

const redstone = [
  "#ffe8e8",
  "#ffcfcf",
  "#ff9e9e",
  "#ff6b6b",
  "#fa4a4a",
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#7f1d1d",
] as const;

export const appTheme = createTheme({
  primaryColor: "amethyst",
  primaryShade: 6,
  colors: {
    amethyst,
    stoneGray,
    skyCyan,
    goldOre,
    redstone,
  },
  black: "#050607",
  white: "#e5edf4",
  defaultRadius: "sm",
  fontFamily: '"Inter Tight", "Segoe UI", sans-serif',
  headings: {
    fontFamily: '"Sora", "Inter Tight", "Segoe UI", sans-serif',
    fontWeight: "600",
  },
});
