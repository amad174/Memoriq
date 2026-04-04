import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { Colors, Spacing, Radius, Typography } from "@/constants/theme";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || password.length < 6) { Alert.alert("Error", "Enter a valid email and password (min 6 chars)."); return; }
    setLoading(true);
    try {
      await signup(email.trim().toLowerCase(), password);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Signup failed.";
      Alert.alert("Signup failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Memoriq</Text>
          <Text style={styles.tagline}>Start capturing your thoughts.</Text>
        </View>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>Already have an account?{" "}<Link href="/(auth)/login"><Text style={styles.link}>Sign in</Text></Link></Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  logo: { alignItems: "center", gap: 8 },
  logoText: { fontSize: 40, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -1 },
  tagline: { ...Typography.body, color: Colors.textMuted },
  form: { gap: Spacing.md },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, color: Colors.textPrimary, ...Typography.body, borderWidth: 1, borderColor: Colors.surfaceBorder },
  button: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  footer: { textAlign: "center", ...Typography.bodySmall, color: Colors.textSecondary },
  link: { color: Colors.accentLight, fontWeight: "600" },
});
