import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getNoteById, updateNoteTitle, deleteNote } from "@/api/notes";
import { Note } from "@/types/note";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";
import { formatDate, formatTime, formatDuration } from "@/utils/formatDate";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    getNoteById(id).then((n) => { setNote(n); setTitleDraft(n.title ?? ""); }).catch(console.warn).finally(() => setLoading(false));
  }, [id]);

  const handleSaveTitle = async () => {
    if (!note || !titleDraft.trim()) return;
    try { setNote(await updateNoteTitle(note.id, titleDraft.trim())); setEditingTitle(false); }
    catch { Alert.alert("Error", "Could not update title."); }
  };

  const handleDelete = () =>
    Alert.alert("Delete note", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await deleteNote(note!.id); router.back(); } catch { Alert.alert("Error", "Could not delete note."); } } },
    ]);

  if (loading) return <SafeAreaView style={styles.container} edges={["bottom"]}><ActivityIndicator color={Colors.accent} style={styles.loader} /></SafeAreaView>;
  if (!note) return <SafeAreaView style={styles.container} edges={["bottom"]}><Text style={styles.errorText}>Note not found.</Text></SafeAreaView>;

  const transcript = note.transcript ?? "";
  const PREVIEW_LEN = 400;
  const isLong = transcript.length > PREVIEW_LEN;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: note.title ?? "Note", headerRight: () => <TouchableOpacity onPress={handleDelete} style={{ marginRight: 4 }}><Text style={{ color: Colors.error, fontWeight: "600" }}>Delete</Text></TouchableOpacity> }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleSection}>
          {editingTitle ? (
            <View style={styles.titleEditRow}>
              <TextInput style={styles.titleInput} value={titleDraft} onChangeText={setTitleDraft} autoFocus returnKeyType="done" onSubmitEditing={handleSaveTitle} />
              <TouchableOpacity onPress={handleSaveTitle} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingTitle(false)}><Text style={{ color: Colors.textMuted }}>Cancel</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingTitle(true)}><Text style={styles.title}>{note.title ?? "Untitled"}</Text></TouchableOpacity>
          )}
          <Text style={styles.meta}>
            {formatDate(note.recorded_at)} · {formatTime(note.recorded_at)}
            {note.duration_seconds ? `  ·  ${formatDuration(note.duration_seconds)}` : ""}
          </Text>
        </View>
        {note.tags && note.tags.length > 0 && (
          <View style={styles.tags}>{note.tags.map((t) => <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>)}</View>
        )}
        <AudioPlayer audioUrl={`${BASE_URL}${note.audio_url}`} duration={note.duration_seconds} />
        {note.summary && (
          <View style={styles.card}><Text style={styles.cardLabel}>Summary</Text><Text style={styles.cardBody}>{note.summary}</Text></View>
        )}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Transcript{note.transcription_status !== "done" && <Text style={{ color: Colors.warning }}> ({note.transcription_status})</Text>}</Text>
          {transcript ? (
            <>
              <Text style={styles.cardBody}>{isLong && !expanded ? transcript.slice(0, PREVIEW_LEN) + "…" : transcript}</Text>
              {isLong && <TouchableOpacity onPress={() => setExpanded((v) => !v)}><Text style={styles.showMore}>{expanded ? "Show less" : "Show full transcript"}</Text></TouchableOpacity>}
            </>
          ) : (
            <Text style={styles.noTranscript}>{note.transcription_status === "failed" ? "Transcription failed." : "Transcription pending."}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.lg },
  titleSection: { gap: 4 },
  titleEditRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  titleInput: { flex: 1, ...Typography.h2, color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.accent, paddingVertical: 4 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  meta: { ...Typography.bodySmall, color: Colors.textMuted },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: Colors.tagBackground, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  tagText: { ...Typography.bodySmall, color: Colors.tagText },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 8 },
  cardLabel: { ...Typography.label, color: Colors.accent, textTransform: "uppercase" },
  cardBody: { ...Typography.body, color: Colors.textPrimary, lineHeight: 24 },
  showMore: { ...Typography.bodySmall, color: Colors.accent, marginTop: 4 },
  noTranscript: { ...Typography.body, color: Colors.textMuted, fontStyle: "italic" },
  errorText: { ...Typography.body, color: Colors.error, textAlign: "center", padding: Spacing.xl },
});
