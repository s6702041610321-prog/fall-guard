import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme, useTheme } from "../utils/theme";
import { IconName } from "./ui";

// Three chips that answer "will this actually protect me right now?" at a glance.
export default function ReadinessRow({
  telegram,
  location,
  siren,
}: {
  telegram: boolean;
  location: boolean;
  siren: boolean;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const chip = (on: boolean, icon: IconName, onText: string, offText: string) => (
    <View style={[styles.chip, on ? styles.chipOn : styles.chipOff]} key={onText}>
      <Ionicons name={icon} size={15} color={on ? t.accent : t.muted} />
      <Text style={[styles.chipText, { color: on ? t.accent : t.muted }]}>{on ? onText : offText}</Text>
    </View>
  );

  return (
    <View style={styles.row}>
      {chip(telegram, "paper-plane", "Telegram ready", "Telegram not set")}
      {chip(location, "location", "Location on", "Location off")}
      {chip(siren, "volume-high", "Siren on", "Siren off")}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
    chip: {
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipOn: { backgroundColor: t.accentSoft, borderColor: "transparent" },
    chipOff: { backgroundColor: "transparent", borderColor: t.border },
    chipText: { fontSize: 13, fontWeight: "600" },
  });
