/**
 * Firebase Analytics wrapper (lazy + guarded so it never crashes the app).
 * Auto-logs `app_open` and `session_start` in Firebase, and these helpers log
 * custom engagement events. View daily users / events in Firebase Console.
 */
type Payload = Record<string, unknown> | undefined;

// Never import at module scope — the native module may be absent at runtime.
function getAnalytics(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@react-native-firebase/analytics");
    return mod?.default ?? null;
  } catch {
    return null;
  }
}

function logEvent(name: string, payload?: Payload): void {
  const a = getAnalytics();
  if (!a) return;
  Promise.resolve(a().logEvent(name, payload ?? {})).catch(() => {});
}

export function trackQuoteViewed(quoteId: string, payload?: Payload): void {
  logEvent("quote_viewed", { quote_id: quoteId, ...(payload ?? {}) });
}

export function trackQuoteShared(quoteId: string, payload?: Payload): void {
  logEvent("quote_shared", { quote_id: quoteId, ...(payload ?? {}) });
}

export function trackQuoteFavorited(quoteId: string, payload?: Payload): void {
  logEvent("quote_favorited", { quote_id: quoteId, ...(payload ?? {}) });
}

export function trackCategoryOpened(category: string): void {
  logEvent("category_opened", { category });
}

export function trackSearch(query: string): void {
  logEvent("search", { search_term: query });
}

export function trackEvent(name: string, payload?: Payload): void {
  logEvent(name, payload);
}