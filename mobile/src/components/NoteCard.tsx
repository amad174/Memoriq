import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { NoteListItem } from "@/types/note";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";
import { formatTime, formatDuration } from "@/utils/formatDate";

interface Props {
  note: NoteListItem;
  showDate?: boolean;
}

export function NoteCard({ note, showDate }: Props) {
  const statusColor: Record<string, string> = {
    done: Colors.success,
    processing: Colors.warning,
    pending: Colors.textMuted,
    failed: Colors.error,
  };

  return (
    <TouchableOpacity
      testID={`note-card-${note.id}`}
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/note/${note.id}`)}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title ?? "Untitled note"}
        </Text>
        <Text style={styles.time}>
          {showDate ? note.day_date : formatTime(note.recorded_at)}
          {note.duration_seconds ? `  ·  ${formatDuration(note.duration_seconds)}` : ""}
        </Text>
      </View>

      {note.summary ? (
        <Text style={styles.summary} numberOfLines={2}>{note.summary}</Text>
      ) : note.transcription_status !== "done" ? (
        <Text style={[styles.status, { color: statusColor[note.transcription_status] ?? Colors.textMuted }]}>
          {note.transcription_status === "processing"
            ? "Transcribing..."
            : note.transcription_status === "failed"
            ? "Transcription failed"
            : "Pending transcription"}
        </Text>
      ) : null}

      {note.tags && note.tags.length > 0 && (
        <View style={styles.tags}>
          {note.tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 6,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  title: { ...Typography.body, color: Colors.textPrimary, fontWeight: "600", flex: 1 },
  time: { ...Typography.caption, color: Colors.textMuted, flexShrink: 0 },
  summary: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
  status: { ...Typography.bodySmall, fontStyle: "italic" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  tag: { backgroundColor: Colors.tagBackground, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  tagText: { ...Typography.caption, color: Colors.tagText },
});
