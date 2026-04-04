import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { askAI } from "@/api/ask";
import { ChatMessage, SourceNote } from "@/types/note";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";
import { formatShortDate } from "@/utils/formatDate";

const SUGGESTED = ["What did I talk about this week?", "Summarise yesterday", "What ideas have I mentioned recently?", "Any action items from last week?"];

export default function AskScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: q, created_at: new Date().toISOString() }]);
    setLoading(true);
    try {
      const res = await askAI(q);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: res.answer, sources: res.sources, created_at: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I couldn't answer that. Please try again.", created_at: new Date().toISOString() }]);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100); }, [messages]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Ask about your notes</Text>
            <Text style={styles.emptySubtitle}>I'll search through your voice notes and answer based only on what you've said.</Text>
            <View style={styles.suggestions}>{SUGGESTED.map((p, i) => <TouchableOpacity key={i} style={styles.suggestChip} onPress={() => send(p)}><Text style={styles.suggestText}>{p}</Text></TouchableOpacity>)}</View>
          </View>
        ) : (
          <FlatList ref={listRef} data={messages} keyExtractor={(m) => m.id} contentContainerStyle={styles.messageList}
            renderItem={({ item }) => {
              const isUser = item.role === "user";
              return (
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>{item.content}</Text>
                  {item.sources && item.sources.length > 0 && (
                    <View style={styles.sources}>
                      <Text style={styles.sourcesLabel}>Sources:</Text>
                      {item.sources.map((s: SourceNote, i: number) => (
                        <TouchableOpacity key={i} onPress={() => router.push(`/note/${s.note_id}`)} style={styles.sourceChip}>
                          <Text style={styles.sourceDate}>{formatShortDate(s.day_date)}</Text>
                          <Text style={styles.sourceSnippet} numberOfLines={1}>{s.snippet}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
        {loading && <View style={styles.thinking}><ActivityIndicator color={Colors.accent} size="small" /><Text style={styles.thinkingText}>Searching your notes...</Text></View>}
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Ask anything about your notes..." placeholderTextColor={Colors.textMuted} value={input} onChangeText={setInput} onSubmitEditing={() => send()} returnKeyType="send" multiline maxLength={500} />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} onPress={() => send()} disabled={!input.trim() || loading}>
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  empty: { flex: 1, padding: Spacing.xl, justifyContent: "center", gap: Spacing.lg },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary, textAlign: "center" },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  suggestions: { gap: Spacing.sm },
  suggestChip: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
  suggestText: { ...Typography.body, color: Colors.textSecondary },
  messageList: { padding: Spacing.md, gap: Spacing.sm },
  bubble: { maxWidth: "88%", borderRadius: Radius.lg, padding: Spacing.md, gap: 8 },
  userBubble: { backgroundColor: Colors.accent, alignSelf: "flex-end", borderBottomRightRadius: Radius.sm },
  aiBubble: { backgroundColor: Colors.surface, alignSelf: "flex-start", borderBottomLeftRadius: Radius.sm, borderWidth: 1, borderColor: Colors.surfaceBorder },
  bubbleText: { ...Typography.body, lineHeight: 22 },
  userText: { color: "#fff" },
  aiText: { color: Colors.textPrimary },
  sources: { gap: 6 },
  sourcesLabel: { ...Typography.label, color: Colors.textMuted, textTransform: "uppercase" },
  sourceChip: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, padding: 8, gap: 2 },
  sourceDate: { ...Typography.label, color: Colors.accent },
  sourceSnippet: { ...Typography.caption, color: Colors.textSecondary },
  thinking: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  thinkingText: { ...Typography.bodySmall, color: Colors.textMuted, fontStyle: "italic" },
  inputRow: { flexDirection: "row", gap: Spacing.sm, padding: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, alignItems: "flex-end" },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.textPrimary, ...Typography.body, borderWidth: 1, borderColor: Colors.surfaceBorder, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
