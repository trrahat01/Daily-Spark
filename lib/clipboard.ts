/**
 * Crash-proof clipboard. `expo-clipboard` is a native module; if it is not
 * present in the current build (e.g. a stale dev build), importing it at module
 * scope would crash the screen. We require lazily and swallow failures so the
 * app keeps working.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Clipboard = require("expo-clipboard");
    if (!Clipboard?.setStringAsync) return false;
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}