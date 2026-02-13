import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { isAdminLoggedIn, setAdminLoggedIn } from "@/lib/quote-storage";
import { ADMIN_PIN } from "@/lib/data";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const shakeX = useSharedValue(0);
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    isAdminLoggedIn().then((val) => {
      setLoggedIn(val);
      setLoading(false);
    });
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleLogin = async () => {
    if (pin === ADMIN_PIN) {
      await setAdminLoggedIn(true);
      setLoggedIn(true);
      setPin("");
      setError("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setError("Incorrect PIN. Try 1234.");
      shakeX.value = withSpring(10, { damping: 2, stiffness: 500 }, () => {
        shakeX.value = withSpring(0, { damping: 6 });
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleLogout = async () => {
    await setAdminLoggedIn(false);
    setLoggedIn(false);
    setPin("");
  };

  const navigateTo = (path: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(path as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  if (!loggedIn) {
    return (
      <View style={styles.container}>
        <View
          style={[styles.loginContainer, { paddingTop: insets.top + webTopInset + 40 }]}
        >
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={40} color={Colors.light.accent} />
          </View>
          <Text style={styles.loginTitle}>Admin Access</Text>
          <Text style={styles.loginSubtitle}>
            Enter your PIN to manage quotes
          </Text>

          <Animated.View style={[styles.pinInputContainer, shakeStyle]}>
            <TextInput
              style={styles.pinInput}
              placeholder="Enter PIN"
              placeholderTextColor={Colors.light.textTertiary}
              secureTextEntry
              keyboardType="number-pad"
              value={pin}
              onChangeText={(t) => {
                setPin(t);
                setError("");
              }}
              maxLength={10}
            />
          </Animated.View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const menuItems = [
    {
      icon: "add-circle-outline" as const,
      title: "Add Quote",
      subtitle: "Add a new motivational quote",
      path: "/admin/add-quote",
    },
    {
      icon: "cloud-upload-outline" as const,
      title: "Bulk Upload",
      subtitle: "Import quotes from CSV file",
      path: "/admin/bulk-upload",
    },
    {
      icon: "list-outline" as const,
      title: "Manage Quotes",
      subtitle: "Edit or delete existing quotes",
      path: "/admin/manage-quotes",
    },
    {
      icon: "pricetags-outline" as const,
      title: "Categories",
      subtitle: "Manage quote categories",
      path: "/admin/categories",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Pressable onPress={handleLogout} hitSlop={12}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={Colors.light.danger}
            />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>Manage your Daily Spark content</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.path}
            style={({ pressed }) => [
              styles.menuItem,
              index === menuItems.length - 1 && { borderBottomWidth: 0 },
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => navigateTo(item.path)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons
                name={item.icon}
                size={22}
                color={Colors.light.accent}
              />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loginContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 26,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  pinInputContainer: {
    width: "100%",
  },
  pinInput: {
    width: "100%",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    letterSpacing: 8,
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 10,
  },
  loginButton: {
    width: "100%",
    backgroundColor: Colors.light.navy,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
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
});
