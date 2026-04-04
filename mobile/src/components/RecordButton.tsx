import React, { useEffect, useRef } from "react";
import { TouchableOpacity, View, StyleSheet, Animated, ActivityIndicator, Text } from "react-native";
import { Colors, Radius } from "@/constants/theme";

interface Props {
  isRecording: boolean;
  isUploading?: boolean;
  onPress: () => void;
  durationMs?: number;
}

export function RecordButton({ isRecording, isUploading, onPress, durationMs = 0 }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isRecording, pulseAnim]);

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  if (isUploading) {
    return (
      <View style={styles.container}>
        <View style={[styles.button, styles.uploading]}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
        <Text style={styles.label}>Saving note...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          testID="record-button"
          onPress={onPress}
          activeOpacity={0.85}
          style={[styles.button, isRecording && styles.recording]}
        >
          <View style={isRecording ? styles.stopIcon : styles.micIcon} />
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.label}>{isRecording ? fmt(durationMs) : "Tap to record"}</Text>
    </View>
  );
}

const SIZE = 88;
const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 12 },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  recording: { backgroundColor: Colors.recordRed, shadowColor: Colors.recordRed },
  uploading: { backgroundColor: Colors.surfaceElevated, shadowOpacity: 0 },
  micIcon: { width: 22, height: 32, borderRadius: 11, backgroundColor: "#fff" },
  stopIcon: { width: 24, height: 24, borderRadius: Radius.sm, backgroundColor: "#fff" },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: "500" },
});
