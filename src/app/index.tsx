import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AlertOverlay from "../components/alertOverlay";
import HistoryCard, { HISTORY_LABELS } from "../components/historyCard";
import OutcomeOverlay, { Outcome } from "../components/outcomeOverlay";
import ReadinessRow from "../components/readinessRow";
import StatusCard from "../components/statusCard";
import TelegramCard from "../components/telegramCard";
import { IconBadge, Section, SwitchRow } from "../components/ui";
import { HistoryItem, HistoryKind } from "../utils/datatype";
import FallDetector, { DetectorPhase, magnitude } from "../utils/fallDetector";
import {
  Coords,
  getCoords,
  mapsLink,
  requestLocationPermission,
} from "../utils/location";
import { preloadSiren, startSiren, stopSiren } from "../utils/siren";
import {
  loadSettings,
  saveBotToken,
  saveChatIds,
  saveContact,
  saveHistory,
  saveIncludeLocation,
  saveSiren,
} from "../utils/storage";
import {
  ChatFailure,
  isValidToken,
  parseChatIds,
  sendToChats,
} from "../utils/telegram";
import { alpha, Theme, useTheme } from "../utils/theme";

const COUNTDOWN_SECONDS = 10;
const SAMPLE_INTERVAL_MS = 20; // 50 samples per second, fast enough to catch a short impact spike
const PEAK_HOLD_MS = 5000; // how long the "strongest hit" reading stays on screen
const DISPLAY_INTERVAL_MS = 150; // refresh the number on screen less often
const MAX_HISTORY = 20;
const RETRY_EVERY_MS = 10000; // if the network is down, try again this often
const MAX_ROUNDS = 18; // about 3 minutes of trying

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Index() {
  useKeepAwake(); // sensors stop when the screen locks, so keep it on
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [available, setAvailable] = useState<boolean | null>(null);
  const [g, setG] = useState(1);
  const [peak, setPeak] = useState(1);
  const peakRef = useRef({ value: 1, at: 0 });
  const [phase, setPhase] = useState<DetectorPhase>("monitoring");
  const [contact, setContact] = useState("");
  const [includeLocation, setIncludeLocation] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [botToken, setBotToken] = useState("");
  const [chatIds, setChatIds] = useState("");
  const [siren, setSiren] = useState(true);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const detector = useRef(new FallDetector());
  const subscription = useRef<ReturnType<
    typeof Accelerometer.addListener
  > | null>(null);
  const lastDisplay = useRef(0);
  const alertActive = useRef(false);
  const isDemo = useRef(false);
  const includeLocationRef = useRef(false);
  const coordsPromise = useRef<Promise<Coords | null> | null>(null);
  const lastCoords = useRef<Coords | null>(null);
  const deliveryId = useRef(0); // bumped to cancel a delivery that is still retrying

  alertActive.current = secondsLeft !== null || outcome !== null;
  includeLocationRef.current = includeLocation;

  // Load saved contact, location choice and history once
  useEffect(() => {
    preloadSiren();
    loadSettings().then((saved) => {
      setContact(saved.contact);
      setIncludeLocation(saved.includeLocation);
      setHistory(saved.history);
      setBotToken(saved.botToken);
      setChatIds(saved.chatIds);
      setSiren(saved.siren);
      setLoaded(true);
    });
  }, []);

  // Save whenever they change (only after the first load, so we never overwrite with empty values)
  useEffect(() => {
    if (loaded) saveContact(contact);
  }, [contact, loaded]);
  useEffect(() => {
    if (loaded) saveIncludeLocation(includeLocation);
  }, [includeLocation, loaded]);
  useEffect(() => {
    if (loaded) saveHistory(history);
  }, [history, loaded]);
  useEffect(() => {
    if (loaded) saveBotToken(botToken);
  }, [botToken, loaded]);
  useEffect(() => {
    if (loaded) saveChatIds(chatIds);
  }, [chatIds, loaded]);
  useEffect(() => {
    if (loaded) saveSiren(siren);
  }, [siren, loaded]);

  const addHistory = useCallback((kind: HistoryKind, note?: string) => {
    const time = Date.now();
    setHistory((prev) =>
      [{ id: String(time), time, kind, note }, ...prev].slice(0, MAX_HISTORY),
    );
  }, []);

  const startAlert = useCallback((demo = false) => {
    isDemo.current = demo;
    // Start finding the location now so it is ready when the countdown ends
    coordsPromise.current = includeLocationRef.current ? getCoords() : null;
    setSecondsLeft(COUNTDOWN_SECONDS);
    Vibration.vibrate([0, 600, 400], true); // repeat until cancelled
  }, []);

  // Ends the countdown screen and puts the detector back to watching
  const endCountdown = useCallback(() => {
    Vibration.cancel();
    setSecondsLeft(null);
    detector.current.reset();
    setPhase("monitoring");
  }, []);

  const record = useCallback(
    (kind: HistoryKind, note: string | undefined, demo: boolean) => {
      if (demo) {
        addHistory(
          "demo",
          note ? `${HISTORY_LABELS[kind]}. ${note}` : HISTORY_LABELS[kind],
        );
      } else {
        addHistory(kind, note);
      }
    },
    [addHistory],
  );

  const stopAlert = useCallback(
    (kind: HistoryKind, note?: string) => {
      endCountdown();
      const demo = isDemo.current;
      isDemo.current = false;
      record(kind, note, demo);
    },
    [endCountdown, record],
  );

  // Called when the countdown ends (or "Send now" is pressed).
  // Starts the siren, then sends the Telegram message and keeps retrying if the network is down.
  const sendHelpMessage = useCallback(async () => {
    endCountdown();
    const demo = isDemo.current;
    isDemo.current = false;
    const myId = ++deliveryId.current;

    const chats = parseChatIds(chatIds);
    const canTelegram = isValidToken(botToken) && chats.length > 0;

    if (siren) startSiren();

    if (!canTelegram) {
      record("no-contact", undefined, demo);
      setOutcome({
        siren,
        status: "none",
        detail: contact.trim()
          ? "Telegram is not set up. You can open Messages or call your contact below."
          : "Telegram is not set up, so no message was sent.",
      });
      return;
    }

    setOutcome({
      siren,
      status: "sending",
      detail: "Finding your location and contacting Telegram.",
    });

    const coords = coordsPromise.current ? await coordsPromise.current : null;
    lastCoords.current = coords;
    if (deliveryId.current !== myId) return; // dismissed while waiting for the GPS

    let text =
      "Possible fall detected. I did not respond to the check-in. Please check on me now.";
    if (coords) text += ` My location: ${mapsLink(coords)}`;

    let remaining = chats;
    let delivered = 0;
    let lastFailures: ChatFailure[] = [];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const result = await sendToChats(botToken, remaining, text, coords);
      if (deliveryId.current !== myId) return;

      delivered += result.ok.length;
      lastFailures = result.failed;
      // Only keep retrying the chats that failed for a reason that could go away
      remaining = result.failed.filter((f) => f.retryable).map((f) => f.chatId);
      if (remaining.length === 0) break;

      setOutcome({
        siren,
        status: "retrying",
        detail: `${lastFailures[0].error}. Trying again in ${RETRY_EVERY_MS / 1000} seconds.`,
      });
      await sleep(RETRY_EVERY_MS);
      if (deliveryId.current !== myId) return;
    }

    if (delivered === chats.length) {
      setOutcome({
        siren,
        status: "sent",
        detail: `Sent to ${delivered} contact(s)${coords ? " with your location" : ""}.`,
      });
      record("sent", `Telegram, ${delivered} of ${chats.length}`, demo);
    } else {
      const reason = lastFailures[0]?.error ?? "Unknown error";
      setOutcome({
        siren,
        status: "failed",
        detail: `Reached ${delivered} of ${chats.length}. ${reason}`,
      });
      record("failed", reason, demo);
    }
  }, [botToken, chatIds, contact, siren, endCountdown, record]);

  const dismissOutcome = useCallback(() => {
    deliveryId.current++; // stops any retrying
    stopSiren();
    setOutcome(null);
    detector.current.reset();
    setPhase("monitoring");
  }, []);

  // Manual backups. They leave the app, which pauses the siren.
  const openMessages = useCallback(async () => {
    const number = contact.trim();
    let body = "Possible fall detected. I may need help. Please check on me.";
    if (lastCoords.current)
      body += ` My location: ${mapsLink(lastCoords.current)}`;
    const separator = Platform.OS === "ios" ? "&" : "?";
    try {
      await Linking.openURL(
        `sms:${number}${separator}body=${encodeURIComponent(body)}`,
      );
    } catch {
      Alert.alert(
        "Could not open messages",
        "Try calling the contact directly.",
      );
    }
  }, [contact]);

  const callContact = useCallback(() => {
    Linking.openURL(`tel:${contact.trim()}`).catch(() =>
      Alert.alert("Could not start the call"),
    );
  }, [contact]);

  // Countdown: tick once per second, send when it reaches 0
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft === 0) {
      sendHelpMessage();
      return;
    }
    const id = setTimeout(() => {
      setSecondsLeft((s) => (s === null ? s : s - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, sendHelpMessage]);

  // Accelerometer -> detector
  useEffect(() => {
    let mounted = true;

    const startSensor = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!mounted) return;
      setAvailable(isAvailable);
      if (!isAvailable) return;

      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
      subscription.current = Accelerometer.addListener((values) => {
        if (alertActive.current) return; // already alerting

        const now = Date.now();
        const mag = magnitude(values);
        const event = detector.current.update(mag, now);

        // Remember the strongest reading for a few seconds so a quick hit is visible
        const p = peakRef.current;
        if (mag >= p.value || now - p.at > PEAK_HOLD_MS) {
          p.value = mag;
          p.at = now;
        }

        if (now - lastDisplay.current > DISPLAY_INTERVAL_MS) {
          lastDisplay.current = now;
          setG(mag);
          setPeak(p.value);
        }
        setPhase(detector.current.phase);

        if (event === "false-alarm") {
          addHistory("false-alarm");
        } else if (event === "fall") {
          startAlert();
        }
      });
    };

    startSensor();
    return () => {
      mounted = false;
      subscription.current?.remove();
      Vibration.cancel();
      stopSiren();
    };
  }, [startAlert, addHistory]);

  const testSiren = () => {
    startSiren();
    setTimeout(stopSiren, 3000);
  };

  const toggleLocation = async (value: boolean) => {
    if (value) {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          "Location permission needed",
          "Allow location access in your phone's settings to add it to the message.",
        );
        return;
      }
    }
    setIncludeLocation(value);
  };

  const telegramReady =
    isValidToken(botToken) && parseChatIds(chatIds).length > 0;

  return (
    <LinearGradient
      colors={t.bgGradient}
      locations={[0, 0.4, 1]}
      style={styles.screen}
    >
      <StatusBar barStyle={t.dark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <IconBadge
              name="shield-checkmark"
              color={t.onAccent}
              gradient={[t.accent, t.accent2]}
              size={48}
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>Fall Guard</Text>
              <Text style={styles.subtitle}>
                Keep this screen open with the phone on you. If you fall and
                can't respond, we'll let the people who care about you know.
              </Text>
            </View>
          </View>

          <StatusCard phase={phase} g={g} peak={peak} available={available} />

          <ReadinessRow
            telegram={telegramReady}
            location={includeLocation}
            siren={siren}
          />

          <TelegramCard
            token={botToken}
            chatIds={chatIds}
            onChangeToken={setBotToken}
            onChangeChatIds={setChatIds}
          />

          <Section
            title="Backup and options"
            subtitle="Extra ways to get help, and what goes in the alert."
            icon="options"
            tone="accent2"
          >
            <View style={styles.field}>
              <Ionicons name="call-outline" size={20} color={t.muted} />
              <TextInput
                style={styles.input}
                value={contact}
                onChangeText={setContact}
                placeholder="Backup phone number"
                placeholderTextColor={t.muted}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.note}>
              Saved on this phone. Powers the Messages and Call buttons after an
              alert.
            </Text>

            <SwitchRow
              icon="location"
              title="Include my location"
              hint="Adds a map pin to the Telegram message."
              value={includeLocation}
              onValueChange={toggleLocation}
            />
            <SwitchRow
              icon="volume-high"
              title="Siren when the timer ends"
              hint="A loud alarm so people nearby can help. Turn the volume up."
              value={siren}
              onValueChange={setSiren}
            />
            <Pressable style={styles.sirenTest} onPress={testSiren}>
              <Ionicons name="play" size={14} color={t.accent2} />
              <Text style={styles.sirenTestText}>Test siren for 3 seconds</Text>
            </Pressable>
          </Section>

          <Pressable
            onPress={() => startAlert(true)}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[t.accent, t.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.demoButton}
            >
              <Ionicons name="flask" size={22} color={t.onAccent} />
              <View style={styles.demoText}>
                <Text style={styles.demoTitle}>Simulate a fall</Text>
                <Text style={styles.demoHint}>
                  Runs the full 30-second alert for a demo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.onAccent} />
            </LinearGradient>
          </Pressable>

          <HistoryCard items={history} onClear={() => setHistory([])} />
        </ScrollView>

        {secondsLeft !== null && (
          <AlertOverlay
            seconds={secondsLeft}
            total={COUNTDOWN_SECONDS}
            willMessage={telegramReady}
            siren={siren}
            onCancel={() => stopAlert("cancelled")}
            onSendNow={sendHelpMessage}
          />
        )}

        {outcome !== null && (
          <OutcomeOverlay
            outcome={outcome}
            hasPhone={contact.trim().length > 0}
            onStop={dismissOutcome}
            onOpenMessages={openMessages}
            onCall={callContact}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1 },
    safeArea: { backgroundColor: "transparent", flex: 1 },
    container: { flexGrow: 1, gap: 20, padding: 22, paddingBottom: 48 },
    header: { alignItems: "flex-start", flexDirection: "row", gap: 14 },
    headerText: { flex: 1 },
    title: {
      color: t.text,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1,
    },
    subtitle: { color: t.muted, fontSize: 14, lineHeight: 21, marginTop: 4 },
    field: {
      alignItems: "center",
      backgroundColor: t.surfaceHi,
      borderColor: t.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
      paddingHorizontal: 16,
    },
    input: { color: t.text, flex: 1, fontSize: 17, paddingVertical: 15 },
    note: { color: t.muted, fontSize: 13, lineHeight: 18, marginTop: 10 },
    sirenTest: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: alpha(t.accent2, 0.16),
      borderRadius: 999,
      flexDirection: "row",
      gap: 8,
      marginTop: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    sirenTestText: { color: t.accent2, fontSize: 14, fontWeight: "700" },
    demoButton: {
      alignItems: "center",
      borderRadius: 24,
      flexDirection: "row",
      gap: 14,
      padding: 20,
      shadowColor: t.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
    },
    demoText: { flex: 1 },
    demoTitle: { color: t.onAccent, fontSize: 18, fontWeight: "800" },
    demoHint: { color: t.onAccent, fontSize: 13, marginTop: 2, opacity: 0.85 },
  });
