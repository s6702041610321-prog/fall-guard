import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, useTheme } from "../utils/theme";
import PulseRing from "./pulseRing";

export type Outcome = {
  siren: boolean;
  status: "sending" | "sent" | "retrying" | "failed" | "none";
  detail: string;
};

const TITLES: Record<Outcome["status"], string> = {
  sending: "Letting your contacts know",
  sent: "Your contacts have been told",
  retrying: "Still trying to reach them",
  failed: "Couldn't reach your contacts",
  none: "No one to message",
};

// Shown after the countdown ends. Stays up (and the siren keeps going) until the person dismisses it.
export default function OutcomeOverlay({
  outcome,
  hasPhone,
  onStop,
  onOpenMessages,
  onCall,
}: {
  outcome: Outcome;
  hasPhone: boolean;
  onStop: () => void;
  onOpenMessages: () => void;
  onCall: () => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const working = outcome.status === "sending" || outcome.status === "retrying";
  const sent = outcome.status === "sent";
  const color = sent ? t.safe : t.alert;

  return (
    <LinearGradient colors={[t.alertBgTop, t.alertBgBottom]} style={styles.overlay}>
      <PulseRing
        color={color}
        size={150}
        periodMs={1600}
        active={outcome.siren || working}
        fill={sent ? t.safeSoft : t.alertSoft}
      >
        {working ? (
          <ActivityIndicator size="large" color={color} />
        ) : (
          <Ionicons
            name={sent ? "checkmark" : outcome.status === "none" ? "person-remove" : "alert"}
            size={64}
            color={color}
          />
        )}
      </PulseRing>

      <Text style={styles.title}>{TITLES[outcome.status]}</Text>

      {outcome.siren && (
        <View style={styles.sirenPill}>
          <Ionicons name="volume-high" size={18} color={t.alert} />
          <Text style={styles.sirenText}>Siren is on</Text>
        </View>
      )}
      <Text style={styles.body}>{outcome.detail}</Text>

      <Pressable style={styles.stopButton} onPress={onStop} accessibilityRole="button">
        <Ionicons name="checkmark-circle" size={26} color={t.onSafe} />
        <Text style={styles.stopText}>{outcome.siren ? "I'm OK, stop siren" : "I'm OK, close"}</Text>
      </Pressable>

      {hasPhone && (
        <View style={styles.row}>
          <Pressable style={styles.secondary} onPress={onOpenMessages}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={t.alert} />
            <Text style={styles.secondaryText}>Messages</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onCall}>
            <Ionicons name="call-outline" size={18} color={t.alert} />
            <Text style={styles.secondaryText}>Call</Text>
          </Pressable>
        </View>
      )}
    </LinearGradient>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      gap: 14,
      justifyContent: "center",
      padding: 28,
    },
    title: {
      color: t.text,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.8,
      marginTop: 6,
      textAlign: "center",
    },
    sirenPill: {
      alignItems: "center",
      backgroundColor: t.alertSoft,
      borderRadius: 999,
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    sirenText: { color: t.alert, fontSize: 15, fontWeight: "700" },
    body: {
      color: t.muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 12,
      maxWidth: 320,
      textAlign: "center",
    },
    stopButton: {
      alignItems: "center",
      backgroundColor: t.safe,
      borderRadius: 22,
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      minHeight: 68,
      width: "100%",
    },
    stopText: { color: t.onSafe, fontSize: 20, fontWeight: "800" },
    row: { flexDirection: "row", gap: 12, width: "100%" },
    secondary: {
      alignItems: "center",
      borderColor: t.alert,
      borderRadius: 18,
      borderWidth: 1.5,
      flex: 1,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      minHeight: 52,
    },
    secondaryText: { color: t.alert, fontSize: 15, fontWeight: "700" },
  });
