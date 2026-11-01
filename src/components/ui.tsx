import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ComponentProps, ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { alpha, Theme, useTheme } from "../utils/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function IconBadge({
  name,
  color,
  bg,
  size = 40,
  gradient,
}: {
  name: IconName;
  color: string;
  bg?: string;
  size?: number;
  gradient?: [string, string]; // when set, the badge is a solid gradient tile
}) {
  const box = {
    alignItems: "center" as const,
    borderRadius: size * 0.34,
    height: size,
    justifyContent: "center" as const,
    width: size,
  };
  const icon = <Ionicons name={name} size={size * 0.52} color={color} />;
  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[box, { shadowColor: gradient[0], shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }]}
      >
        {icon}
      </LinearGradient>
    );
  }
  return <View style={[box, { backgroundColor: bg }]}>{icon}</View>;
}

// A button filled with the theme's two colours.
export function GradientButton({
  label,
  icon,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ flex: 1, opacity: disabled ? 0.4 : 1 }}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[t.accent, t.accent2]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          alignItems: "center",
          borderRadius: 16,
          flexDirection: "row",
          gap: 8,
          justifyContent: "center",
          minHeight: 50,
        }}
      >
        {loading ?? (
          <>
            {icon && <Ionicons name={icon} size={16} color={t.onAccent} />}
            <Text style={{ color: t.onAccent, fontSize: 15, fontWeight: "800" }}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// A grouped block of related settings: one icon, one title, content below.
export function Section({
  title,
  subtitle,
  icon,
  tone = "accent",
  children,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  tone?: "accent" | "accent2";
  children: ReactNode;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const color = tone === "accent" ? t.accent : t.accent2;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <IconBadge name={icon} color={color} bg={alpha(color, 0.18)} />
        <View style={styles.sectionHeadText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function SwitchRow({
  icon,
  title,
  hint,
  value,
  onValueChange,
}: {
  icon: IconName;
  title: string;
  hint: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.switchRow}>
      <Ionicons name={icon} size={22} color={value ? t.accent : t.muted} />
      <View style={styles.switchText}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: t.track, true: t.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={t.track}
      />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    section: {
      backgroundColor: t.surface,
      borderColor: t.border,
      borderRadius: 28,
      borderWidth: 1,
      padding: 20,
    },
    sectionHead: { alignItems: "center", flexDirection: "row", gap: 14 },
    sectionHeadText: { flex: 1 },
    sectionTitle: { color: t.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
    sectionSub: { color: t.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
    switchRow: {
      alignItems: "center",
      borderTopColor: t.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 14,
      marginTop: 16,
      paddingTop: 16,
    },
    switchText: { flex: 1 },
    switchTitle: { color: t.text, fontSize: 16, fontWeight: "600" },
    switchHint: { color: t.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  });
