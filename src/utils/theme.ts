export type Theme = {
  dark: boolean;
  bgGradient: [string, string, string]; // screen background, top to bottom
  bg: string;
  surface: string;
  surfaceHi: string;
  border: string;
  text: string;
  muted: string;
  track: string;
  accent: string; // the two brand colours
  accent2: string;
  accentSoft: string;
  onAccent: string;
  // These three always keep their meaning
  safe: string; // the OK button
  safeSoft: string;
  onSafe: string;
  warn: string; // impact felt, checking
  warnSoft: string;
  alert: string; // someone may need help
  alertSoft: string;
  alertBgTop: string; // full-screen alert gradient
  alertBgBottom: string;
};

// "#RRGGBB" + 0..1 -> rgba()
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Warm daylight: honey and rose on soft cream, with a calm sage green for "you're OK".
const cozy: Theme = {
  dark: false,
  bgGradient: ["#FFD9B8", "#FFEEDD", "#FFF9F1"],
  bg: "#FFF9F1",
  surface: "rgba(255,255,255,0.88)",
  surfaceHi: "#FFF3E6",
  border: "rgba(170,95,45,0.17)",
  text: "#3A2418",
  muted: "#85695A",
  track: "rgba(170,95,45,0.14)",
  accent: "#D9691F",
  accent2: "#DB4A68",
  accentSoft: "rgba(217,105,31,0.14)",
  onAccent: "#FFFFFF",
  safe: "#3E9B6E",
  safeSoft: "rgba(62,155,110,0.15)",
  onSafe: "#FFFFFF",
  warn: "#C98100",
  warnSoft: "rgba(201,129,0,0.15)",
  alert: "#D8343F",
  alertSoft: "rgba(216,52,63,0.12)",
  alertBgTop: "#FFD0C4",
  alertBgBottom: "#FFF2EC",
};

export function useTheme(): Theme {
  return cozy;
}
