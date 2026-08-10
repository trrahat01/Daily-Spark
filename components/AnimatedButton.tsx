import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export default function AnimatedButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  haptic,
  style,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (disabled) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scale.value = withSpring(0.96, { damping: 12, stiffness: 250 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 220 });
    });
    onPress();
  };

  const primary = variant === "primary";
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: primary ? c.accent : "transparent", borderColor: primary ? c.accent : c.border },
          primary && {}, pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={[styles.label, { color: primary ? "#fff" : c.textSecondary }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  label: { fontSize: 16, fontFamily: "DMSans_700Bold" },
});