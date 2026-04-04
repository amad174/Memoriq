import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";
import { formatDuration } from "@/utils/formatDate";

interface Props {
  audioUrl: string;
  duration?: number | null;
}

export function AudioPlayer({ audioUrl, duration }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState((duration ?? 0) * 1000);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => () => { soundRef.current?.unloadAsync(); }, []);

  const togglePlayback = async () => {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) await soundRef.current.pauseAsync();
        else await soundRef.current.playAsync();
        return;
      }
    }
    setIsLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (s: AVPlaybackStatus) => {
          if (s.isLoaded) {
            setPositionMs(s.positionMillis);
            if (s.durationMillis) setDurationMs(s.durationMillis);
            setIsPlaying(s.isPlaying);
            if (s.didJustFinish) { setIsPlaying(false); setPositionMs(0); }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      console.warn("Audio load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayback} style={styles.playBtn} disabled={isLoading} testID="audio-play-btn">
        <Text style={styles.playIcon}>{isLoading ? "⏳" : isPlaying ? "⏸" : "▶"}</Text>
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatDuration(positionMs / 1000)}</Text>
          {durationMs > 0 && <Text style={styles.timeText}>{formatDuration(durationMs / 1000)}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, gap: Spacing.sm },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  playIcon: { fontSize: 16, color: "#fff" },
  progressContainer: { flex: 1, gap: 4 },
  progressBar: { height: 4, backgroundColor: Colors.surfaceBorder, borderRadius: Radius.full, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.accent, borderRadius: Radius.full },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  timeText: { ...Typography.caption, color: Colors.textMuted },
});
