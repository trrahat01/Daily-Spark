import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useLanguage } from "@/lib/language-context";
import ThemeOptions from "@/components/ThemeOptions";

const PRIVACY_POLICY_URL =
  "https://trrahat01.github.io/daily-spark-privacy/";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { language, setLanguage, languages } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);

  const currentLang =
    languages.find((l) => l.code === language) ?? languages[0];

  const touch = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const openPrivacy = async () => {
    touch();
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert("Unable to open", "Could not open the privacy policy link.");
    }
  };

  const shareApp = async () => {
    touch();
    try {
      await Share.share({
        message:
          "Daily Spark – Inspirational quotes & daily motivation to keep you going. Install it here!",
      });
    } catch {
      // no-op when dismissed
    }
  };

  const showAbout = () => {
    touch();
    Alert.alert(
      "Daily Spark",
      "Motivational quotes & daily inspiration.\n\nVersion 1.0.0\nMade with ❤️"
    );
  };

  const menuItems = [
    {
      icon: "language-outline" as const,
      title: "Language",
      subtitle: `${currentLang.flag}  ${currentLang.label}`,
      onPress: () => {
        touch();
        setLanguageOpen((open) => !open);
      },
    },
    {
      icon: "share-social-outline" as const,
      title: "Share Daily Spark",
      subtitle: "Tell a friend about this app",
      onPress: shareApp,
    },
    {
      icon: "shield-checkmark-outline" as const,
      title: "Privacy Policy",
      subtitle: "How we handle your data",
      onPress: openPrivacy,
    },
    {
      icon: "information-circle-outline" as const,
      title: "About",
      subtitle: "Version and app info",
      onPress: showAbout,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your experience</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <ThemeOptions />
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.title}
              style={({ pressed }) => [
                styles.menuItem,
                index === menuItems.length - 1 && { borderBottomWidth: 0 },
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={22} color={Colors.light.accent} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.light.textTertiary}
              />
            </Pressable>
          ))}
        </View>

        {languageOpen && (
          <View style={styles.languageContainer}>
            <Text style={styles.languageTitle}>Choose your language</Text>
            {languages.map((lang) => {
              const active = lang.code === language;
              return (
                <Pressable
                  key={lang.code}
                  style={({ pressed }) => [
                    styles.languageRow,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                  onPress={() => {
                    touch();
                    setLanguage(lang.code);
                    setLanguageOpen(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageLabel}>{lang.label}</Text>
                  {active && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.light.success}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.footer}>
          Daily Spark is free and supported by ads.
          {"\n"}Get inspired. Keep going.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  menuContainer: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  footer: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 28,
    lineHeight: 20,
  },
  languageContainer: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    paddingVertical: 6,
  },
  languageTitle: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  languageFlag: {
    fontSize: 18,
    marginRight: 12,
  },
  languageLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
  },
});
