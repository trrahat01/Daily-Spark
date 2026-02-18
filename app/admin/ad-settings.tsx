import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Pressable,
  Platform,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import Colors from "@/constants/colors";

export default function AdSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [interstitialEnabled, setInterstitialEnabled] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  
  // AdMob IDs State
  const [appIdAndroid, setAppIdAndroid] = useState("");
  const [appIdIos, setAppIdIos] = useState("");
  const [bannerIdAndroid, setBannerIdAndroid] = useState("");
  const [bannerIdIos, setBannerIdIos] = useState("");
  const [interstitialIdAndroid, setInterstitialIdAndroid] = useState("");
  const [interstitialIdIos, setInterstitialIdIos] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setBannerEnabled(data.banner_enabled);
        setInterstitialEnabled(data.interstitial_enabled);
        setAppIdAndroid(data.admob_app_id_android || "");
        setAppIdIos(data.admob_app_id_ios || "");
        setBannerIdAndroid(data.banner_ad_unit_id_android || "");
        setBannerIdIos(data.banner_ad_unit_id_ios || "");
        setInterstitialIdAndroid(data.interstitial_ad_unit_id_android || "");
        setInterstitialIdIos(data.interstitial_ad_unit_id_ios || "");
      } else {
        // Create default settings if none exist
        const { data: newData } = await supabase
          .from("ad_settings")
          .insert([{ banner_enabled: true, interstitial_enabled: true }])
          .select()
          .single();
        
        if (newData) {
          setSettingsId(newData.id);
          setBannerEnabled(newData.banner_enabled);
          setInterstitialEnabled(newData.interstitial_enabled);
        }
      }
    } catch (err) {
      console.error("Exception in fetchSettings:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (type: "banner" | "interstitial", value: boolean) => {
    // Optimistic update
    if (type === "banner") setBannerEnabled(value);
    else setInterstitialEnabled(value);

    try {
      const updateData = type === "banner" 
        ? { banner_enabled: value } 
        : { interstitial_enabled: value };

      const { error } = await supabase
        .from("ad_settings")
        .update(updateData)
        .eq("id", settingsId);

      if (error) throw error;
    } catch (err) {
      Alert.alert("Error", "Failed to update settings");
      // Revert
      if (type === "banner") setBannerEnabled(!value);
      else setInterstitialEnabled(!value);
    }
  };

  const saveIds = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("ad_settings")
        .update({
          admob_app_id_android: appIdAndroid,
          admob_app_id_ios: appIdIos,
          banner_ad_unit_id_android: bannerIdAndroid,
          banner_ad_unit_id_ios: bannerIdIos,
          interstitial_ad_unit_id_android: interstitialIdAndroid,
          interstitial_ad_unit_id_ios: interstitialIdIos,
        })
        .eq("id", settingsId);

      if (error) throw error;
      Alert.alert("Success", "Ad IDs updated successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to update Ad IDs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Ad Configuration</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.accent} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.content}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Toggles Section */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Banner Ads</Text>
              <Text style={styles.settingDescription}>
                Show banner ads at the bottom of screens
              </Text>
            </View>
            <Switch
              value={bannerEnabled}
              onValueChange={(val) => toggleSetting("banner", val)}
              trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
              thumbColor={"#FFFFFF"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Interstitial Ads</Text>
              <Text style={styles.settingDescription}>
                Show full-screen ads periodically
              </Text>
            </View>
            <Switch
              value={interstitialEnabled}
              onValueChange={(val) => toggleSetting("interstitial", val)}
              trackColor={{ false: Colors.light.border, true: Colors.light.accent }}
              thumbColor={"#FFFFFF"}
            />
          </View>

          <View style={styles.divider} />

          {/* IDs Section */}
          <Text style={styles.sectionHeader}>AdMob IDs (Android)</Text>
          
          <Text style={styles.inputLabel}>App ID</Text>
          <TextInput
            style={styles.input}
            value={appIdAndroid}
            onChangeText={setAppIdAndroid}
            placeholder="ca-app-pub-..."
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Banner Unit ID</Text>
          <TextInput
            style={styles.input}
            value={bannerIdAndroid}
            onChangeText={setBannerIdAndroid}
            placeholder="ca-app-pub-..."
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Interstitial Unit ID</Text>
          <TextInput
            style={styles.input}
            value={interstitialIdAndroid}
            onChangeText={setInterstitialIdAndroid}
            placeholder="ca-app-pub-..."
            placeholderTextColor="#999"
          />

          <Text style={styles.sectionHeader}>AdMob IDs (iOS)</Text>

          <Text style={styles.inputLabel}>App ID</Text>
          <TextInput
            style={styles.input}
            value={appIdIos}
            onChangeText={setAppIdIos}
            placeholder="ca-app-pub-..."
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Banner Unit ID</Text>
          <TextInput
            style={styles.input}
            value={bannerIdIos}
            onChangeText={setBannerIdIos}
            placeholder="ca-app-pub-..."
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Interstitial Unit ID</Text>
          <TextInput
            style={styles.input}
            value={interstitialIdIos}
            onChangeText={setInterstitialIdIos}
            placeholder="ca-app-pub-..."
            placeholderTextColor="#999"
          />

          <Pressable style={styles.saveButton} onPress={saveIds}>
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.accent,
    marginTop: 24,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: Colors.light.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
});
