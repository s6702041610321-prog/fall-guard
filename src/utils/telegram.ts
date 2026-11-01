// Sends alerts through a Telegram bot. No server needed: the app calls the
// Telegram Bot API directly with fetch, so it works without anyone tapping Send.
//
// Note: the bot token is stored on the phone. That is fine for a class project,
// but a production app should keep it on a server instead.

import type { Coords } from "./location";

const API = "https://api.telegram.org";

export type ChatFailure = { chatId: string; error: string; retryable: boolean };
export type SendResult = { ok: string[]; failed: ChatFailure[] };

class TelegramError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

// Looks like 123456789:AAH... (digits, colon, 30+ url-safe characters)
export const isValidToken = (token: string) =>
  /^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token.trim());

// Accepts "123, -456" or one per line. Group chats have negative ids.
export const parseChatIds = (raw: string): string[] =>
  Array.from(
    new Set(
      raw
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => /^-?\d+$/.test(s))
    )
  );

async function call<T>(
  token: string,
  method: string,
  body: Record<string, unknown> = {},
  timeoutMs = 10000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}/bot${token.trim()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json();
    if (!json.ok) {
      // 429 and 5xx are worth retrying, 400/401/403 (bad token, blocked bot) are not
      const retryable = res.status === 429 || res.status >= 500;
      throw new TelegramError(json.description ?? `HTTP ${res.status}`, retryable);
    }
    return json.result as T;
  } catch (e) {
    if (e instanceof TelegramError) throw e;
    // fetch failed or timed out: no signal, worth trying again
    throw new TelegramError("No internet connection or request timed out", true);
  } finally {
    clearTimeout(timer);
  }
}

async function sendToChat(token: string, chatId: string, text: string, coords?: Coords | null) {
  await call(token, "sendMessage", { chat_id: chatId, text });
  if (coords) {
    // A map pin the contact can tap. If this fails the text already has a link.
    try {
      await call(token, "sendLocation", {
        chat_id: chatId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch {}
  }
}

// Sends to every chat in parallel and reports which ones worked.
export async function sendToChats(
  token: string,
  chatIds: string[],
  text: string,
  coords?: Coords | null
): Promise<SendResult> {
  const outcomes = await Promise.all(
    chatIds.map(async (chatId): Promise<ChatFailure | null> => {
      try {
        await sendToChat(token, chatId, text, coords);
        return null;
      } catch (e) {
        const err = e as TelegramError;
        return { chatId, error: err.message, retryable: err.retryable ?? true };
      }
    })
  );
  const failed = outcomes.filter((o): o is ChatFailure => o !== null);
  const failedIds = new Set(failed.map((f) => f.chatId));
  return { ok: chatIds.filter((id) => !failedIds.has(id)), failed };
}

export type FoundChat = { id: string; name: string };

// Lists people who pressed Start on the bot, so nobody has to dig for chat ids.
// Telegram only keeps these for about 24 hours, and it does not work if a webhook is set.
export async function findChats(token: string): Promise<FoundChat[]> {
  type Update = {
    message?: {
      chat: { id: number; first_name?: string; username?: string; title?: string };
    };
  };
  const updates = await call<Update[]>(token, "getUpdates", { limit: 100, timeout: 0 });
  const seen = new Map<string, FoundChat>();
  for (const u of updates) {
    const chat = u.message?.chat;
    if (!chat) continue;
    const id = String(chat.id);
    const name = chat.first_name ?? chat.title ?? chat.username ?? id;
    seen.set(id, { id, name });
  }
  return Array.from(seen.values());
}
