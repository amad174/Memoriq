import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthContext";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () =>
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.rowLabel}>Email</Text><Text style={styles.rowValue}>{user?.email}</Text></View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App</Text>
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.rowLabel}>Dark mode</Text><Switch value trackColor={{ true: Colors.accent }} disabled /></View>
            <View style={[styles.row, styles.rowDivider]}><Text style={styles.rowLabel}>Version</Text><Text style={styles.rowValue}>1.0.0</Text></View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Privacy</Text>
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.rowLabel}>Your notes are private</Text><Text style={styles.rowValue}>🔒</Text></View>
            <View style={[styles.row, styles.rowDivider]}><Text style={styles.rowLabel}>Data stored securely on server</Text></View>
          </View>
        </View>
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
            <Text style={styles.dangerBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>Memoriq · Your voice, remembered.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionLabel: { ...Typography.label, color: Colors.textMuted, textTransform: "uppercase", paddingLeft: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.md },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  rowLabel: { ...Typography.body, color: Colors.textPrimary },
  rowValue: { ...Typography.body, color: Colors.textSecondary },
  dangerBtn: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.error },
  dangerBtnText: { color: Colors.error, fontWeight: "600", ...Typography.body },
  footer: { ...Typography.caption, color: Colors.textMuted, textAlign: "center", paddingTop: Spacing.sm },
});
