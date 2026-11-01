import SensorValues from "./datatype";

// All thresholds are in g (1 g = 9.8 m/s^2). Tune these while testing.
export const FALL_CONFIG = {
  freeFallG: 0.6, // below this the phone is "weightless" (falling)
  minFreeFallMs: 150, // free-fall must last this long. A shake dips low for only a moment
  freeFallGapMs: 80, // a gap longer than this ends one free-fall
  impactG: 2.2, // a hit above this counts if a real free-fall came just before it
  freeFallToImpactMs: 1200, // impact must follow free-fall within this time

  hardImpactG: 3.0, // a hit this hard counts even with no free-fall (a slam, a tumble)...
  busyG: 0.6, // ...but only if the phone was calm just before: |g - 1| above this is "busy"
  busyWindowMs: 1500,
  maxBusySamples: 8, // more busy samples than this before the hit means shaking, not a fall

  settleMs: 800, // ignore the bounce right after the impact
  stillWindowMs: 3000, // person must stay still for this long to confirm
  stillToleranceG: 0.25, // |magnitude - 1g| under this counts as "still"
};

export type DetectorPhase = "monitoring" | "checking";
export type DetectorEvent = "none" | "impact" | "fall" | "false-alarm";

// Total acceleration regardless of phone orientation.
// Resting on a table this is about 1 g.
export function magnitude(v: SensorValues): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export default class FallDetector {
  phase: DetectorPhase = "monitoring";
  private freeFallStart = 0;
  private lastFreeFallAt = 0;
  private qualifiedFreeFallAt = 0; // last moment a free-fall had lasted long enough
  private qualifiedStart = 0; // when that free-fall began
  private busyTimes: number[] = []; // times the phone was moving a lot
  private impactAt = 0;
  private moved = false;

  // Full reset, used by the app after an alert has been handled.
  reset() {
    this.backToMonitoring();
    this.busyTimes = [];
  }

  // Goes back to watching but remembers how busy the phone has been,
  // so a shake that keeps going is not mistaken for a fresh calm start.
  private backToMonitoring() {
    this.phase = "monitoring";
    this.freeFallStart = 0;
    this.lastFreeFallAt = 0;
    this.qualifiedFreeFallAt = 0;
    this.qualifiedStart = 0;
    this.impactAt = 0;
    this.moved = false;
  }

  private startChecking(now: number): DetectorEvent {
    this.phase = "checking";
    this.impactAt = now;
    this.moved = false;
    return "impact";
  }

  // How many busy samples happened in the window that ends at `until`
  private busyBefore(until: number): number {
    const from = until - FALL_CONFIG.busyWindowMs;
    return this.busyTimes.filter((t) => t >= from && t < until).length;
  }

  // Call this for every accelerometer sample.
  update(g: number, now: number): DetectorEvent {
    const event = this.step(g, now);
    // Remember busy samples in every phase, then forget the old ones
    if (Math.abs(g - 1) > FALL_CONFIG.busyG) this.busyTimes.push(now);
    const keep = now - (FALL_CONFIG.busyWindowMs + 4000);
    if (this.busyTimes.length > 0 && this.busyTimes[0] < keep) {
      this.busyTimes = this.busyTimes.filter((t) => t >= keep);
    }
    return event;
  }

  private step(g: number, now: number): DetectorEvent {
    const c = FALL_CONFIG;

    if (this.phase === "monitoring") {
      // 1. Is the phone in a real free-fall (weightless for long enough)?
      if (g < c.freeFallG) {
        if (this.freeFallStart === 0 || now - this.lastFreeFallAt > c.freeFallGapMs) {
          this.freeFallStart = now;
        }
        this.lastFreeFallAt = now;
        if (now - this.freeFallStart >= c.minFreeFallMs) {
          this.qualifiedFreeFallAt = now;
          this.qualifiedStart = this.freeFallStart;
        }
        return "none";
      }

      // 2. A hit right after a real free-fall, if the phone was calm before the free-fall began
      const afterFreeFall =
        this.qualifiedFreeFallAt > 0 && now - this.qualifiedFreeFallAt <= c.freeFallToImpactMs;
      if (afterFreeFall && g > c.impactG) {
        if (this.busyBefore(this.qualifiedStart) <= c.maxBusySamples) return this.startChecking(now);
        this.qualifiedFreeFallAt = 0; // it was shaking, forget this free-fall
        return "none";
      }

      // 3. A very hard hit with no free-fall, only if the phone was calm just before it
      if (g > c.hardImpactG && this.busyBefore(now) <= c.maxBusySamples) {
        return this.startChecking(now);
      }
      return "none";
    }

    // phase === "checking": did the person get up / move after the impact?
    const elapsed = now - this.impactAt;
    if (elapsed < c.settleMs) return "none";

    if (Math.abs(g - 1) > c.stillToleranceG) this.moved = true;

    if (this.moved) {
      this.backToMonitoring();
      return "false-alarm";
    }
    if (elapsed >= c.settleMs + c.stillWindowMs) {
      this.backToMonitoring();
      return "fall";
    }
    return "none";
  }
}
