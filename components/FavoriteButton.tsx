import React from "react";
import { Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface Props {
  active: boolean;
  onPress: (id: string) => void;
  quoteId: string;
  size?: number;
  haptic?: boolean;
  accessibilityLabel?: string;
}

export default function FavoriteButton({ active, onPress, quoteId, size = 22, haptic, accessibilityLabel }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(1.35, { damping: 4, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 6 });
    });
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(quoteId);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={12} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? "Favorite"}>
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={active ? "heart" : "heart-outline"}
          size={size}
          color={active ? "#E0536F" : "#9AA0AC"}
        />
      </Animated.View>
    </Pressable>
  );
}