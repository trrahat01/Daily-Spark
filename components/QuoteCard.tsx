import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

interface QuoteCardProps {
  quote: {
    id: string;
    text: string;
    author: string;
    category: string;
    liked?: boolean;
    is_favorite?: boolean;
  };
  index: number;
  onToggleLike: (id: string) => void;
}

export default function QuoteCard({ quote, index, onToggleLike }: QuoteCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = () => {
    heartScale.value = withSpring(1.3, { damping: 4, stiffness: 300 }, () => {
      heartScale.value = withSpring(1, { damping: 6 });
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleLike(quote.id);
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: `"${quote.text}" - ${quote.author}\n\nShared via Daily Spark`,
      });
    } catch {}
  };

  const liked = quote.liked ?? quote.is_favorite ?? false;

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{quote.category}</Text>
      </View>

      <Text style={styles.quoteText}>{quote.text}</Text>

      <Text style={styles.authorText}>- {quote.author}</Text>

      <View style={styles.actions}>
        <Pressable onPress={handleLike} hitSlop={12}>
          <Animated.View style={heartAnimStyle}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={22}
              color={liked ? Colors.light.danger : Colors.light.textTertiary}
            />
          </Animated.View>
        </Pressable>

        <Pressable onPress={handleShare} hitSlop={12}>
          <Ionicons
            name="share-outline"
            size={22}
            color={Colors.light.textTertiary}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accentDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.light.text,
    fontFamily: "DMSans_400Regular",
    marginBottom: 12,
  },
  authorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_500Medium",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 14,
  },
});
