// app/ai-plan.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { generateAIPlan, type AIPlan, type AIInput } from "../lib/ai";
import { exportElementToPDF } from "../lib/pdf";

export default function AIPlanScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [plan, setPlan] = useState<AIPlan | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("profile");
      if (!raw) return;
      const p = JSON.parse(raw);

      const input: AIInput = {
        age: Number(p.age ?? 28),
        gender: p.gender ?? "male",
        weightKg: Number(p.weight ?? 0),
        heightCm: Number(p.height ?? 0),
        goal: p.goal ?? "maintain",
        activity: p.activity ?? "light",
        equipment: p.equipment ?? "gym",
        experience: p.experience ?? "beginner",
        daysPerWeek: Number(p.daysPerWeek ?? 3),
        sessionLengthMin: Number(p.sessionLengthMin ?? p.sessionLength ?? 60) as 30 | 45 | 60 | 75 | 90,
        injuries: p.injuries ?? { knees: false, back: false, shoulders: false, none: true },
        preferences: p.preferences ?? "",
      };

      setPlan(generateAIPlan(input));
    })();
  }, []);

  const lang = (i18n.language || "en").toString();

  if (!plan) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingText}>{t("loading") || "Loading..."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.container}>
      {/* פעולה עליונה */}
      <View style={s.actionsRow}>
        <Text style={s.screenTitle}>{t("aiPlan") || "AI Training Plan"}</Text>
        <Pressable
          onPress={() => exportElementToPDF("ai-plan-export", { filename: "ai-plan.pdf" })}
          style={[s.btn, s.btnPrimary, s.btnPdf]}
        >
          <Text style={s.btnText}>{t("exportPdf") || "Export PDF"}</Text>
        </Pressable>
      </View>

      {/* אזור שמיוצא ל-PDF */}
      <View id="ai-plan-export" data-testid="ai-plan-export">
        {/* Hero / Summary */}
        <Card>
          <View style={s.heroRow}>
            <Text style={s.heroTitle}>💪 {t("aiPlan") || "AI Training Plan"}</Text>
            <View style={s.badgesRow}>
              <Badge>{trSplit(plan.summary.split, lang)}</Badge>
              <Badge>{(t("microcycle") || "microcycle") + ": " + trMicro(plan.summary.microcycle, lang)}</Badge>
            </View>
          </View>

          {/* הערות קצרות */}
          {plan.summary.notes.length > 0 && (
            <>
              <SectionTitle title={t("notes") || "Notes"} />
              <View style={s.listCol}>
                {plan.summary.notes.map((n, i) => (
                  <ListItem key={i} text={trGeneric(n, lang)} />
                ))}
              </View>
            </>
          )}
        </Card>

        {/* תזונה */}
        <Card>
          <SectionTitle title={t("nutritionAdvice") || "Nutrition"} />
          <MetaRow label={t("tdee") || "TDEE"} value={`${plan.nutrition.tdee} kcal`} />
          <MetaRow label={t("target") || "Target"} value={`${plan.nutrition.calories} kcal`} />
          <MetaRow label={t("protein") || "Protein"} value={`${plan.nutrition.proteinGr[0]}–${plan.nutrition.proteinGr[1]} g`} />
          <MetaRow label={t("fat") || "Fat"} value={`${plan.nutrition.fatGr[0]}–${plan.nutrition.fatGr[1]} g`} />
          <MetaRow label={t("carbs") || "Carbs"} value={`${plan.nutrition.carbsGr} g`} />
          <Divider />
          <Text style={s.paragraph}>{trRationale(plan.nutrition.rationale, lang)}</Text>
        </Card>

        {/* שבועות */}
        {plan.weeks.map((week) => (
          <Card key={week.week}>
            <SectionTitle title={`${t("week") || "Week"} ${week.week}`} />
            <View style={s.daysGrid}>
              {week.days.map((d) => (
                <View key={d.dayIdx} style={s.dayCard}>
                  <View style={s.dayHeader}>
                    <Text style={s.dayTitle}>{dayName(d.dayIdx, lang)}</Text>
                    <Pill tone="blue">{prettyBlock(d.block, lang)}</Pill>
                  </View>

                  <View style={s.exList}>
                    {d.items.map((it, i) => (
                      <View key={i} style={s.exItem}>
                        <Text style={s.exName}>{trEx(it.name, lang)}</Text>
                        <Text style={s.exMeta}>
                          {fmtSetsReps(it)}
                          {it.restSec ? ` • ${restLabel(lang)} ${it.restSec}s` : ""}
                          {it.note ? ` — ${trEx(it.note, lang)}` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>

      <Pressable onPress={() => router.back()} style={[s.btn, s.btnGhost]}>
        <Text style={s.btnText}>{t("back") || "Back"}</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ---------------------- UI helpers ---------------------- */
function Card({ children }: { children: React.ReactNode }) {
  // className="card" נשמר עבור Theme ה-PDF
  return (
    <View style={[s.card]} className="card">
      {children}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{children}</Text>
    </View>
  );
}

function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "blue" | "green" }) {
  const tones = {
    gray: { bg: "rgba(255,255,255,0.08)", color: "#cbd5e1", border: "rgba(255,255,255,0.12)" },
    blue: { bg: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "rgba(59,130,246,0.25)" },
    green: { bg: "rgba(34,197,94,0.15)", color: "#86efac", border: "rgba(34,197,94,0.25)" },
  } as const;
  const t = tones[tone];
  return (
    <View style={[s.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[s.pillText, { color: t.color }]}>{children}</Text>
    </View>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <View style={s.listItem}>
      <View style={s.dot} />
      <Text style={s.paragraph}>{text}</Text>
    </View>
  );
}

/* ---------------------- Formatting helpers ---------------------- */
// מציג חזרות בסוגריים: 3×(10–12) / (12–15)
function fmtSetsReps(it: { sets?: number; reps?: string }) {
  const sets = typeof it.sets === "number" && it.sets > 0 ? `${it.sets}×` : "";
  const reps = it.reps ? `(${it.reps})` : "";
  return `${sets}${reps}`.trim();
}

/* ---------------------- i18n helpers ---------------------- */
function restLabel(lang: string) {
  return lang.startsWith("he") ? "מנוחה" : "rest";
}
function trMicro(m: string, lang: string) {
  if (!lang.startsWith("he")) return m;
  const map: Record<string, string> = { "3-up-1-down": "3 שבועות עומס + שבוע הורדה" };
  return map[m] || m;
}
function trSplit(name: string, lang: string) {
  if (!lang.startsWith("he")) return name;
  const map: Record<string, string> = {
    "Upper/Lower + Cardio": "עליון/תחתון + קרדיו",
    "Upper / Lower / Pull-Shoulders": "עליון / רגליים / גב+כתפיים",
    "Upper / Lower / Rest / Pull-Shoulders / Cardio": "עליון / רגליים / מנוחה / גב+כתפיים / קרדיו",
    "PPL + Cardio": "PPL (דחיפה/משיכה/רגליים) + קרדיו",
    "UL + Pull-Shoulders + Cardio": "עליון/רגליים + גב/כתפיים + קרדיו",
    "Hybrid PPL + Conditioning": "PPL היברידי + קונדישנינג",
  };
  return map[name] || name;
}
function trRationale(s: string, lang: string) {
  if (!lang.startsWith("he")) return s;
  const map: Record<string, string> = {
    "Caloric deficit ~15% with higher protein to preserve lean mass.":
      "גרעון קלורי ~15% עם חלבון גבוה לשמירה על מסת גוף רזה.",
    "Small surplus ~10% to support hypertrophy with manageable fat gain.":
      "עודף קל ~10% לתמיכה בהיפרטרופיה עם עליה מבוקרת בשומן.",
    "Slight surplus to push strength while controlling bodyweight.":
      "עודף קטן לשיפור כוח תוך שליטה במשקל הגוף.",
    "Maintenance calories for recomposition/health.":
      "קלוריות תחזוקה לריקומפ/בריאות כללית.",
  };
  return map[s] || s;
}
function trGeneric(s: string, lang: string) {
  if (!lang.startsWith("he")) return s;
  const map: Record<string, string> = {
    "High BMI – consider short cut before bulking.":
      "BMI גבוה – שקול חיטוב קצר לפני עלייה במסת שריר.",
    "Exercises adapted for injuries; keep pain-free range and consult a pro if needed.":
      "התרגילים הותאמו לפציעות; לעבוד בטווח ללא כאב ולהתייעץ עם איש מקצוע לפי הצורך.",
  };
  if (s.startsWith("Preferences noted:")) {
    const rest = s.replace("Preferences noted:", "").trim();
    return `העדפות הוזנו: ${rest}`;
  }
  return map[s] || s;
}
function dayName(i: number, lang: string) {
  const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const he = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  return lang.startsWith("he") ? he[i] : en[i];
}
function prettyBlock(key: string, lang: string) {
  if (!lang.startsWith("he")) {
    const m: Record<string, string> = {
      upper: "Upper",
      legs: "Legs",
      backShoulders: "Back & Shoulders",
      cardioCore: "Cardio / Core",
      hiit: "HIIT",
      activeRest: "Active rest",
      rest: "Rest",
    };
    return m[key] || key;
  }
  const mHe: Record<string, string> = {
    upper: "פלג גוף עליון",
    legs: "רגליים",
    backShoulders: "גב וכתפיים",
    cardioCore: "קרדיו / מרכז",
    hiit: "אינטרוולים (HIIT)",
    activeRest: "מנוחה פעילה",
    rest: "מנוחה",
  };
  return mHe[key] || key;
}
function trEx(name: string, lang: string) {
  if (!lang.startsWith("he")) return name;
  const map: Record<string, string> = {
    "Barbell bench press": "לחיצת חזה במוט",
    "Dumbbell bench press / Push-ups": "לחיצת חזה בדאמבלים / שכיבות סמיכה",
    "Pull-ups or Lat pulldown": "מתח או פולי עליון",
    "One-arm DB row": "חתירת דאמבל ביד אחת",
    "Shoulder press (DB/Machine)": "לחיצת כתפיים (דאמבלים/מכונה)",
    "Front/Side raises light": "הרמות צד/קדמי קלות",
    "Biceps curls": "כפיפות מרפקים (בייספס)",
    "Triceps extensions/pushdown": "פשיטות מרפקים/פושדאון (טרייספס)",
    "Back/Hack squat": "סקוואט אחורי / האק סקוואט",
    "Goblet squat / Leg press": "סקוואט גביע / לחיצת רגליים",
    "Hip hinge / Step-ups low": "ציר ירך / עליות מדרגה נמוכות (ידידותי לברכיים)",
    "Romanian deadlift": "דדליפט רומני",
    "Hip thrust / Glute bridge": "היפ־תראסט / גשר גלוטאוס",
    "Lunges / Split squat": "לאנז'ים / סקוואט מפוצל",
    "Calf raises": "הרמות שוק",
    "Core (plank/abs)": "ליבה (פלאנק/בטן)",
    "Row (cable/DB/T-bar)": "חתירה (כבל/דאמבלים/T-bar)",
    "Face pulls / Rear-delt raises": "פייס־פולס / הרמות אחוריות לכתף",
    "Lat focus (pulldown/pull-ups)": "דגש גב רחב (פולי עליון/מתח)",
    "Lateral raises": "הרמות צד",
    "External rotations (band)": "רוטציות חיצוניות (גומייה)",
    "Bike / brisk walk": "אופניים / הליכה מהירה",
    "Abs circuit": "סבב בטן",
    "Mobility (hips/shoulders)": "ניידות (ירך/כתפיים)",
    "Intervals 30:30 (run/row/bike)": "אינטרוולים 30:30 (ריצה/חתירה/אופניים)",
    "Cool-down + mobility": "שחרור + ניידות",
    "Walk": "הליכה",
    "Stretching & foam roll": "מתיחות וגליל קצף",
    "Rest / Recovery": "מנוחה / התאוששות",
    "knee-friendly": "ידידותי לברכיים",
    "pain-free": "בטווח ללא כאב",
  };
  return map[name] || name;
}

/* ---------------------- Styles ---------------------- */
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b1220" },
  container: { padding: 20, gap: 16, paddingBottom: 32 },

  loading: { flex: 1, backgroundColor: "#0b1220", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#cbd5e1", fontSize: 16 },

  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  screenTitle: { color: "white", fontSize: 22, fontWeight: "800" },

  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  btnPrimary: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" },
  btnText: { color: "white", fontWeight: "700" },
  btnPdf: {},

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  heroRow: { gap: 12 },
  heroTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  sectionTitle: { color: "#cbd5e1", fontWeight: "800", letterSpacing: 0.25, fontSize: 14, marginBottom: 4 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaLabel: { color: "#93a3b8", fontSize: 13 },
  metaValue: { color: "#e5e7eb", fontWeight: "700", fontSize: 13 },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 8 },

  badge: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: "rgba(59,130,246,0.25)",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: { color: "#93c5fd", fontWeight: "700", fontSize: 12 },

  paragraph: { color: "#cbd5e1", lineHeight: 22, fontSize: 14 },
  listCol: { gap: 6 },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: "#93c5fd", marginTop: 8 },

  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dayCard: {
    flexBasis: "100%",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayTitle: { color: "white", fontWeight: "800", fontSize: 16 },

  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  pillText: { fontWeight: "700", fontSize: 12 },

  exList: { gap: 8 },
  exItem: { gap: 2 },
  exName: { color: "#e5e7eb", fontWeight: "700", fontSize: 14 },
  exMeta: { color: "#93c5fd", fontSize: 13 },
});
