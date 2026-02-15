import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getQuotes, deleteQuote } from "@/lib/quote-storage";

export default function ManageQuotesScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: getQuotes,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["quotes"] });
    setRefreshing(false);
  }, [queryClient]);

  const handleDelete = (quote: { id: string; author: string }) => {
    Alert.alert(
      "Delete Quote",
      `Are you sure you want to delete this quote by ${quote.author}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteQuote(quote.id);
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]
    );
  };

  const handleEdit = (quote: { id: string }) => {
    router.push({
      pathname: "/admin/edit-quote",
      params: { id: quote.id },
    } as any);
  };

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
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.quoteItem}>
            <View style={styles.quoteContent}>
              <Text style={styles.quoteText} numberOfLines={2}>
                {item.text}
              </Text>
              <Text style={styles.quoteMeta}>
                {item.author} - {item.category}
              </Text>
            </View>
            <View style={styles.quoteActions}>
              <Pressable
                onPress={() => handleEdit(item)}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={Colors.light.accent}
                />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={Colors.light.danger}
                />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyTitle}>No quotes yet</Text>
            <Text style={styles.emptyText}>
              Add quotes from the admin panel
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  quoteItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  quoteContent: {
    flex: 1,
    marginRight: 12,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  quoteMeta: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  quoteActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
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
  },
});
