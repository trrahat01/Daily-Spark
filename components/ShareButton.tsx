import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Quote } from "@/data/quotes";
import { trackQuoteShared } from "@/services/analytics";

interface Props {
  quote: Quote;
  size?: number;
  onExtra?: (quote: Quote) => void;
}

export default function ShareButton({ quote, size = 22, onExtra }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 8 }, () => scale.value = withSpring(1, { damping: 6 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onExtra) {
      onExtra(quote);
      return;
    }
  };

  return (
    <Pressable onPress={handlePress} hitSlop={12} accessibilityRole="button" accessibilityLabel="Share quote">
      <Animated.View style={animatedStyle}>
        <Ionicons name="share-social-outline" size={size} color="#9AA0AC" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({});