import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, useTheme } from "../utils/theme";
import PulseRing from "./pulseRing";

export default function AlertOverlay({
  seconds,
  total,
  willMessage,
  siren,
  onCancel,
  onSendNow,
}: {
  seconds: number;
  total: number;
  willMessage: boolean;
  siren: boolean;
  onCancel: () => void;
  onSendNow: () => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const body = willMessage
    ? `If we don't hear from you, your contacts will be told${siren ? " and the siren will sound" : ""} when the timer ends.`
    : siren
      ? "No Telegram contact is set up, so only the siren will sound."
      : "No Telegram contact is set up. Add one on the main screen.";

  return (
    <LinearGradient colors={[t.alertBgTop, t.alertBgBottom]} style={styles.overlay}>
      <Text style={styles.title}>Are you OK?</Text>

      <PulseRing color={t.alert} size={210} periodMs={1500} fill={t.alertSoft}>
        <Text style={styles.countdown} accessibilityLiveRegion="polite">
          {seconds}
        </Text>
        <Text style={styles.unit}>seconds</Text>
      </PulseRing>

      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${(seconds / total) * 100}%` }]} />
      </View>
      <Text style={styles.body}>{body}</Text>

      <Pressable style={styles.okButton} onPress={onCancel} accessibilityRole="button">
        <Ionicons name="checkmark-circle" size={26} color={t.onSafe} />
        <Text style={styles.okText}>I'm OK, cancel</Text>
      </Pressable>
      <Pressable style={styles.sendButton} onPress={onSendNow} accessibilityRole="button">
        <Text style={styles.sendText}>Send help message now</Text>
      </Pressable>
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
    title: { color: t.text, fontSize: 34, fontWeight: "800", letterSpacing: -1 },
    countdown: {
      color: t.alert,
      fontSize: 92,
      fontVariant: ["tabular-nums"],
      fontWeight: "800",
      letterSpacing: -3,
      lineHeight: 100,
    },
    unit: { color: t.muted, fontSize: 15, fontWeight: "600", marginTop: -6 },
    progress: {
      backgroundColor: t.alertSoft,
      borderRadius: 999,
      height: 6,
      marginTop: 10,
      overflow: "hidden",
      width: "70%",
    },
    progressFill: { backgroundColor: t.alert, borderRadius: 999, height: 6 },
    body: {
      color: t.muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 14,
      maxWidth: 320,
      textAlign: "center",
    },
    okButton: {
      alignItems: "center",
      backgroundColor: t.safe,
      borderRadius: 22,
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      minHeight: 68,
      width: "100%",
    },
    okText: { color: t.onSafe, fontSize: 20, fontWeight: "800" },
    sendButton: {
      alignItems: "center",
      borderColor: t.alert,
      borderRadius: 22,
      borderWidth: 1.5,
      justifyContent: "center",
      minHeight: 56,
      width: "100%",
    },
    sendText: { color: t.alert, fontSize: 16, fontWeight: "700" },
  });
