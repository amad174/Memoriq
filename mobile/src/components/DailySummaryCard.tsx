import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DailySummary } from "@/types/calendar";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";

interface Props {
  summary: DailySummary | null;
  isLoading?: boolean;
}

export function DailySummaryCard({ summary, isLoading }: Props) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.placeholder}>Generating daily summary...</Text>
      </View>
    );
  }
  if (!summary?.summary) {
    return (
      <View style={styles.card}>
        <Text style={styles.placeholder}>No summary yet.</Text>
      </View>
    );
  }
  return (
    <View style={styles.card} testID="daily-summary-card">
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Daily Summary</Text>
        {summary.mood && (
          <View style={styles.moodBadge}><Text style={styles.moodText}>{summary.mood}</Text></View>
        )}
      </View>
      <Text style={styles.summaryText}>{summary.summary}</Text>
      {summary.key_topics && summary.key_topics.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Key topics</Text>
          <View style={styles.tags}>
            {summary.key_topics.map((t) => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        </View>
      )}
      {summary.action_items && summary.action_items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Action items</Text>
          {summary.action_items.map((item, i) => (
            <Text key={i} style={styles.actionItem}>· {item}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLabel: { ...Typography.label, color: Colors.accent, textTransform: "uppercase" },
  moodBadge: { backgroundColor: Colors.tagBackground, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  moodText: { ...Typography.caption, color: Colors.textSecondary, textTransform: "capitalize" },
  summaryText: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
  placeholder: { ...Typography.body, color: Colors.textMuted, fontStyle: "italic" },
  section: { gap: 6, marginTop: 4 },
  sectionLabel: { ...Typography.label, color: Colors.textMuted, textTransform: "uppercase" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: Colors.tagBackground, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  tagText: { ...Typography.bodySmall, color: Colors.textSecondary },
  actionItem: { ...Typography.bodySmall, color: Colors.textSecondary },
});
