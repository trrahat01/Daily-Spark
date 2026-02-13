import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import Papa from "papaparse";
import Colors from "@/constants/colors";
import { addQuotesBulk } from "@/lib/quote-storage";

export default function BulkUploadScreen() {
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState<
    { text: string; author: string; category: string }[] | null
  >(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setFileName(file.name);
      setError("");

      const response = await fetch(file.uri);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const valid = results.data
            .filter((row: any) => row.text && row.author && row.category)
            .map((row: any) => ({
              text: String(row.text).trim(),
              author: String(row.author).trim(),
              category: String(row.category).trim(),
            }));

          if (valid.length === 0) {
            setError(
              "No valid rows found. CSV must have columns: text, author, category"
            );
            setParsed(null);
            return;
          }
          setParsed(valid);
        },
        error: () => {
          setError("Failed to parse the CSV file.");
          setParsed(null);
        },
      });
    } catch {
      setError("Failed to open file.");
    }
  };

  const handleUpload = async () => {
    if (!parsed || parsed.length === 0) return;
    setUploading(true);
    try {
      const count = await addQuotesBulk(parsed);
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", `${count} quotes imported successfully!`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to import quotes.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={Colors.light.accent}
        />
        <Text style={styles.infoText}>
          Upload a CSV file with columns: text, author, category. Each row
          becomes a new quote.
        </Text>
      </View>

      <View style={styles.exampleCard}>
        <Text style={styles.exampleTitle}>CSV Format Example:</Text>
        <Text style={styles.exampleCode}>
          text,author,category{"\n"}
          "Be the change...",Gandhi,Wisdom{"\n"}
          "Just do it.",Nike,Motivation
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.pickButton,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={handlePickFile}
      >
        <Ionicons name="document-outline" size={22} color={Colors.light.navy} />
        <Text style={styles.pickButtonText}>
          {fileName || "Select CSV File"}
        </Text>
      </Pressable>

      {!!error && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={Colors.light.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {parsed && parsed.length > 0 && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>
            Preview ({parsed.length} quotes)
          </Text>
          {parsed.slice(0, 5).map((q, i) => (
            <View key={i} style={styles.previewItem}>
              <Text style={styles.previewQuote} numberOfLines={2}>
                "{q.text}"
              </Text>
              <Text style={styles.previewMeta}>
                {q.author} - {q.category}
              </Text>
            </View>
          ))}
          {parsed.length > 5 && (
            <Text style={styles.moreText}>
              ...and {parsed.length - 5} more
            </Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.uploadButton,
              { opacity: pressed || uploading ? 0.8 : 1 },
            ]}
            onPress={handleUpload}
            disabled={uploading}
          >
            <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>
              {uploading
                ? "Importing..."
                : `Import ${parsed.length} Quotes`}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.accentLight,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.accentDark,
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  exampleTitle: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  exampleCode: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  pickButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.light.navy,
    borderStyle: "dashed",
  },
  pickButtonText: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.navy,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    flex: 1,
  },
  previewContainer: {
    marginTop: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  previewItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  previewQuote: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.text,
    marginBottom: 4,
  },
  previewMeta: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  moreText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accent,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
});
