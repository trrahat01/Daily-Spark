import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
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
import { ThemeColors } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";
import QuoteShareModal from "./QuoteShareModal";

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
  onHide?: (id: string) => void;
}

export default function QuoteCard({ quote, index, onToggleLike, onHide }: QuoteCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const heartScale = useSharedValue(1);
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = makeStyles(c);

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const [shareVisible, setShareVisible] = useState(false);

  const handleLike = () => {
    heartScale.value = withSpring(1.3, { damping: 4, stiffness: 300 }, () => {
      heartScale.value = withSpring(1, { damping: 6 });
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleLike(quote.id);
  };

  const handleShare = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShareVisible(true);
  };

  const handleHide = () => {
    if (Platform.OS === "web") {
      onHide?.(quote.id);
      return;
    }
    Alert.alert(
      "Hide this quote?",
      "It will be removed from your feed only. Other users will still see it.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Hide", style: "destructive", onPress: () => onHide?.(quote.id) },
      ]
    );
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
              color={liked ? c.error : c.textTertiary}
            />
          </Animated.View>
        </Pressable>

        <Pressable onPress={handleShare} hitSlop={12}>
          <Ionicons
            name="share-outline"
            size={22}
            color={c.textTertiary}
          />
        </Pressable>

        {onHide ? (
          <Pressable onPress={handleHide} hitSlop={12}>
            <Ionicons
              name="eye-off-outline"
              size={22}
              color={c.textTertiary}
            />
          </Pressable>
        ) : null}
      </View>

      <QuoteShareModal
        visible={shareVisible}
        quote={quote}
        onClose={() => setShareVisible(false)}
      />
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: c.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    color: c.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 26,
    color: c.textPrimary,
    fontFamily: "DMSans_400Regular",
    marginBottom: 12,
  },
  authorText: {
    fontSize: 14,
    color: c.textSecondary,
    fontFamily: "DMSans_500Medium",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 14,
  },
});
