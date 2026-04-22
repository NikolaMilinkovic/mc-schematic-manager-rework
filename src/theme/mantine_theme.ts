import { createTheme } from "@mantine/core";

const emerald = [
  "#f0fdf4",
  "#dcfce7",
  "#bbf7d0",
  "#86efac",
  "#4ade80",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
  "#14532d",
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
  primaryColor: "emerald",
  primaryShade: 5,
  colors: {
    emerald,
    stoneGray,
    skyCyan,
    goldOre,
    redstone,
  },
  black: "#050607",
  white: "#e8ecef",
  defaultRadius: "sm",
  fontFamily: '"Inter Tight", "Segoe UI", sans-serif',
  headings: {
    fontFamily: '"Sora", "Inter Tight", "Segoe UI", sans-serif',
    fontWeight: "600",
  },
});
