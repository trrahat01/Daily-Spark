/**
 * Optional analytics abstraction (no-op for now). Wire to a real provider later.
 * Everything here is safe to call anywhere; it never throws or blocks.
 */
type Payload = Record<string, unknown> | undefined;

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    // never let analytics break the app
  }
}

export function trackQuoteViewed(quoteId: string, payload?: Payload): void {
  safe(() => {});
}

export function trackQuoteShared(quoteId: string, payload?: Payload): void {
  safe(() => {});
}

export function trackQuoteFavorited(quoteId: string, payload?: Payload): void {
  safe(() => {});
}

export function trackCategoryOpened(category: string): void {
  safe(() => {});
}

export function trackSearch(query: string): void {
  safe(() => {});
}

export function trackEvent(name: string, payload?: Payload): void {
  safe(() => {});
}