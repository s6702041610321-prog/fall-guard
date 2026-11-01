import AsyncStorage from "@react-native-async-storage/async-storage";
import { HistoryItem } from "./datatype";

const KEYS = {
  contact: "fallguard:contact",
  includeLocation: "fallguard:includeLocation",
  history: "fallguard:history",
  botToken: "fallguard:botToken",
  chatIds: "fallguard:chatIds",
  siren: "fallguard:siren",
};

export type Settings = {
  contact: string;
  includeLocation: boolean;
  history: HistoryItem[];
  botToken: string;
  chatIds: string;
  siren: boolean;
};

export async function loadSettings(): Promise<Settings> {
  try {
    const [contact, location, history, botToken, chatIds, siren] = await Promise.all([
      AsyncStorage.getItem(KEYS.contact),
      AsyncStorage.getItem(KEYS.includeLocation),
      AsyncStorage.getItem(KEYS.history),
      AsyncStorage.getItem(KEYS.botToken),
      AsyncStorage.getItem(KEYS.chatIds),
      AsyncStorage.getItem(KEYS.siren),
    ]);
    return {
      contact: contact ?? "",
      includeLocation: location === "1",
      history: history ? (JSON.parse(history) as HistoryItem[]) : [],
      botToken: botToken ?? "",
      chatIds: chatIds ?? "",
      siren: siren !== "0", // on by default
    };
  } catch {
    return {
      contact: "",
      includeLocation: false,
      history: [],
      botToken: "",
      chatIds: "",
      siren: true,
    };
  }
}

export const saveContact = (value: string) =>
  AsyncStorage.setItem(KEYS.contact, value).catch(() => {});

export const saveIncludeLocation = (value: boolean) =>
  AsyncStorage.setItem(KEYS.includeLocation, value ? "1" : "0").catch(() => {});

export const saveHistory = (items: HistoryItem[]) =>
  AsyncStorage.setItem(KEYS.history, JSON.stringify(items)).catch(() => {});

export const saveBotToken = (value: string) =>
  AsyncStorage.setItem(KEYS.botToken, value).catch(() => {});

export const saveChatIds = (value: string) =>
  AsyncStorage.setItem(KEYS.chatIds, value).catch(() => {});

export const saveSiren = (value: boolean) =>
  AsyncStorage.setItem(KEYS.siren, value ? "1" : "0").catch(() => {});
