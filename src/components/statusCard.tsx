import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DetectorPhase, FALL_CONFIG } from "../utils/fallDetector";
import { Theme, useTheme } from "../utils/theme";
import PulseRing from "./pulseRing";

const MAX_G = 4; // right edge of the meter

const LABELS: Record<DetectorPhase, string> = {
  monitoring: "Watching over you",
  checking: "Impact felt. Checking if you're OK",
};

// The one bold thing on the screen: a live heartbeat-style ring around the current g-force.
export default function StatusCard({
  phase,
  g,
  peak,
  available,
}: {
  phase: DetectorPhase;
  g: number;
  peak: number;
  available: boolean | null;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const broken = available === false;
  const checking = phase === "checking";
  const color = broken ? t.alert : checking ? t.warn : t.accent;
  const soft = broken ? t.alertSoft : checking ? t.warnSoft : t.accentSoft;
  const fillColors: [string, string] =
    broken || checking ? [color, color] : [t.accent, t.accent2];
  const pct = (value: number) => `${Math.min(value / MAX_G, 1) * 100}%` as const;

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${g.toFixed(2)} g. ${broken ? "No accelerometer" : LABELS[phase]}`}>
      <PulseRing
        color={color}
        size={188}
        fill={soft}
        glow
        active={!broken}
        periodMs={checking ? 1200 : 3400}
      >
        <Text style={[styles.gValue, { color: t.text }]}>{g.toFixed(2)}</Text>
        <Text style={styles.gUnit}>g</Text>
      </PulseRing>

      <View style={[styles.badge, { backgroundColor: soft }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.badgeText, { color }]}>
          {broken ? "No accelerometer on this device" : LABELS[phase]}
        </Text>
      </View>

      <View style={styles.meter}>
        <View style={styles.track}>
          <LinearGradient
            colors={fillColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fill, { width: pct(g) }]}
          />
          <View style={[styles.tick, { left: pct(FALL_CONFIG.freeFallG) }]} />
          <View style={[styles.tick, { left: pct(FALL_CONFIG.impactG) }]} />
        </View>
        <Text style={styles.peak}>Strongest hit just now: {peak.toFixed(2)} g</Text>
        <View style={styles.meterLabels}>
          <Text style={styles.meterText}>Free-fall {FALL_CONFIG.freeFallG} g</Text>
          <Text style={styles.meterText}>Impact {FALL_CONFIG.impactG} g</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { alignItems: "center", marginTop: 4 },
    gValue: {
      fontSize: 60,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      letterSpacing: -2,
    },
    gUnit: { color: t.muted, fontSize: 16, fontWeight: "600", marginTop: -4 },
    badge: {
      alignItems: "center",
      borderRadius: 999,
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    dot: { borderRadius: 4, height: 8, width: 8 },
    badgeText: { fontSize: 14, fontWeight: "700" },
    meter: { alignSelf: "stretch", marginTop: 22 },
    track: {
      backgroundColor: t.track,
      borderRadius: 999,
      height: 8,
      overflow: "hidden",
    },
    fill: { borderRadius: 999, height: 8 },
    tick: { backgroundColor: t.muted, height: 8, opacity: 0.7, position: "absolute", width: 2 },
    peak: { color: t.text, fontSize: 13, fontWeight: "700", marginTop: 12, textAlign: "center" },
    meterLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    meterText: { color: t.muted, fontSize: 12 },
  });
