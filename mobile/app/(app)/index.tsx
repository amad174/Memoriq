import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { RecordButton } from "@/components/RecordButton";
import { NoteCard } from "@/components/NoteCard";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { getNotes, uploadNote } from "@/api/notes";
import { getDailySummary } from "@/api/summaries";
import { NoteListItem } from "@/types/note";
import { DailySummary } from "@/types/calendar";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { toISODate, formatDate } from "@/utils/formatDate";

export default function HomeScreen() {
  const recorder = useVoiceRecorder();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const today = toISODate(new Date());

  const loadData = useCallback(async () => {
    try {
      const [notesData, summaryData] = await Promise.all([getNotes(10), getDailySummary(today)]);
      setNotes(notesData);
      setTodaySummary(summaryData);
    } catch (e) { console.warn(e); }
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRecordPress = async () => {
    if (recorder.state === "idle") {
      await recorder.startRecording();
    } else if (recorder.state === "recording") {
      const uri = await recorder.stopRecording();
      if (!uri) { Alert.alert("Error", "Recording failed."); return; }
      setIsUploading(true);
      try {
        await uploadNote(uri, recorder.durationMs / 1000, new Date());
        recorder.resetRecording();
        await loadData();
      } catch { Alert.alert("Error", "Could not save note."); }
      finally { setIsUploading(false); }
    }
  };

  const todayNotes = notes.filter((n) => n.day_date === today);
  const recentNotes = notes.filter((n) => n.day_date !== today);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} tintColor={Colors.accent} />}>
        <View style={styles.recordSection}>
          <RecordButton isRecording={recorder.state === "recording"} isUploading={isUploading} onPress={handleRecordPress} durationMs={recorder.durationMs} />
          {recorder.error && <Text style={styles.error}>{recorder.error}</Text>}
        </View>

        {todaySummary?.summary && (
          <TouchableOpacity style={styles.summaryCard} onPress={() => router.push(`/(app)/calendar/day/${today}`)} activeOpacity={0.8}>
            <Text style={styles.summaryLabel}>Today · {formatDate(today)}</Text>
            <Text style={styles.summaryText} numberOfLines={3}>{todaySummary.summary}</Text>
            {todaySummary.mood && <Text style={styles.mood}>{todaySummary.mood}</Text>}
          </TouchableOpacity>
        )}

        {todayNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today</Text>
              <TouchableOpacity onPress={() => router.push(`/(app)/calendar/day/${today}`)}><Text style={styles.sectionLink}>See all</Text></TouchableOpacity>
            </View>
            {todayNotes.slice(0, 3).map((n) => <NoteCard key={n.id} note={n} />)}
          </View>
        )}

        {recentNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {recentNotes.slice(0, 5).map((n) => <NoteCard key={n.id} note={n} showDate />)}
          </View>
        )}

        {notes.length === 0 && !isUploading && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyBody}>Tap the button above to record your first voice note.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.lg },
  recordSection: { alignItems: "center", paddingVertical: Spacing.xl },
  error: { color: Colors.error, fontSize: 13, marginTop: Spacing.sm },
  summaryCard: { backgroundColor: Colors.surfaceElevated, borderRadius: 16, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 6 },
  summaryLabel: { fontSize: 12, fontWeight: "600", color: Colors.accent, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryText: { ...Typography.body, color: Colors.textPrimary },
  mood: { fontSize: 11, color: Colors.textMuted, textTransform: "capitalize" },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  sectionLink: { ...Typography.bodySmall, color: Colors.accent },
  empty: { alignItems: "center", paddingTop: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptyBody: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: "center", paddingHorizontal: Spacing.xl },
});
