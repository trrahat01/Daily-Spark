import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useStreak } from "@/hooks/useStreak";
import type { ThemeColors } from "@/theme/colors";

/** Flame color — kept constant so it reads as a "streak" in any theme. */
const FLAME = "#E8590C";

export default function StreakCalendar() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { streak, best, last7 } = useStreak();
  return <StreakCalendarInner c={c} streak={streak} best={best} last7={last7} />;
}

function StreakCalendarInner({
  c,
  streak,
  best,
  last7,
}: {
  c: ThemeColors;
  streak: number;
  best: number;
  last7: ReturnType<typeof useStreak>["last7"];
}) {
  if (!last7.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name="flame" size={17} color={FLAME} />
          <Text style={styles.num}>{streak}</Text>
          <Text style={[styles.sub, { color: c.textSecondary }]}>day streak</Text>
        </View>
        {best > 0 ? (
          <Text style={[styles.best, { color: c.textTertiary }]}>Best {best}</Text>
        ) : null}
      </View>

      <View style={styles.week}>
        {last7.map((d) => (
          <View key={d.date} style={styles.dayCell}>
            <View
              style={[
                styles.circle,
                d.active
                  ? { backgroundColor: FLAME }
                  : { backgroundColor: c.surfaceSecondary },
                d.isToday && { borderWidth: 2, borderColor: c.accent },
              ]}
            >
              {d.active ? (
                <Ionicons name="flame" size={12} color="#FFFFFF" />
              ) : null}
            </View>
            <Text style={[styles.dayLabel, { color: c.textTertiary }]}>
              {d.day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  num: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: FLAME,
  },
  sub: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  best: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    alignItems: "center",
    gap: 6,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
  },
});