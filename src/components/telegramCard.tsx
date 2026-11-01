import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { findChats, isValidToken, parseChatIds, sendToChats } from "../utils/telegram";
import { Theme, useTheme } from "../utils/theme";
import { GradientButton, Section } from "./ui";

export default function TelegramCard({
  token,
  chatIds,
  onChangeToken,
  onChangeChatIds,
}: {
  token: string;
  chatIds: string;
  onChangeToken: (v: string) => void;
  onChangeChatIds: (v: string) => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [busy, setBusy] = useState<"find" | "test" | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ text: string; good: boolean } | null>(null);

  const tokenOk = isValidToken(token);
  const ids = parseChatIds(chatIds);

  const run = async (which: "find" | "test", work: () => Promise<{ text: string; good: boolean }>) => {
    setBusy(which);
    setStatus(null);
    try {
      setStatus(await work());
    } catch (e) {
      setStatus({ text: (e as Error).message, good: false });
    } finally {
      setBusy(null);
    }
  };

  const findContacts = () =>
    run("find", async () => {
      const found = await findChats(token);
      if (found.length === 0) {
        return {
          text: "Nobody found yet. Ask each contact to send your bot a message, then try again.",
          good: false,
        };
      }
      onChangeChatIds(found.map((c) => c.id).join(", "));
      return { text: `Found ${found.map((c) => c.name).join(", ")}`, good: true };
    });

  const sendTest = () =>
    run("test", async () => {
      const result = await sendToChats(
        token,
        ids,
        "Fall Guard test message. If you can read this, alerts will reach you."
      );
      if (result.failed.length === 0) {
        return { text: `Test sent to ${result.ok.length} contact(s). Check Telegram.`, good: true };
      }
      return { text: `Not delivered: ${result.failed[0].error}`, good: false };
    });

  const canFind = tokenOk && !busy;
  const canTest = tokenOk && ids.length > 0 && !busy;

  return (
    <Section
      title="Telegram alerts"
      subtitle="Tells the people who care about you, even if you can't touch the phone. Needs internet."
      icon="paper-plane"
    >
      <View style={styles.field}>
        <Ionicons name="key-outline" size={20} color={t.muted} />
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={onChangeToken}
          placeholder="Bot token from @BotFather"
          placeholderTextColor={t.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!showToken}
        />
        <Pressable onPress={() => setShowToken((v) => !v)} hitSlop={12} accessibilityLabel="Show or hide token">
          <Ionicons name={showToken ? "eye-off-outline" : "eye-outline"} size={20} color={t.muted} />
        </Pressable>
      </View>

      <View style={styles.field}>
        <Ionicons name="people-outline" size={20} color={t.muted} />
        <TextInput
          style={styles.input}
          value={chatIds}
          onChangeText={onChangeChatIds}
          placeholder="Chat IDs, separated by commas"
          placeholderTextColor={t.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, !canFind && styles.disabled]}
          disabled={!canFind}
          onPress={findContacts}
        >
          {busy === "find" ? (
            <ActivityIndicator color={t.accent} />
          ) : (
            <>
              <Ionicons name="search" size={16} color={t.accent} />
              <Text style={styles.buttonText}>Find contacts</Text>
            </>
          )}
        </Pressable>
        <GradientButton
          label="Send test"
          icon="send"
          disabled={!canTest}
          onPress={sendTest}
          loading={busy === "test" ? <ActivityIndicator color={t.onAccent} /> : undefined}
        />
      </View>

      {status && (
        <View style={[styles.status, { backgroundColor: status.good ? t.safeSoft : t.alertSoft }]}>
          <Ionicons
            name={status.good ? "checkmark-circle" : "alert-circle"}
            size={18}
            color={status.good ? t.safe : t.alert}
          />
          <Text style={[styles.statusText, { color: status.good ? t.safe : t.alert }]}>{status.text}</Text>
        </View>
      )}
      {token.length > 0 && !tokenOk && (
        <View style={[styles.status, { backgroundColor: t.alertSoft }]}>
          <Ionicons name="alert-circle" size={18} color={t.alert} />
          <Text style={[styles.statusText, { color: t.alert }]}>
            That doesn't look like a bot token. It looks like 123456789:ABC…
          </Text>
        </View>
      )}
    </Section>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    field: {
      alignItems: "center",
      backgroundColor: t.surfaceHi,
      borderColor: t.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      marginTop: 14,
      paddingHorizontal: 16,
    },
    input: { color: t.text, flex: 1, fontSize: 16, paddingVertical: 15 },
    buttons: { flexDirection: "row", gap: 10, marginTop: 16 },
    button: {
      alignItems: "center",
      backgroundColor: t.accentSoft,
      borderRadius: 16,
      flex: 1,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      minHeight: 50,
    },
    buttonText: { color: t.accent, fontSize: 15, fontWeight: "700" },
    disabled: { opacity: 0.35 },
    status: {
      alignItems: "flex-start",
      borderRadius: 14,
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      padding: 12,
    },
    statusText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  });
