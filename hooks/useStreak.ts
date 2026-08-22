import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Daily "Spark streak" tracker.
 *
 * Persists the last-open day plus a rolling 30-day history of active days so the
 * home screen can render a 7-day flame calendar. The update is idempotent per
 * day: opening the app twice in one day never double-counts.
 */

const STREAK_KEY = "ds_streak";
const BEST_KEY = "ds_best_streak";
const LAST_KEY = "ds_last_open";
const DAYS_KEY = "ds_active_days";

export interface StreakDay {
  /** Local date string yyyy-mm-dd. */
  date: string;
  /** Short weekday label, e.g. "Mon". */
  day: string;
  /** Whether the app was opened this day. */
  active: boolean;
  isToday: boolean;
}

export interface StreakState {
  streak: number;
  best: number;
  last7: StreakDay[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole-day difference in days, positive when b is after a. */
function dayDiff(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
}

// Serialize the read-modify-write so a rare double-mount can't double-count.
let inFlight: Promise<StreakState> | null = null;

async function updateStreak(): Promise<StreakState> {
  const today = dateStr(new Date());

  let streak = 0;
  let best = 0;
  let days: string[] = [];

  try {
    const [streakRaw, bestRaw, lastRaw, daysRaw] = await Promise.all([
      AsyncStorage.getItem(STREAK_KEY),
      AsyncStorage.getItem(BEST_KEY),
      AsyncStorage.getItem(LAST_KEY),
      AsyncStorage.getItem(DAYS_KEY),
    ]);

    streak = parseInt(streakRaw ?? "0", 10) || 0;
    best = parseInt(bestRaw ?? "0", 10) || 0;
    const last = lastRaw || "";
    days = daysRaw ? (JSON.parse(daysRaw) as string[]) : [];

    if (last !== today) {
      if (last) {
        const diff = dayDiff(last, today);
        streak = diff === 1 ? streak + 1 : 1;
      } else {
        streak = 1;
      }
      if (streak > best) best = streak;
      if (!days.includes(today)) days.push(today);
      // Keep only the recent window so storage stays bounded.
      days = days
        .filter((d) => {
          const diff = dayDiff(d, today);
          return diff >= 0 && diff <= 30;
        })
        .sort();

      await AsyncStorage.multiSet([
        [STREAK_KEY, String(streak)],
        [BEST_KEY, String(best)],
        [LAST_KEY, today],
        [DAYS_KEY, JSON.stringify(days)],
      ]);
    }
  } catch {
    // Fall through to the derived calendar below with whatever loaded.
  }

  const last7: StreakDay[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const s = dateStr(dt);
    last7.push({
      date: s,
      day: WEEKDAYS[dt.getDay()],
      active: days.includes(s),
      isToday: s === today,
    });
  }

  return { streak, best, last7 };
}

function runUpdate(): Promise<StreakState> {
  if (inFlight) return inFlight;
  inFlight = updateStreak().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function useStreak(): StreakState {
  const [state, setState] = useState<StreakState>({ streak: 0, best: 0, last7: [] });
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    runUpdate().then(setState).catch(() => {});
  }, []);

  return state;
}