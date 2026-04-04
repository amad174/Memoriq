export const Colors = {
  background: "#0A0A0F",
  surface: "#12121A",
  surfaceElevated: "#1A1A26",
  surfaceBorder: "#252535",
  textPrimary: "#F0F0F8",
  textSecondary: "#9090A8",
  textMuted: "#55556A",
  accent: "#7C6FF7",
  accentLight: "#A59FFB",
  accentDark: "#5B55D0",
  success: "#4CAF82",
  warning: "#F0A04B",
  error: "#E05A5A",
  recordRed: "#E05A5A",
  tagBackground: "#1E1E30",
  tagText: "#9090A8",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "600" as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: "400" as const },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5 },
} as const;
