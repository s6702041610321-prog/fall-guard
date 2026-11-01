import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";

// A loud looping siren so people nearby can hear it. Works with no internet.
// It plays at the phone's current media volume, which the app cannot raise
// by itself, so turn the volume up before relying on it.
let player: AudioPlayer | null = null;
let modeSet = false;

// Call once at startup so the sound is already loaded when an alert happens.
export async function preloadSiren() {
  try {
    if (!modeSet) {
      // Play even when the iPhone silent switch is on
      await setAudioModeAsync({ playsInSilentMode: true });
      modeSet = true;
    }
    if (!player) {
      player = createAudioPlayer(require("../../assets/siren.wav"));
      player.loop = true;
      player.volume = 1;
    }
  } catch (e) {
    console.warn("Siren setup failed:", e);
  }
}

export async function startSiren() {
  await preloadSiren();
  if (!player) return;
  try {
    player.volume = 1;
    player.play();
  } catch (e) {
    console.warn("Siren play failed:", e);
  }
}

export function stopSiren() {
  try {
    player?.pause();
    player?.seekTo(0).catch(() => {}); // rewind for next time, not required
  } catch {}
}
