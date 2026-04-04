import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDayDetail } from "@/api/calendar";
import { getDailySummary, generateDailySummary } from "@/api/summaries";
import { DayDetailResponse, DailySummary } from "@/types/calendar";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { NoteCard } from "@/components/NoteCard";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";
import { formatDate } from "@/utils/formatDate";

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const [detail, setDetail] = useState<DayDetailResponse | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!date) return;
    Promise.all([getDayDetail(date), getDailySummary(date)])
      .then(([d, s]) => { setDetail(d); setSummary(s); })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [date]);

  const handleGenerate = async () => {
    if (!date) return;
    setGenerating(true);
    try { setSummary(await generateDailySummary(date)); }
    catch { Alert.alert("Error", "Could not generate summary."); }
    finally { setGenerating(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: date ? formatDate(date) : "Day" }} />
      {loading ? <ActivityIndicator color={Colors.accent} style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>{date ? formatDate(date) : ""}</Text>
          <DailySummaryCard summary={summary} isLoading={generating} />
          {!summary && !generating && (detail?.notes?.length ?? 0) > 0 && (
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
              <Text style={styles.generateBtnText}>Generate Summary</Text>
            </TouchableOpacity>
          )}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{detail?.notes?.length ?? 0} {detail?.notes?.length === 1 ? "note" : "notes"}</Text>
            {detail?.notes?.map((n) => <NoteCard key={n.id} note={n} />)}
            {(detail?.notes?.length ?? 0) === 0 && <Text style={styles.empty}>No notes on this day.</Text>}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.lg },
  heading: { ...Typography.h1, color: Colors.textPrimary },
  generateBtn: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.surfaceBorder },
  generateBtnText: { color: Colors.accent, fontWeight: "600" },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  empty: { ...Typography.body, color: Colors.textMuted, fontStyle: "italic" },
});
