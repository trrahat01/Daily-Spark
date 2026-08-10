import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import AnimatedButton from "@/components/AnimatedButton";

const ONBOARD_KEY = "ds_onboarded";
const PAGES = [
  { icon: "sunny-outline", title: "Start every day with a spark", text: "One thought can change your day. Get a fresh spark each morning." },
  { icon: "heart-circle-outline", title: "Save the words that inspire you", text: "Keep your favorite quotes close and read them whenever you need." },
  { icon: "share-social-outline", title: "Share positivity with others", text: "Share beautiful quote images with your friends and family." },
] as const;

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [checking, setChecking] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARD_KEY).then((v) => {
      if (v === "1") router.replace("/(tabs)");
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, "1").catch(() => {});
    router.replace("/(tabs)");
  };
  const skip = async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, "1").catch(() => {});
    router.replace("/(tabs)");
  };

  if (checking) {
    return <View style={[styles.center, { backgroundColor: c.background }]}><ActivityIndicator color={c.accent} /></View>;
  }

  const page = PAGES[index];
  const isLast = index === PAGES.length - 1;

  return (
    <LinearGradient colors={[c.background, c.accentSoft]} style={[styles.container, { backgroundColor: c.background }]}>
      <Pressable onPress={skip} style={styles.skip} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip onboarding">
        <Text style={{ color: c.textSecondary, fontFamily: "DMSans_600SemiBold" }}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name={page.icon} size={54} color={c.accent} />
        </View>
        <Text style={[styles.title, { color: c.textPrimary }]}>{page.title}</Text>
        <Text style={[styles.text, { color: c.textSecondary }]}>{page.text}</Text>
      </View>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === index ? c.accent : c.border, width: i === index ? 22 : 8 }]} />
        ))}
      </View>

      <View style={styles.footer}>
        {isLast ? (
          <AnimatedButton label="Get Started" onPress={finish} />
        ) : (
          <AnimatedButton label="Next" onPress={() => setIndex((i) => Math.min(i + 1, PAGES.length - 1))} />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  skip: { alignSelf: "flex-end", padding: 20, marginTop: 8 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 18 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 24, fontFamily: "DMSans_700Bold", textAlign: "center" },
  text: { fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 22 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 48 },
});