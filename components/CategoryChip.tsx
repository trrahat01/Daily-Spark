import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, active, onPress }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Category ${label}`}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? c.accent : c.surface, borderColor: active ? c.accent : c.border },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[styles.label, { color: active ? "#fff" : c.textSecondary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
});