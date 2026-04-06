import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";

// Whisper-compatible recording preset: AAC in .m4a container
const WHISPER_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

export type RecordingState = "idle" | "recording" | "stopped";

export interface UseVoiceRecorderResult {
  state: RecordingState;
  uri: string | null;
  durationMs: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  resetRecording: () => void;
  error: string | null;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecordingState>("idle");
  const [uri, setUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Microphone permission denied.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(WHISPER_RECORDING_OPTIONS);
      await recording.startAsync();
      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setDurationMs(Date.now() - startTimeRef.current), 200);
      setState("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start recording");
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const fileUri = recordingRef.current.getURI();
      recordingRef.current = null;
      setUri(fileUri ?? null);
      setState("stopped");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      return fileUri ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop recording");
      return null;
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    recordingRef.current = null;
    setUri(null);
    setDurationMs(0);
    setState("idle");
    setError(null);
  }, []);

  return { state, uri, durationMs, startRecording, stopRecording, resetRecording, error };
}
