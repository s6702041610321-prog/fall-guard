type SensorValues = {
  x: number;
  y: number;
  z: number;
};

export default SensorValues;

export type HistoryKind = "sent" | "failed" | "cancelled" | "false-alarm" | "no-contact" | "demo";

export type HistoryItem = {
  id: string;
  time: number; // Date.now() when it happened
  kind: HistoryKind;
  note?: string;
};
