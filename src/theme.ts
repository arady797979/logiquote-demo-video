import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

const inter = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const jakarta = loadJakarta("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });

// Mirrors apps/dashboard/src/app/globals.css (dark theme, emerald primary).
export const theme = {
  bg: "#070b14",
  bgSoft: "#0b111d",
  card: "#0d1422",
  border: "#1d2636",
  fg: "#f8fafc",
  muted: "#8494a8",
  primary: "#27b07d",
  primarySoft: "rgba(39,176,125,0.18)",
  blue: "#4d8ff6",
  fontBody: inter.fontFamily,
  fontDisplay: jakarta.fontFamily,
};

export type Layout = "landscape" | "vertical";
