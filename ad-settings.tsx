import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getAdSettings, updateAdSettings, AdSettings } from "@/lib/ad-service";

export default function AdSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdSettings | null>(null);

  // Local state for form inputs
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [interstitialEnabled, setInterstitialEnabled] = useState(true);
  const [bannerId, setBannerId] = useState("");
  const [interstitialId, setInterstitialId] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getAdSettings();
      if (data) {
        setSettings(data);
        setBannerEnabled(data.banner_enabled);
        setInterstitialEnabled(data.interstitial_enabled);
        setBannerId(data.banner_id || "");
        setInterstitialId(data.interstitial_id || "");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load ad settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdSettings({
        banner_enabled: bannerEnabled,
        interstitial_enabled: interstitialEnabled,
        banner_id: bannerId,
        interstitial_id: interstitialId,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Ad settings updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banner Ads</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Enable Banner Ads</Text>
              <Switch
                value={bannerEnabled}
                onValueChange={setBannerEnabled}
                trackColor={{ false: "#767577", true: Colors.light.accent }}
                thumbColor={bannerEnabled ? "#ffffff" : "#f4f3f4"}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Banner Ad Unit ID</Text>
              <TextInput
                style={styles.input}
                placeholder="ca-app-pub-xxxxxxxx/xxxxxxxx"
                placeholderTextColor={Colors.light.textTertiary}
                value={bannerId}
                onChangeText={setBannerId}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interstitial Ads</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Enable Interstitial Ads</Text>
              <Switch
                value={interstitialEnabled}
                onValueChange={setInterstitialEnabled}
                trackColor={{ false: "#767577", true: Colors.light.accent }}
                thumbColor={interstitialEnabled ? "#ffffff" : "#f4f3f4"}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Interstitial Ad Unit ID</Text>
              <TextInput
                style={styles.input}
                placeholder="ca-app-pub-xxxxxxxx/xxxxxxxx"
                placeholderTextColor={Colors.light.textTertiary}
                value={interstitialId}
                onChangeText={setInterstitialId}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: pressed || saving ? 0.8 : 1 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="save-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Settings"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centered: { justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: { fontSize: 16, fontFamily: "DMSans_500Medium", color: Colors.light.text },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: "DMSans_400Regular", color: Colors.light.textSecondary },
  input: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accent,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "DMSans_600SemiBold" },
});