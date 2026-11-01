import { ReactNode, useEffect, useMemo, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";

// Rings that swell out from a centre circle and fade, like a heartbeat.
// Respects the phone's "reduce motion" setting (shows the still circle only).
export default function PulseRing({
  color,
  size,
  periodMs = 3000,
  rings = 3,
  active = true,
  fill,
  glow,
  children,
}: {
  color: string;
  size: number; // diameter of the centre circle
  periodMs?: number;
  rings?: number;
  active?: boolean;
  fill?: string; // background of the centre circle
  glow?: boolean; // soft coloured light around the circle
  children?: ReactNode;
}) {
  const values = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;
  const outer = size * 1.7;

  useEffect(() => {
    let cancelled = false;
    const loops: Animated.CompositeAnimation[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce || !active) return;
      for (let i = 0; i < rings; i++) {
        const v = values[i];
        v.setValue(0);
        // Stagger the rings so one is always mid-swell
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            const loop = Animated.loop(
              Animated.timing(v, {
                toValue: 1,
                duration: periodMs,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              })
            );
            loops.push(loop);
            loop.start();
          }, (i * periodMs) / rings)
        );
      }
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, [active, periodMs, rings, values]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { alignItems: "center", height: outer, justifyContent: "center", width: outer },
        ring: {
          borderRadius: size / 2,
          borderWidth: 2,
          height: size,
          position: "absolute",
          width: size,
        },
        core: {
          alignItems: "center",
          borderRadius: size / 2,
          borderWidth: 2,
          height: size,
          justifyContent: "center",
          width: size,
        },
      }),
    [size, outer]
  );

  return (
    <View style={styles.wrap}>
      {values.slice(0, rings).map((v, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderColor: color,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.core,
          { borderColor: color, backgroundColor: fill ?? "transparent" },
          glow && { shadowColor: color, shadowOpacity: 0.7, shadowRadius: 34, shadowOffset: { width: 0, height: 0 } },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
