import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { getQuotes, getCategories, toggleLike, hideQuote } from "@/lib/quote-storage";
import QuoteCard from "@/components/QuoteCard";
import QuoteShareModal from "@/components/QuoteShareModal";
import AdBanner from "@/components/AdBanner";
import { trackInterstitialCheckpoint } from "@/lib/ads";
import { useLanguage } from "@/lib/language-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [shareQotd, setShareQotd] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes", language],
    queryFn: () => getQuotes(language),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Hides a quote from THIS user's feed only. It remains in the database for
  // every other user.
  const hideMutation = useMutation({
    mutationFn: hideQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const filteredQuotes =
    selectedCategory === "All"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["quotes"] });
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    setRefreshing(false);
  }, [queryClient]);

  const allCategories = useMemo(() => ["All", ...categories], [categories]);

  const quoteOfTheDay = useMemo(() => {
    if (quotes.length === 0) return null;

    const today = new Date();
    const seed = Number(
      `${today.getUTCFullYear()}${today.getUTCMonth() + 1}${today.getUTCDate()}`
    );

    return quotes[seed % quotes.length];
  }, [quotes]);

  const handleShareQuoteOfTheDay = useCallback(() => {
    if (!quoteOfTheDay) return;
    setShareQotd(true);
  }, [quoteOfTheDay]);

  const handleSurpriseMe = useCallback(() => {
    const pool = allCategories.filter(Boolean);
    if (pool.length === 0) return;

    const nextCategory = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCategory(nextCategory);
    trackInterstitialCheckpoint();
  }, [allCategories]);

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={[Colors.light.navy, Colors.light.navyLight, "transparent"]}
        style={[styles.heroGradient, { paddingTop: insets.top + webTopInset + 16 }]}
      >
        <Text style={styles.heroTitle}>Daily Spark</Text>
        <Text style={styles.heroSubtitle}>
          Find the inspiration you need today
        </Text>
      </LinearGradient>

      {quoteOfTheDay && (
        <View style={styles.dailyCard}>
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyLabel}>Quote of the Day</Text>
            <Pressable style={styles.dailyShare} onPress={handleShareQuoteOfTheDay}>
              <Ionicons name="share-social-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.dailyShareText}>Share</Text>
            </Pressable>
          </View>
          <Text style={styles.dailyText} numberOfLines={3}>
            &quot;{quoteOfTheDay.text}&quot;
          </Text>
          <Text style={styles.dailyAuthor}>- {quoteOfTheDay.author}</Text>
        </View>
      )}

      <FlatList
        data={allCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setSelectedCategory(item);
              trackInterstitialCheckpoint();
            }}
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item && styles.categoryChipTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === "All" ? "All Quotes" : selectedCategory}
        </Text>
        <Text style={styles.sectionCount}>{filteredQuotes.length} quotes</Text>
      </View>

      <Pressable style={styles.surpriseButton} onPress={handleSurpriseMe}>
        <Ionicons name="shuffle-outline" size={16} color={Colors.light.accent} />
        <Text style={styles.surpriseButtonText}>Surprise Me</Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <QuoteCard
            quote={item}
            index={index}
            onToggleLike={(id) => likeMutation.mutate(id)}
            onHide={(id) => hideMutation.mutate(id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No quotes found</Text>
            <Text style={styles.emptyText}>
              Try selecting a different category
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      <AdBanner />
      <QuoteShareModal
        visible={shareQotd}
        quote={quoteOfTheDay}
        onClose={() => setShareQotd(false)}
      />
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
  heroGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: "DMSans_700Bold",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  dailyCard: {
    marginHorizontal: 20,
    marginTop: 2,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dailyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dailyLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dailyShare: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dailyShareText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  dailyText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.text,
  },
  dailyAuthor: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.navy,
    borderColor: Colors.light.navy,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
  },
  surpriseButton: {
    marginHorizontal: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    paddingVertical: 10,
  },
  surpriseButtonText: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
