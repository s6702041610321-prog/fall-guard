import SensorValues from "./datatype";

// All thresholds are in g (1 g = 9.8 m/s^2). Tune these while testing.
export const FALL_CONFIG = {
  freeFallG: 0.4, // below this the phone is "weightless" (falling)
  impactG: 2.5, // above this we call it a hard impact
  freeFallToImpactMs: 1000, // impact must follow free-fall within this time
  settleMs: 1000, // ignore the bounce right after the impact
  stillWindowMs: 3000, // person must stay still for this long to confirm
  stillToleranceG: 0.2, // |magnitude - 1g| under this counts as "still"
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
  private lastFreeFallAt = 0;
  private impactAt = 0;
  private moved = false;

  reset() {
    this.phase = "monitoring";
    this.lastFreeFallAt = 0;
    this.impactAt = 0;
    this.moved = false;
  }

  // Call this for every accelerometer sample.
  update(g: number, now: number): DetectorEvent {
    const c = FALL_CONFIG;

    if (this.phase === "monitoring") {
      if (g < c.freeFallG) {
        this.lastFreeFallAt = now;
        return "none";
      }
      const afterFreeFall =
        this.lastFreeFallAt > 0 && now - this.lastFreeFallAt <= c.freeFallToImpactMs;
      if (g > c.impactG && afterFreeFall) {
        this.phase = "checking";
        this.impactAt = now;
        this.moved = false;
        return "impact";
      }
      return "none";
    }

    // phase === "checking": did the person get up / move after the impact?
    const elapsed = now - this.impactAt;
    if (elapsed < c.settleMs) return "none";

    if (Math.abs(g - 1) > c.stillToleranceG) this.moved = true;

    if (this.moved) {
      this.reset();
      return "false-alarm";
    }
    if (elapsed >= c.settleMs + c.stillWindowMs) {
      this.reset();
      return "fall";
    }
    return "none";
  }
}
