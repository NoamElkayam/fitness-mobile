// app/plan.tsx
import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { exportElementToPDF } from "../lib/pdf";

export default function PlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { weight, height, goal } = params as { weight?: string; height?: string; goal?: string };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0b1220" }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Your Plan</Text>
        <Pressable onPress={() => exportElementToPDF("plan-export", { filename: "plan.pdf" })} style={styles.btnPdf}>
          <Text style={{ color: "white", fontWeight: "700" }}>Export PDF</Text>
        </Pressable>
      </View>

      {/* התוכן שנכנס ל-PDF */}
      <View id="plan-export">
        <View style={styles.card}>
          <Text style={styles.small}>BMI & Goal</Text>
          <Text style={styles.small}>Weight: {weight ?? "?"} • Height: {height ?? "?"} • Goal: {goal ?? "?"}</Text>
        </View>

        {/* דוגמת שבוע — אתה יכול להחליף בתוכן שלך */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Week 1</Text>
          <Text style={styles.item}>• Mon — Upper: Bench press 5×5 • Row 4×8 • Shoulders 3×12</Text>
          <Text style={styles.item}>• Tue — Cardio/Core: 25–30min + abs circuit</Text>
          <Text style={styles.item}>• Wed — Legs: Squat 5×5 • Romanian deadlift 4×8 • Calf raises 3×15</Text>
          <Text style={styles.item}>• Thu — Rest / Mobility</Text>
          <Text style={styles.item}>• Fri — Back & Shoulders: Pull-ups 4×max • Shoulder press 4×10</Text>
          <Text style={styles.item}>• Sat — Active rest</Text>
          <Text style={styles.item}>• Sun — Optional HIIT 6–8 rounds 30:30</Text>
        </View>
      </View>

      <Pressable onPress={() => router.back()} style={styles.btnBack}>
        <Text style={{ color: "white", fontWeight: "700" }}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  h1: { color: "white", fontSize: 18, fontWeight: "800" },
  btnPdf: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9", borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },

  card: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 12 },
  cardTitle: { color: "#cbd5e1", fontWeight: "800", marginBottom: 6, fontSize: 14 },
  small: { color: "#cbd5e1", fontSize: 13, lineHeight: 20 },
  item: { color: "#e5e7eb", marginBottom: 4 },

  btnBack: { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)", borderWidth: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", marginTop: 16 },
});
