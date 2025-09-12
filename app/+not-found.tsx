// app/+not-found.tsx  או  app/(tabs)/+not-found.tsx
import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function NotFoundScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0f1825",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        gap: 10,
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>404</Text>
      <Text style={{ color: "#cbd5e1", textAlign: "center" }}>Page not found</Text>

      <Link href="/" asChild>
        <Pressable
          style={{
            backgroundColor: "#2563eb",
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Go Home</Text>
        </Pressable>
      </Link>
    </View>
  );
}
