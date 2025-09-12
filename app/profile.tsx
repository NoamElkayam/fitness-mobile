// app/profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Goal } from "../lib/plans";

type Gender = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "high" | "veryHigh";
type Equipment = "home" | "gym";
type Experience = "beginner" | "intermediate" | "advanced";

type ProfileData = {
  name?: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: Gender;
  goal: Goal;
  activity: Activity;
  daysPerWeek: number;
  sessionLength: number; // נשתמש בזה וגם נשמור בתור sessionLengthMin עבור ה-AI
  equipment: Equipment;
  experience: Experience;
  injuries: { knees: boolean; back: boolean; shoulders: boolean; none: boolean };
  preferences?: string;
  targetWeight?: number | null;
  targetDate?: string | null; // YYYY-MM-DD
};

const Card: React.FC<{ title: string; children: React.ReactNode; style?: any }> = ({ title, children, style }) => (
  <View style={[styles.card, style]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={styles.cardBody}>{children}</View>
  </View>
);

const Row: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[styles.row, style]}>{children}</View>
);

const LabeledInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  width?: number;
}> = ({ label, value, onChangeText, placeholder, keyboardType = "numeric", width = 160 }) => (
  <View style={{ marginEnd: 12, marginBottom: 12, width }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#64748b"
      keyboardType={keyboardType}
      style={styles.input}
    />
  </View>
);

const Chip: React.FC<{ label: string; selected?: boolean; onPress?: () => void }> = ({ label, selected, onPress }) => (
  <Pressable onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}>
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </Pressable>
);

export default function Profile() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [p, setP] = useState<ProfileData>({
    weight: null,
    height: null,
    age: null,
    gender: "male",
    goal: "maintain",
    activity: "moderate",
    daysPerWeek: 4,
    sessionLength: 60,
    equipment: "gym",
    experience: "beginner",
    injuries: { knees: false, back: false, shoulders: false, none: true },
    preferences: "",
    targetWeight: null,
    targetDate: null,
  });

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("profile");
        if (raw) setP(prev => ({ ...prev, ...JSON.parse(raw) }));
        const saved = await AsyncStorage.getItem("profiles");
        if (saved) setProfiles(JSON.parse(saved));
      } catch {}
    })();
  }, []);

  const saveLast = async (data: any) => {
    try { await AsyncStorage.setItem("profile", JSON.stringify(data)); } catch {}
  };
  const saveProfiles = async (list: ProfileData[]) => {
    try { await AsyncStorage.setItem("profiles", JSON.stringify(list)); } catch {}
  };

  const bmi = useMemo(() => {
    if (!p.weight || !p.height) return null;
    const h = (p.height || 0) / 100;
    return +((p.weight || 0) / (h * h)).toFixed(1);
  }, [p.weight, p.height]);

  const bmiInfo = useMemo(() => {
    if (bmi == null) return { catKey: "missingData", color: "#6b7280" };
    if (bmi < 18.5) return { catKey: "underweight", color: "#22c55e" };
    if (bmi < 25) return { catKey: "normal", color: "#16a34a" };
    if (bmi < 30) return { catKey: "overweight", color: "#f59e0b" };
    return { catKey: "obese", color: "#ef4444" };
  }, [bmi]);

  const activityFactor: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, veryHigh: 1.9 };
  function calcBMR(): number | null {
    if (!p.weight || !p.height || !p.age) return null;
    const w = p.weight, h = p.height, a = p.age;
    const bmr = p.gender === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    return Math.round(bmr);
  }
  function calcTDEE(): number | null {
    const b = calcBMR(); if (!b) return null;
    return Math.round(b * activityFactor[p.activity]);
  }
  const macros = useMemo(() => {
    const tdee = calcTDEE(); if (!tdee || !p.weight) return null;
    let calories = tdee;
    if (p.goal === "cut") calories = Math.round(tdee * 0.85);
    if (p.goal === "bulk") calories = Math.round(tdee * 1.07);
    if (p.goal === "strength") calories = Math.round(tdee * 1.03);
    let gPerKg = 1.6; if (p.goal === "cut") gPerKg = 1.9; if (p.goal === "strength") gPerKg = 1.8;
    const protein = Math.round(gPerKg * p.weight);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    return { calories, protein, carbs, fat };
  }, [p]);

  const weekly = useMemo(() => {
    if (!p.targetWeight || !p.targetDate || !p.weight) return null;
    const now = new Date(); const end = new Date(p.targetDate);
    const weeks = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7);
    if (weeks <= 0) return null;
    return +(((p.targetWeight - p.weight) / weeks).toFixed(2));
  }, [p.targetWeight, p.targetDate, p.weight]);

  // ניווטים
  const goPlan = () => {
    if (!p.weight || !p.height) return;
    saveLast(p);
    router.push({ pathname: "/plan", params: { weight: String(p.weight), height: String(p.height), goal: p.goal } });
  };

  // חדש: יצירת AI Plan מתוך הדף הזה (שומר sessionLengthMin)
  const goAIPlan = async () => {
    const withSessionMin = { ...p, sessionLengthMin: p.sessionLength };
    await saveLast(withSessionMin);
    router.push("/ai-plan");
  };

  const saveAsNew = async () => {
    if (!newName.trim()) return;
    const copy = { ...p, name: newName.trim() };
    const list = [...profiles.filter(x => x.name !== copy.name), copy];
    setProfiles(list); await saveProfiles(list); await saveLast(copy); setNewName("");
  };
  const loadProfile = async (name: string) => {
    const found = profiles.find(x => x.name === name);
    if (found) { setP(found); await saveLast(found); }
  };
  const deleteProfile = async (name: string) => {
    const list = profiles.filter(x => x.name !== name);
    setProfiles(list); await saveProfiles(list);
  };

  const aiLabel = i18n.language?.startsWith("he") ? "תוכנית AI" : "AI Plan";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={styles.container}>
        {/* עמודה שמאל */}
        <View style={styles.leftCol}>
          <Card title={t("profile")}>
            <Row>
              <LabeledInput label={t("weight")} value={p.weight?.toString() ?? ""} onChangeText={(s) => setP(v => ({ ...v, weight: Number(s) || null }))} placeholder={t("weightPlaceholder")} />
              <LabeledInput label={t("height")} value={p.height?.toString() ?? ""} onChangeText={(s) => setP(v => ({ ...v, height: Number(s) || null }))} placeholder={t("heightPlaceholder")} />
              <LabeledInput label={t("age")} value={p.age?.toString() ?? ""} onChangeText={(s) => setP(v => ({ ...v, age: Number(s) || null }))} placeholder={t("agePlaceholder")} />
            </Row>

            <Text style={styles.label}>{t("gender")}</Text>
            <Row>
              <Chip label={t("male")} selected={p.gender === "male"} onPress={() => setP(v => ({ ...v, gender: "male" }))} />
              <Chip label={t("female")} selected={p.gender === "female"} onPress={() => setP(v => ({ ...v, gender: "female" }))} />
            </Row>

            <Text style={[styles.label, { marginTop: 10 }]}>{t("goal")}</Text>
            <Row>
              {(["maintain","cut","bulk","strength"] as Goal[]).map(g => (
                <Chip key={g} label={t(g)} selected={p.goal === g} onPress={() => setP(v => ({ ...v, goal: g }))} />
              ))}
            </Row>
          </Card>

          <Card title={t("activity")}>
            <Row>
              {(["sedentary","light","moderate","high"] as Activity[]).map(a => (
                <Chip key={a} label={t(a)} selected={p.activity === a} onPress={() => setP(v => ({ ...v, activity: a }))} />
              ))}
            </Row>
          </Card>

          <Card title={t("equipment")}>
            <Row>
              {(["home","gym"] as Equipment[]).map(e => (
                <Chip key={e} label={t(e)} selected={p.equipment === e} onPress={() => setP(v => ({ ...v, equipment: e }))} />
              ))}
            </Row>
          </Card>

          <Card title={t("experience")}>
            <Row>
              {(["beginner","intermediate","advanced"] as Experience[]).map(ex => (
                <Chip key={ex} label={t(ex)} selected={p.experience === ex} onPress={() => setP(v => ({ ...v, experience: ex }))} />
              ))}
            </Row>
          </Card>

          <Card title={t("daysPerWeek")}>
            <Row>
              {[2,3,4,5,6,7].map(n => (
                <Chip key={n} label={String(n)} selected={p.daysPerWeek === n} onPress={() => setP(v => ({ ...v, daysPerWeek: n }))} />
              ))}
            </Row>
          </Card>

          <Card title={t("sessionLength")}>
            <Row>
              {[30,45,60,75,90].map(n => (
                <Chip key={n} label={`${n} ${t("minutes")}`} selected={p.sessionLength === n} onPress={() => setP(v => ({ ...v, sessionLength: n }))} />
              ))}
            </Row>
          </Card>

          <Card title={t("injuries")}>
            <Row>
              <Chip label={t("none")} selected={p.injuries.none} onPress={() => setP(v => ({ ...v, injuries: { knees: false, back: false, shoulders: false, none: true } }))} />
              <Chip label={t("knees")} selected={p.injuries.knees} onPress={() => setP(v => ({ ...v, injuries: { ...v.injuries, knees: !v.injuries.knees, none: false } }))} />
              <Chip label={t("back")} selected={p.injuries.back} onPress={() => setP(v => ({ ...v, injuries: { ...v.injuries, back: !v.injuries.back, none: false } }))} />
              <Chip label={t("shoulders")} selected={p.injuries.shoulders} onPress={() => setP(v => ({ ...v, injuries: { ...v.injuries, shoulders: !v.injuries.shoulders, none: false } }))} />
            </Row>
          </Card>

          <Card title={t("preferences")}>
            <TextInput
              value={p.preferences ?? ""}
              onChangeText={(s) => setP(v => ({ ...v, preferences: s }))}
              placeholder={t("preferencesPlaceholder")}
              placeholderTextColor="#64748b"
              style={[styles.input, { width: "100%" }]}
            />
          </Card>
        </View>

        {/* עמודה ימין */}
        <View style={styles.rightCol}>
          <Card title={t("target")}>
            <Row>
              <LabeledInput label={t("targetWeight")} value={p.targetWeight?.toString() ?? ""} onChangeText={(s) => setP(v => ({ ...v, targetWeight: Number(s) || null }))} />
              <LabeledInput label={t("targetDate")} value={p.targetDate ?? ""} onChangeText={(s) => setP(v => ({ ...v, targetDate: s }))} keyboardType="default" width={200} />
            </Row>
            {weekly !== null && (
              <Text style={styles.subtle}>
                {t("weeklyRate")}{" "}
                <Text style={{ color: weekly < 0 ? "#f59e0b" : "#22c55e", fontWeight: "800" }}>
                  {Math.abs(weekly)} {t(weekly < 0 ? "perWeekLoss" : "perWeekGain")}
                </Text>
              </Text>
            )}
          </Card>

          <Card title={`${t("bmi")} & ${t("nutritionAdvice")}`}>
            <Row style={{ marginBottom: 8 }}>
              <View style={[styles.bmiPill, { backgroundColor: bmiInfo.color }]}>
                <Text style={{ color: "white", fontWeight: "800" }}>{t("bmi")}: {bmi ?? "--"}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={{ color: "white" }}>{t("bmiStatus")}: {t(bmiInfo.catKey)}</Text>
              </View>
            </Row>

            {macros ? (
              <Row style={{ flexWrap: "wrap" }}>
                {[
                  { key: "calories", val: macros.calories },
                  { key: "protein",  val: `${macros.protein}g` },
                  { key: "carbs",    val: `${macros.carbs}g` },
                  { key: "fat",      val: `${macros.fat}g` },
                ].map(m => (
                  <View key={m.key} style={styles.macroCard}>
                    <Text style={styles.macroTitle}>{t(m.key)}</Text>
                    <Text style={styles.macroValue}>{m.val}</Text>
                  </View>
                ))}
              </Row>
            ) : (
              <Text style={styles.subtle}>{t("missingData")}</Text>
            )}
          </Card>

          {/* כפתורים */}
          <View style={{ marginTop: 8, gap: 10 }}>
            <Pressable onPress={goPlan} style={[styles.btnBig, { backgroundColor: "#22c55e", borderColor: "#22c55e" }]}>
              <Text style={{ color: "white", fontWeight: "800" }}>{t("calculate")}</Text>
            </Pressable>

            {/* חדש: AI Plan מכאן, על סמך הנתונים שמילאת */}
            <Pressable onPress={goAIPlan} style={[styles.btnBig, { backgroundColor: "#2563eb", borderColor: "#2563eb" }]}>
              <Text style={{ color: "white", fontWeight: "800" }}>{aiLabel}</Text>
            </Pressable>
          </View>

          {/* פרופילים שמורים */}
          <Card title={t("savedProfiles")}>
            <Row>
              <LabeledInput label={t("profileName")} value={newName} onChangeText={setNewName} keyboardType="default" width={220} />
              <Pressable onPress={saveAsNew} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnText}>{t("save")}</Text>
              </Pressable>
            </Row>
            {profiles.length === 0 ? (
              <Text style={styles.subtle}>—</Text>
            ) : (
              profiles.map(pr => (
                <View key={pr.name} style={styles.savedItem}>
                  <Text style={{ color: "white", fontWeight: "700" }}>{pr.name}</Text>
                  <View style={{ flexDirection: "row" }}>
                    <Pressable onPress={() => loadProfile(pr.name!)} style={[styles.btn, styles.btnSuccess, { marginEnd: 8 }]}>
                      <Text style={styles.btnText}>{t("load")}</Text>
                    </Pressable>
                    <Pressable onPress={() => deleteProfile(pr.name!)} style={[styles.btn, styles.btnDanger]}>
                      <Text style={styles.btnText}>{t("remove")}</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const MAX_W = 1100;
const styles = StyleSheet.create({
  container: { padding: 16, width: "100%", maxWidth: MAX_W, alignSelf: "center", flexDirection: Platform.OS === "web" ? "row" : "column" },
  leftCol: { flex: 1, minWidth: 0 },
  rightCol: { flex: 1, minWidth: 0, ...(Platform.OS === "web" ? { marginStart: 16 } : { marginTop: 16 }) },
  card: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  cardTitle: { color: "#cbd5e1", fontWeight: "800", fontSize: 14, paddingHorizontal: 14, paddingTop: 12 },
  cardBody: { paddingHorizontal: 14, paddingVertical: 10 },
  label: { color: "#9aa7bd", fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.06)", color: "white", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginEnd: 8, marginBottom: 8, borderWidth: 1 },
  chipIdle: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)" },
  chipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { color: "white", fontWeight: "700" },
  chipTextSelected: { color: "white" },
  bmiPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, marginEnd: 8 },
  statusPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  macroCard: { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.35)", borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginEnd: 8, marginBottom: 8, minWidth: 140 },
  macroTitle: { color: "#93e29d", fontSize: 12 },
  macroValue: { color: "white", fontWeight: "800", fontSize: 18, marginTop: 2 },
  subtle: { color: "#94a3b8", marginTop: 6 },
  savedItem: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btn: { height: 44, paddingHorizontal: 16, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  btnText: { color: "white", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  btnSuccess: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  btnDanger: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  btnBig: { marginTop: 4, backgroundColor: "#22c55e", borderColor: "#22c55e", borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
});
