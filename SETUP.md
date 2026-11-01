# Fall Guard: Telegram + Siren setup (about 5 minutes)

## 1. Install the new package
In your project folder:

    npx expo install expo-audio expo-linear-gradient @expo/vector-icons

(`expo-linear-gradient` and `@expo/vector-icons` are used by the new design.
The other packages you already use are enough. `fetch` is built in.)

## 2. Copy the files
Copy `src/` over your project's `src/` and put the `assets/` folder
(it holds `siren.wav`) at the project root, next to `src/`.

## 3. Create the bot
1. Open Telegram, search for **@BotFather**, send `/newbot`.
2. Give it a name and a username ending in `bot`.
3. BotFather replies with a token like `123456789:AAH...`. Copy it.

## 4. Get your contacts to press Start
Everyone who should receive alerts (including you for testing) must:
1. Open your bot in Telegram (search its username).
2. Press **Start**.

Telegram does not let a bot message someone who has not done this.

## 5. Set up in the app
1. Paste the token into **Telegram alerts**.
2. Tap **Find contacts**. Everyone who pressed Start is filled in as chat IDs.
   (This only sees the last ~24 hours. If it finds nobody, press Start again and retry.)
3. Tap **Send test**. Your phone should buzz in Telegram.
4. Turn on **Include my location** if you want a map pin.
5. Tap **Simulate a fall**, wait 30 seconds, and check Telegram.

## What happens at the end of the countdown
1. The siren starts (if enabled). Turn the media volume up first.
2. The app sends a Telegram message, plus a map pin, to every chat ID.
3. If the internet is down, it retries every 10 seconds for about 3 minutes.
4. The screen stays up until the person taps "I'm OK, stop siren".
   "Open Messages" and "Call" are manual backups.

## Limits to be honest about
- Needs internet. The siren works without it.
- The app must stay open in the foreground (the phone's sensors stop otherwise).
- The siren plays at the phone's current volume. An app cannot raise it.
- The bot token is stored on the phone. Fine for a class project; a real
  product should send through a server instead.
- Anyone who gets the token can send messages as your bot. If it leaks,
  send `/revoke` to BotFather.
