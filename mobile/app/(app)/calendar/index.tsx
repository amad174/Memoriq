import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMonth } from "@/api/calendar";
import { MonthCalendarResponse, DayEntry } from "@/types/calendar";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function firstDayOffset(y: number, m: number) { const d = new Date(y, m - 1, 1).getDay(); return d === 0 ? 6 : d - 1; }

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthCalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const notesByDate: Record<string, DayEntry> = {};
  data?.days.forEach((d) => { notesByDate[d.date] = d; });

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getMonth(year, month)); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prev = () => month === 1 ? (setMonth(12), setYear((y) => y - 1)) : setMonth((m) => m - 1);
  const next = () => month === 12 ? (setMonth(1), setYear((y) => y + 1)) : setMonth((m) => m + 1);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const cells: (number | null)[] = [...Array(firstDayOffset(year, month)).fill(null), ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={prev} style={styles.navBtn}><Text style={styles.arrow}>‹</Text></TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[month - 1]} {year}</Text>
          <TouchableOpacity onPress={next} style={styles.navBtn}><Text style={styles.arrow}>›</Text></TouchableOpacity>
        </View>
        <View style={styles.weekRow}>{DAYS.map((d) => <Text key={d} style={styles.dayHeader}>{d}</Text>)}</View>
        {loading ? <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} /> : (
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`e${i}`} style={styles.cell} />;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const entry = notesByDate[dateStr];
              const isToday = dateStr === todayStr;
              return (
                <TouchableOpacity key={dateStr} style={[styles.cell, isToday && styles.todayCell]} onPress={() => router.push(`/(app)/calendar/day/${dateStr}`)} activeOpacity={0.7}>
                  <Text style={[styles.dayNum, isToday && styles.todayNum]}>{day}</Text>
                  {entry && <View style={styles.dotRow}>{Array.from({ length: Math.min(entry.note_count, 3) }).map((_, di) => <View key={di} style={styles.dot} />)}</View>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {data?.days && data.days.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.listTitle}>Notes this month</Text>
            {data.days.map((e) => (
              <TouchableOpacity key={e.date} style={styles.dayRow} onPress={() => router.push(`/(app)/calendar/day/${e.date}`)} activeOpacity={0.8}>
                <View style={styles.dayRowTop}>
                  <Text style={styles.dayRowDate}>{e.date}</Text>
                  <Text style={styles.dayRowCount}>{e.note_count} {e.note_count === 1 ? "note" : "notes"}</Text>
                </View>
                {e.preview && <Text style={styles.dayRowPreview} numberOfLines={1}>{e.preview}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL = 46;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.lg },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.sm },
  navBtn: { padding: Spacing.sm },
  arrow: { fontSize: 28, color: Colors.textPrimary },
  monthTitle: { ...Typography.h2, color: Colors.textPrimary },
  weekRow: { flexDirection: "row", justifyContent: "space-around", paddingBottom: 4 },
  dayHeader: { ...Typography.label, color: Colors.textMuted, width: CELL, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cell: { width: CELL, height: CELL, alignItems: "center", justifyContent: "center", borderRadius: Radius.sm, gap: 2 },
  todayCell: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.accent },
  dayNum: { ...Typography.body, color: Colors.textPrimary },
  todayNum: { color: Colors.accent, fontWeight: "700" },
  dotRow: { flexDirection: "row", gap: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accent },
  list: { gap: Spacing.sm },
  listTitle: { ...Typography.h3, color: Colors.textPrimary },
  dayRow: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 4 },
  dayRowTop: { flexDirection: "row", justifyContent: "space-between" },
  dayRowDate: { ...Typography.body, color: Colors.textPrimary, fontWeight: "600" },
  dayRowCount: { ...Typography.bodySmall, color: Colors.accent },
  dayRowPreview: { ...Typography.bodySmall, color: Colors.textSecondary },
});
