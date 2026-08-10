/**
 * No-op ad controller. The app stays fully functional with no ads.
 * When monetization is added later, implement these against the real SDK.
 */
export interface AdPlacement {
  banner: boolean;
  interstitial: boolean;
  rewarded: boolean;
}

export const adsEnabled = false;

export async function initAds(): Promise<void> {
  // Intentional no-op.
}

export function showBanner(): void {
  // no-op
}

export function shouldShowInterstitial(): boolean {
  return false;
}

export function maybeShowInterstitial(): void {
  // no-op, frequency-capped in a future implementation
}

export function maybeShowRewarded(): void {
  // no-op
}

export function getAdPlacement(): AdPlacement {
  return { banner: false, interstitial: false, rewarded: false };
}