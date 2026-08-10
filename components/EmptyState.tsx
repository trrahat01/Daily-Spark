import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export default function EmptyState({ icon = "sparkles-outline", title, message }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name={icon} size={40} color={c.textTertiary} />
      </View>
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: c.textSecondary }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 18, fontFamily: "DMSans_600SemiBold", textAlign: "center" },
  message: { fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center" },
});