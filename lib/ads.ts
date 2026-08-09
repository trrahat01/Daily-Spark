import { Platform } from "react-native";

/**
 * Resilient wrapper around react-native-google-mobile-ads.
 *
 * The native AdMob module is only available on a native (Android / iOS)
 * development or production build — it is NOT available in Expo Go or on web.
 * Every API is guarded so the app keeps working (without ads) in those
 * environments instead of crashing.
 *
 * Frequency capping keeps the experience non-intrusive:
 *  - an interstitial only appears every N triggers,
 *  - and never more than once per MIN_INTERSTITIAL_GAP_MS,
 *  - and only if an ad is already loaded.
 */

type AdsModule = typeof import("react-native-google-mobile-ads") | null;

let adsModule: AdsModule = null;
let adsResolved = false;

/** True when the native AdMob module is present and usable on this device. */
export function isAdsAvailable(): boolean {
  if (adsResolved) return adsModule !== null;
  adsResolved = true;
  if (Platform.OS === "web") {
    adsModule = null;
    return false;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    adsModule = require("react-native-google-mobile-ads") as AdsModule;
  } catch {
    adsModule = null;
  }
  return adsModule !== null;
}

/** Exposes the module to React components (returns null when unavailable). */
export function getAdsModule(): AdsModule {
  return isAdsAvailable() ? adsModule : null;
}

let initialized = false;

/** Must be called once at app startup (best-effort; never throws). */
export async function initAds(): Promise<void> {
  const mod = getAdsModule();
  if (!mod || initialized) return;
  try {
    await mod.MobileAds().initialize();
    initialized = true;
  } catch {
    // Native module unavailable (e.g. Expo Go) — silently continue.
  }
}

// ---------------------------------------------------------------------------
// Interstitial frequency capping
// ---------------------------------------------------------------------------

/** Show an interstitial at most once every 8 triggers. */
const INTERSTITIAL_EVERY_N = 8;
/** Never show an interstitial more often than once per 5 minutes. */
const INTERSTITIAL_MIN_GAP_MS = 5 * 60 * 1000;

let interstitialCounter = 0;
let lastInterstitialShownAt = 0;
let interstitialAd: any = null;

function ensureInterstitialLoaded(): void {
  const mod = getAdsModule();
  if (!mod || interstitialAd) return;
  try {
    interstitialAd = mod.InterstitialAd.createForAdRequest(
      mod.TestIds.INTERSTITIAL,
      { requestNonPersonalizedAdsOnly: true }
    );
    interstitialAd.addAdEventListener(mod.AdEventType.LOADED, () => {
      /* ad is ready to show */
    });
    interstitialAd.addAdEventListener(mod.AdEventType.CLOSED, () => {
      interstitialAd = null;
      ensureInterstitialLoaded();
    });
    interstitialAd.load();
  } catch {
    interstitialAd = null;
  }
}

/**
 * Call whenever a natural in-app checkpoint happens (category switch,
 * "Surprise Me", etc.). Internally caps frequency so users are never spammed.
 */
export function trackInterstitialCheckpoint(): void {
  ensureInterstitialLoaded();

  interstitialCounter += 1;
  if (interstitialCounter % INTERSTITIAL_EVERY_N !== 0) return;

  const now = Date.now();
  if (now - lastInterstitialShownAt < INTERSTITIAL_MIN_GAP_MS) return;

  const mod = getAdsModule();
  if (!mod || !interstitialAd || !interstitialAd.loaded) return;

  try {
    interstitialAd.show();
    lastInterstitialShownAt = now;
    interstitialAd = null;
  } catch {
    interstitialAd = null;
  }
}
