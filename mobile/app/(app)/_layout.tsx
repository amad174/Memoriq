import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Colors } from "@/constants/theme";

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.surfaceBorder, borderTopWidth: 1, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />, headerTitle: "Memoriq" }} />
      <Tabs.Screen name="calendar/index" options={{ title: "Calendar", tabBarIcon: ({ focused }) => <Icon emoji="📅" focused={focused} />, headerTitle: "Calendar" }} />
      <Tabs.Screen name="search/index" options={{ title: "Search", tabBarIcon: ({ focused }) => <Icon emoji="🔍" focused={focused} />, headerTitle: "Search" }} />
      <Tabs.Screen name="ask/index" options={{ title: "Ask AI", tabBarIcon: ({ focused }) => <Icon emoji="✨" focused={focused} />, headerTitle: "Ask AI" }} />
      <Tabs.Screen name="settings/index" options={{ title: "Settings", tabBarIcon: ({ focused }) => <Icon emoji="⚙️" focused={focused} />, headerTitle: "Settings" }} />
      <Tabs.Screen name="calendar/day/[date]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
