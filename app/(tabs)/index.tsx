import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";

/** ---------- הגדרות שפה ---------- */
type Lang = "he" | "en";
const texts: Record<Lang, any> = {
  he: {
    appTitle: "אפליקציית אימון אישי",
    weight: "משקל (ק״ג)",
    height: "גובה (ס״מ)",
    gender: "מין",
    goal: "מטרה",
    genders: ["גבר", "אישה"],
    goals: ["שמירה/תחזוקה", "ירידה במשקל", "עלייה במסת שריר", "חיטוב"],
    calculate: "חשב",
    clear: "נקה",
    resultBMI: "BMI",
    resultCategory: "קטגוריה",
    resultPlan: "תוכנית מומלצת",
    categories: { under: "תת-משקל", normal: "תקין", over: "עודף משקל", obese: "השמנה" },
    errors: {
      invalid: "בדוק/בדקי שהזנת מספרים חוקיים למשקל/גובה.",
      calc: "אירעה תקלה בחישוב.",
    },
  },
  en: {
    appTitle: "Personal Fitness App",
    weight: "Weight (kg)",
    height: "Height (cm)",
    gender: "Gender",
    goal: "Goal",
    genders: ["Male", "Female"],
    goals: ["Maintenance", "Weight Loss", "Muscle Gain", "Toning"],
    calculate: "Calculate",
    clear: "Clear",
    resultBMI: "BMI",
    resultCategory: "Category",
    resultPlan: "Recommended Plan",
    categories: { under: "Underweight", normal: "Normal", over: "Overweight", obese: "Obesity" },
    errors: {
      invalid: "Please enter valid positive numbers for weight/height.",
      calc: "Unexpected error during calculation.",
    },
  },
};

/** ---------- לוגיקה כמו בפייתון, מותאם לשפה ---------- */
function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) throw new Error("values must be positive");
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function classifyBMI(bmi: number, lang: Lang): string {
  const c = texts[lang].categories;
  if (bmi < 18.5) return c.under;
  if (bmi < 25) return c.normal;
  if (bmi < 30) return c.over;
  return c.obese;
}

// תוכניות בסיס בעברית
const BASE_PLANS_HE: Record<string, Record<string, string>> = {
  "תת-משקל": {
    "גבר": "עלייה במסת שריר: כוח 3×שבוע, תזונה עתירת קלוריות.",
    "אישה": "חיזוק כללי+כוח מתון 3×שבוע, תזונה תומכת עלייה.",
  },
  "תקין": {
    "גבר": "איזון: 2×כוח + 2×קרדיו בשבוע.",
    "אישה": "כושר כללי: 2×חיטוב + 2×קרדיו מתון.",
  },
  "עודף משקל": {
    "גבר": "ירידה במשקל: קרדיו 4×שבוע + כוח קל 2×שבוע.",
    "אישה": "שריפת שומן: HIIT 2×שבוע + הליכות מהירות.",
  },
  "השמנה": {
    "גבר": "ירידה מדורגת: הליכות יומיות 30–45 ד׳ + תזונה מוקפדת.",
    "אישה": "פעילות מתונה יומית 30–40 ד׳ + ליווי תזונתי.",
  },
};

// תוכניות בסיס באנגלית
const BASE_PLANS_EN: Record<string, Record<string, string>> = {
  "Underweight": {
    "Male": "Muscle gain: strength 3×/week, calorie surplus.",
    "Female": "General strength 3×/week, supportive surplus diet.",
  },
  "Normal": {
    "Male": "Balance: 2× strength + 2× cardio per week.",
    "Female": "General fitness: 2× toning + 2× moderate cardio.",
  },
  "Overweight": {
    "Male": "Weight loss: cardio 4×/week + light strength 2×/week.",
    "Female": "Fat loss: 2× HIIT/week + brisk walks.",
  },
  "Obesity": {
    "Male": "Gradual loss: daily 30–45m walks + strict nutrition.",
    "Female": "Daily 30–40m moderate activity + nutrition guidance.",
  },
};

// התאמות מטרה בעברית/אנגלית
const GOAL_TWEAKS_HE: Record<string, string> = {
  "שמירה/תחזוקה": "שמור על נפח אימון מתון ומאזן קלורי ניטרלי.",
  "ירידה במשקל": "הוסף גירעון קלורי 300–500 קק״ל וקרדיו בינוני 3–4×שבוע.",
  "עלייה במסת שריר": "עודף קלורי 200–300 קק״ל, כוח כבד 3×שבוע, חלבון 1.6–2.2 ג׳/ק״ג.",
  "חיטוב": "כוח 2–3×שבוע + קרדיו קצר/עצים 1–2×שבוע, גירעון קל.",
};
const GOAL_TWEAKS_EN: Record<string, string> = {
  "Maintenance": "Keep moderate training volume and neutral calories.",
  "Weight Loss": "300–500 kcal deficit, moderate cardio 3–4×/week.",
  "Muscle Gain": "200–300 kcal surplus, heavy strength 3×/week, 1.6–2.2 g/kg protein.",
  "Toning": "Strength 2–3×/week + short intense cardio 1–2×/week, light deficit.",
};

function buildPlan(category: string, gender: string, goal: string, lang: Lang): string {
  if (lang === "he") {
    const base = BASE_PLANS_HE?.[category]?.[gender] || "לא נמצאה תוכנית מתאימה.";
    const tweak = GOAL_TWEAKS_HE[goal] || "";
    return tweak ? `${base} (${tweak})` : base;
  } else {
    const base = BASE_PLANS_EN?.[category]?.[gender] || "No suitable plan found.";
    const tweak = GOAL_TWEAKS_EN[goal] || "";
    return tweak ? `${base} (${tweak})` : base;
  }
}

/** ---------- מסך הבית ---------- */
export default function Index() {
  const [language, setLanguage] = useState<Lang>("he");
  const t = texts[language];
  const isHeb = language === "he";

  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [gender, setGender] = useState<string>(t.genders[0]); // מתעדכן עם שינוי שפה
  const [goal, setGoal] = useState<string>(t.goals[0]);

  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [plan, setPlan] = useState<string>("");

  // כשמשנים שפה — נעדכן ברירות מחדל של מין/מטרה
  const onSwitchLang = (lng: Lang) => {
    setLanguage(lng);
    const tt = texts[lng];
    setGender(tt.genders[0]);
    setGoal(tt.goals[0]);
    // לא מוחקים נתונים קיימים כדי לא לאבד קלט, אבל אפשר לאפס אם תרצה
    // setWeight(""); setHeight(""); setBmi(null); setCategory(""); setPlan("");
  };

  const disabled = useMemo(() => !weight || !height, [weight, height]);

  const onCalc = () => {
    try {
      const w = parseFloat(weight.replace(",", "."));
      const h = parseFloat(height.replace(",", "."));
      if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) {
        Alert.alert("Error", t.errors.invalid);
        return;
      }
      const _bmi = calculateBMI(w, h);
      const cat = classifyBMI(_bmi, language);
      const _plan = buildPlan(cat, gender, goal, language);

      setBmi(_bmi);
      setCategory(cat);
      setPlan(_plan);
    } catch {
      Alert.alert("Error", t.errors.calc);
    }
  };

  const onClear = () => {
    setWeight("");
    setHeight("");
    setGender(t.genders[0]);
    setGoal(t.goals[0]);
    setBmi(null);
    setCategory("");
    setPlan("");
  };

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.container}>
        {/* בחירת שפה */}
        <View style={[s.langRow, { justifyContent: isHeb ? "flex-end" : "flex-start" }]}>
          <Pressable onPress={() => onSwitchLang("he")} style={[s.langBtn, language === "he" && s.langBtnActive]}>
            <Text style={[s.langText, language === "he" && s.langTextActive]}>עברית</Text>
          </Pressable>
          <Pressable onPress={() => onSwitchLang("en")} style={[s.langBtn, language === "en" && s.langBtnActive]}>
            <Text style={[s.langText, language === "en" && s.langTextActive]}>English</Text>
          </Pressable>
        </View>

        <Text style={[s.title, { textAlign: isHeb ? "right" : "left" }]}>{t.appTitle}</Text>

        <View style={{ gap: 6 }}>
          <Text style={[s.label, { textAlign: isHeb ? "right" : "left" }]}>{t.weight}</Text>
          <TextInput
            placeholder={isHeb ? "לדוגמה: 70" : "e.g. 70"}
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            style={s.input}
            textAlign={isHeb ? "right" : "left"}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={[s.label, { textAlign: isHeb ? "right" : "left" }]}>{t.height}</Text>
          <TextInput
            placeholder={isHeb ? "לדוגמה: 175" : "e.g. 175"}
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={height}
            onChangeText={setHeight}
            style={s.input}
            textAlign={isHeb ? "right" : "left"}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={[s.label, { textAlign: isHeb ? "right" : "left" }]}>{t.gender}</Text>
          <View style={[s.pillRow, { flexDirection: isHeb ? "row-reverse" : "row" }]}>
            {t.genders.map((g: string) => (
              <Pressable key={g} onPress={() => setGender(g)} style={s.pill(gender === g)}>
                <Text style={s.pillText(gender === g)}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={[s.label, { textAlign: isHeb ? "right" : "left" }]}>{t.goal}</Text>
          <View style={[s.pillRow, { flexDirection: isHeb ? "row-reverse" : "row" }]}>
            {t.goals.map((g: string) => (
              <Pressable key={g} onPress={() => setGoal(g)} style={s.pill(goal === g)}>
                <Text style={s.pillText(goal === g)}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={onCalc} style={[s.button, { opacity: disabled ? 0.6 : 1 }]} disabled={disabled}>
          <Text style={s.buttonText}>{t.calculate}</Text>
        </Pressable>

        <Pressable onPress={onClear} style={s.buttonAlt}>
          <Text style={s.buttonText}>{t.clear}</Text>
        </Pressable>

        {bmi != null && (
          <View style={s.card}>
            <Text style={[s.resultLine, { textAlign: isHeb ? "right" : "left" }]}>{t.resultBMI}: {bmi.toFixed(2)}</Text>
            <Text style={[s.resultLine, { textAlign: isHeb ? "right" : "left" }]}>{t.resultCategory}: {category}</Text>
            <Text style={[s.plan, { textAlign: isHeb ? "right" : "left" }]}>{t.resultPlan}: {plan}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** ---------- עיצוב ---------- */
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" }, // slate-900
  container: { padding: 16, gap: 12 },
  langRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  langBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#334155" },
  langBtnActive: { backgroundColor: "#22c55e" },
  langText: { color: "white", fontWeight: "600" },
  langTextActive: { color: "black" },

  title: { color: "white", fontSize: 24, fontWeight: "700" },
  label: { color: "#e2e8f0", fontSize: 16 }, // slate-200

  input: {
    flex: 1,
    backgroundColor: "#1f2937", // gray-800
    color: "white",
    paddingVertical: Platform.select({ ios: 10, android: 6 }),
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  pillRow: { gap: 8, flexWrap: "wrap" },
  pill: (active: boolean) => ({
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: active ? "#22c55e" : "#334155", // green-500 / slate-700
  }),
  pillText: (active: boolean) => ({ color: active ? "black" : "white", fontWeight: "600" }),

  button: { backgroundColor: "#3b82f6", paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  buttonAlt: { backgroundColor: "#475569", paddingVertical: 12, borderRadius: 14, alignים: "center" } as any,
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },

  card: { backgroundColor: "#0b1220", borderRadius: 16, padding: 14, borderColor: "#1f2a44", borderWidth: 1, gap: 8 },
  resultLine: { color: "#e2e8f0", fontSize: 16 },
  plan: { color: "#a3e635", fontSize: 16 }, // lime-400
});
