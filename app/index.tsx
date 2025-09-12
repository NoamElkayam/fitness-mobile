// app/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import LanguageToggle from "../components/ui/LanguageToggle";
import type { Goal } from "../lib/plans";

type SavedProfile = {
  weight: number;
  height: number;
  gender: "male" | "female";
  goal: Goal;
} | null;

export default function Home() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [saved, setSaved] = useState<SavedProfile>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("profile");
        if (mounted && raw) setSaved(JSON.parse(raw));
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const cornerStyle =
    i18n.language === "he"
      ? { position: "absolute", top: 16, left: 16, zIndex: 9999 } as const
      : { position: "absolute", top: 16, right: 16, zIndex: 9999 } as const;

  return (
    <LinearGradient colors={["#0b1220", "#111827", "#0b1220"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <View style={cornerStyle} pointerEvents="box-none"><LanguageToggle /></View>

      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: "center" }}>
        <Image source={require("../assets/hero.png")} style={{ width: 180, height: 180, alignSelf: "center", marginBottom: 10, borderRadius: 20 }} resizeMode="contain" />
        <Text style={{ color: "white", fontSize: 28, fontWeight: "800", textAlign: "center" }}>{t("appTitle")}</Text>
        <View style={{ height: 8 }} />
        <Text style={{ color: "#cbd5e1", fontSize: 16, textAlign: "center" }}>{t("heroSubtitle")}</Text>
        <View style={{ height: 24 }} />

        {saved && (
          <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 }}>
            <Text style={{ color: "#9ca3af", marginBottom: 6 }}>{t("lastProfile")}</Text>
            <Text style={{ color: "white", fontWeight: "700" }}>
              {t("weight")}: {saved?.weight} • {t("height")}: {saved?.height} • {t("goal")}: {t(saved?.goal || "maintain")}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push("/profile")}
          style={{ backgroundColor: "#22c55e", padding: 16, borderRadius: 16, alignItems: "center", shadowColor: "#22c55e", shadowOpacity: 0.3, shadowRadius: 12, elevation: 2 }}
        >
          <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>{t("start")}</Text>
        </Pressable>
      </View>

      <View style={{ paddingVertical: 14, alignItems: "center" }}>
        <Text style={{ color: "#64748b", fontSize: 12 }}>© {new Date().getFullYear()} Fitness Mobile</Text>
      </View>
    </LinearGradient>
  );
}
