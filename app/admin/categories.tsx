import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getCategories, addCategory, deleteCategory } from "@/lib/quote-storage";

export default function CategoriesScreen() {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState("");

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const handleAdd = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.includes(name)) {
      Alert.alert("Duplicate", "This category already exists.");
      return;
    }
    await addCategory(name);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    setNewCategory("");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDelete = (name: string) => {
    Alert.alert("Delete Category", `Remove "${name}" category?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCategory(name);
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="New category name..."
          placeholderTextColor={Colors.light.textTertiary}
          value={newCategory}
          onChangeText={setNewCategory}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleAdd}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <View style={styles.categoryDot} />
            <Text style={styles.categoryName}>{item}</Text>
            <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
              <Ionicons
                name="close-circle-outline"
                size={22}
                color={Colors.light.danger}
              />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No categories added yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  addRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.text,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.accent,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
});
