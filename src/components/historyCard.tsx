import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HistoryItem, HistoryKind } from "../utils/datatype";
import { Theme, useTheme } from "../utils/theme";
import { IconName } from "./ui";

export const HISTORY_LABELS: Record<HistoryKind, string> = {
  sent: "Help message sent",
  failed: "Could not send the help message",
  cancelled: "Alert cancelled, you were OK",
  "false-alarm": "Impact felt, but you moved",
  "no-contact": "Countdown ended, no Telegram contact set",
  demo: "Simulated fall",
};

const ICONS: Record<HistoryKind, IconName> = {
  sent: "checkmark-done",
  failed: "alert",
  cancelled: "shield-checkmark",
  "false-alarm": "pulse",
  "no-contact": "person-remove",
  demo: "flask",
};

export default function HistoryCard({
  items,
  onClear,
}: {
  items: HistoryItem[];
  onClear: () => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const tone = (kind: HistoryKind) => {
    if (kind === "sent" || kind === "failed" || kind === "no-contact")
      return { fg: t.alert, bg: t.alertSoft };
    if (kind === "false-alarm") return { fg: t.warn, bg: t.warnSoft };
    if (kind === "demo") return { fg: t.muted, bg: t.surfaceHi };
    return { fg: t.safe, bg: t.safeSoft };
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        {items.length > 0 && (
          <Pressable onPress={onClear} hitSlop={10}>
            <Text style={styles.clear}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={26} color={t.muted} />
          <Text style={styles.emptyText}>
            No alerts yet. Falls, cancelled alerts and false alarms will show up here.
          </Text>
        </View>
      ) : (
        items.map((item, index) => {
          const c = tone(item.kind);
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.rail}>
                <View style={[styles.badge, { backgroundColor: c.bg }]}>
                  <Ionicons name={ICONS[item.kind]} size={16} color={c.fg} />
                </View>
                {index < items.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.rowText}>
                <Text style={styles.label}>{HISTORY_LABELS[item.kind]}</Text>
                {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
                <Text style={styles.time}>
                  {new Date(item.time).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    title: { color: t.text, fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
    clear: { color: t.muted, fontSize: 14, fontWeight: "600" },
    empty: {
      alignItems: "center",
      backgroundColor: t.surface,
      borderColor: t.border,
      borderRadius: 22,
      borderStyle: "dashed",
      borderWidth: 1.5,
      gap: 10,
      padding: 26,
    },
    emptyText: { color: t.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
    row: { flexDirection: "row", gap: 14 },
    rail: { alignItems: "center", width: 34 },
    badge: {
      alignItems: "center",
      borderRadius: 12,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    line: { backgroundColor: t.border, flex: 1, marginVertical: 4, width: 2 },
    rowText: { flex: 1, paddingBottom: 20 },
    label: { color: t.text, fontSize: 15, fontWeight: "600", lineHeight: 20 },
    note: { color: t.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
    time: { color: t.muted, fontSize: 12, marginTop: 4, opacity: 0.8 },
  });
