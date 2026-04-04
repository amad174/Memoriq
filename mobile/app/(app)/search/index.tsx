import React, { useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { search } from "@/api/search";
import { SearchResult } from "@/types/note";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";
import { formatShortDate, formatTime } from "@/utils/formatDate";

const SUGGESTED = ["work", "gym", "ideas", "stress", "goals", "family"];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"keyword" | "semantic">("keyword");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    if (q) setQuery(q);
    setLoading(true); setSearched(true);
    try { setResults(await search(term, mode)); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, [query, mode]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.bar}>
        <TextInput style={styles.input} placeholder="Search your notes..." placeholderTextColor={Colors.textMuted} value={query} onChangeText={setQuery} onSubmitEditing={() => handleSearch()} returnKeyType="search" autoCapitalize="none" />
        <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}><Text style={styles.searchBtnText}>Search</Text></TouchableOpacity>
      </View>
      <View style={styles.modeRow}>
        {(["keyword", "semantic"] as const).map((m) => (
          <TouchableOpacity key={m} style={[styles.modeBtn, mode === m && styles.modeBtnActive]} onPress={() => setMode(m)}>
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>{m === "keyword" ? "Keyword" : "Smart search"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!searched && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestLabel}>Suggested</Text>
          <View style={styles.suggestRow}>{SUGGESTED.map((s) => <TouchableOpacity key={s} style={styles.chip} onPress={() => handleSearch(s)}><Text style={styles.chipText}>{s}</Text></TouchableOpacity>)}</View>
        </View>
      )}
      {loading ? <ActivityIndicator color={Colors.accent} style={styles.loader} /> : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={searched ? <Text style={styles.empty}>No notes found for "{query}".</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push(`/note/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title ?? "Untitled"}</Text>
                <Text style={styles.cardDate}>{formatShortDate(item.day_date)} · {formatTime(item.recorded_at)}</Text>
              </View>
              <Text style={styles.snippet} numberOfLines={3}>{item.snippet}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: "row", gap: Spacing.sm, padding: Spacing.md, paddingBottom: 0 },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.textPrimary, ...Typography.body, borderWidth: 1, borderColor: Colors.surfaceBorder },
  searchBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingHorizontal: Spacing.md, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontWeight: "600" },
  modeRow: { flexDirection: "row", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  modeBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.surfaceBorder },
  modeBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modeBtnText: { ...Typography.label, color: Colors.textMuted },
  modeBtnTextActive: { color: "#fff" },
  suggestions: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  suggestLabel: { ...Typography.label, color: Colors.textMuted, textTransform: "uppercase" },
  suggestRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.surfaceBorder },
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  loader: { flex: 1 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { ...Typography.body, color: Colors.textPrimary, fontWeight: "600", flex: 1 },
  cardDate: { ...Typography.caption, color: Colors.textMuted, flexShrink: 0 },
  snippet: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
  empty: { ...Typography.body, color: Colors.textMuted, textAlign: "center", paddingTop: Spacing.xl, fontStyle: "italic" },
});
