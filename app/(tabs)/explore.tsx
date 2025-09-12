// app/(tabs)/explore.tsx
import { View, Text, StyleSheet } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.text}>
        This is a placeholder screen. You can design this tab later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1825",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: { color: "white", fontSize: 28, fontWeight: "800", marginBottom: 8 },
  text: { color: "#cbd5e1", textAlign: "center" },
});
