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

// Deep ocean: near-black navy water with cyan and blue light. Kept dark so it is easy on the eyes.
const ocean: Theme = {
  dark: true,
  bgGradient: ["#07324F", "#041B2D", "#010910"],
  bg: "#010910",
  surface: "rgba(120,190,235,0.06)",
  surfaceHi: "rgba(120,190,235,0.08)",
  border: "rgba(140,200,240,0.13)",
  text: "#E6F4FB",
  muted: "#86A9BB",
  track: "rgba(140,200,240,0.14)",
  accent: "#33C4EE",
  accent2: "#5B7CFF",
  accentSoft: "rgba(51,196,238,0.17)",
  onAccent: "#03202D",
  safe: "#34E0A1",
  safeSoft: "rgba(52,224,161,0.16)",
  onSafe: "#032B1C",
  warn: "#FFC247",
  warnSoft: "rgba(255,194,71,0.17)",
  alert: "#FF5470",
  alertSoft: "rgba(255,84,112,0.17)",
  alertBgTop: "#3A0C1F",
  alertBgBottom: "#10050B",
};

export function useTheme(): Theme {
  return ocean;
}
