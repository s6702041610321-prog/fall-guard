import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { setThemeName, Theme, THEME_ORDER, THEMES, useTheme } from "../utils/theme";
import { Section } from "./ui";

export default function ThemePicker() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Section title="Theme" subtitle="Pick the colours you like." icon="color-palette" tone="accent2">
      <View style={styles.row}>
        {THEME_ORDER.map((name) => {
          const th = THEMES[name];
          const selected = name === t.name;
          return (
            <Pressable
              key={name}
              style={styles.item}
              onPress={() => setThemeName(name)}
              accessibilityRole="button"
              accessibilityLabel={`${th.label} theme`}
              accessibilityState={{ selected }}
            >
              <View style={[styles.ring, selected && { borderColor: t.text }]}>
                <LinearGradient
                  colors={[th.bgGradient[0], th.accent, th.accent2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.swatch}
                >
                  {selected && <Ionicons name="checkmark" size={24} color="#FFFFFF" />}
                </LinearGradient>
              </View>
              <Text style={[styles.label, selected && { color: t.text, fontWeight: "800" }]}>
                {th.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
    item: { alignItems: "center", gap: 8 },
    ring: {
      alignItems: "center",
      borderColor: "transparent",
      borderRadius: 999,
      borderWidth: 2.5,
      padding: 3,
    },
    swatch: {
      alignItems: "center",
      borderRadius: 999,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    label: { color: t.muted, fontSize: 13, fontWeight: "600" },
  });
