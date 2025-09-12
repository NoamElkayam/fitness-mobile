// lib/ai.ts
// "AI" מקומי: מחולל תוכנית לפי נתוני משתמש (חוקים חכמים + מיקרו־סייקל 4 שבועות)

export type Gender = "male" | "female";
export type Goal = "maintain" | "cut" | "bulk" | "strength";
export type Activity = "sedentary" | "light" | "moderate" | "high";
export type Equipment = "home" | "gym";
export type Experience = "beginner" | "intermediate" | "advanced";

export type Injuries = { knees: boolean; back: boolean; shoulders: boolean; none?: boolean };

export type AIInput = {
  age?: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  goal: Goal;
  activity: Activity;
  equipment: Equipment;
  experience: Experience;
  daysPerWeek: number;      // 2..7
  sessionLengthMin: 30 | 45 | 60 | 75 | 90;
  injuries: Injuries;
  preferences?: string;     // הערות חופשיות
};

export type AIExercise = { name: string; sets: number; reps: string; restSec?: number; note?: string };
export type AIDay = { dayIdx: number; block: string; items: AIExercise[] };
export type AIWeek = { week: number; days: AIDay[] };

export type AINutrition = {
  tdee: number;
  calories: number;
  proteinGr: [number, number];
  fatGr: [number, number];
  carbsGr: number;
  rationale: string;
};

export type AIPlan = {
  summary: {
    split: string;
    microcycle: "3-up-1-down";
    notes: string[];
  };
  nutrition: AINutrition;
  weeks: AIWeek[]; // 4 שבועות
};

// ---------- עזרי תזונה ----------
function bmrMifflin({ weightKg, heightCm, age, gender }: { weightKg: number; heightCm: number; age?: number; gender: Gender }) {
  const s = gender === "male" ? 5 : -161;
  const a = age ?? 28;
  return 10 * weightKg + 6.25 * heightCm - 5 * a + s;
}
function activityFactor(a: Activity) {
  return a === "sedentary" ? 1.2 : a === "light" ? 1.375 : a === "moderate" ? 1.55 : 1.725;
}
function caloriesForGoal(tdee: number, goal: Goal) {
  if (goal === "cut") return Math.round(tdee * 0.85);      // ~15% גרעון
  if (goal === "bulk") return Math.round(tdee * 1.1);      // ~10% עודף
  if (goal === "strength") return Math.round(tdee * 1.03); // עודף קטן
  return Math.round(tdee);                                  // maintain
}
function macros(weightKg: number, calories: number, goal: Goal): AINutrition["proteinGr" | "fatGr" | "carbsGr"] {
  const proteinLo = Math.round(weightKg * 1.6);
  const proteinHi = Math.round(weightKg * 2.2);
  const fatLo = Math.round(weightKg * 0.7);
  const fatHi = Math.round(weightKg * 1.0);
  const kcalFromProtein = proteinHi * 4;
  const kcalFromFat = fatLo * 9;
  const carbs = Math.max(0, Math.round((calories - kcalFromProtein - kcalFromFat) / 4));
  return { protein: [proteinLo, proteinHi] as [number, number], fat: [fatLo, fatHi] as [number, number], carbs };
}

// ---------- בחירת חלוקה (split) ----------
function chooseSplit(days: number, exp: Experience) {
  const d = Math.min(7, Math.max(2, days));
  if (d <= 2) return { name: "Upper/Lower + Cardio", blocks: ["upper", "rest", "legs", "rest", "cardioCore", "rest", "rest"] };
  if (d === 3) return { name: "Upper / Lower / Pull-Shoulders", blocks: ["upper", "legs", "backShoulders", "rest", "cardioCore", "rest", "rest"] };
  if (d === 4) return { name: "Upper / Lower / Rest / Pull-Shoulders / Cardio", blocks: ["upper", "legs", "rest", "backShoulders", "cardioCore", "rest", "activeRest"] };
  if (d === 5) return { name: exp === "advanced" ? "PPL + Cardio" : "UL + Pull-Shoulders + Cardio", blocks: ["upper", "legs", "hiit", "backShoulders", "cardioCore", "activeRest", "rest"] };
  return { name: "Hybrid PPL + Conditioning", blocks: ["upper", "legs", "hiit", "backShoulders", "cardioCore", "activeRest", "rest"] };
}

// ---------- מאגרי תרגילים (מסוננים לפי ציוד/פציעות) ----------
function poolUpper(can: ReturnType<typeof canDo>, setsHeavy: number, setsMod: number, setsLight: number): AIExercise[] {
  return [
    can.shoulderOK && can.barbell
      ? { name: "Barbell bench press", sets: setsHeavy, reps: "4–6", restSec: 120 }
      : { name: "Dumbbell bench press / Push-ups", sets: setsHeavy, reps: "6–10", restSec: 90 },
    can.pullupBar
      ? { name: "Pull-ups or Lat pulldown", sets: setsMod, reps: "6–10", restSec: 90 }
      : { name: "One-arm DB row", sets: setsMod, reps: "8–12", restSec: 75 },
    can.shoulderOK
      ? { name: "Shoulder press (DB/Machine)", sets: setsMod, reps: "8–12", restSec: 75 }
      : { name: "Front/Side raises light", sets: setsLight, reps: "12–15", note: "pain-free", restSec: 60 },
    { name: "Biceps curls", sets: setsLight, reps: "10–15", restSec: 60 },
    { name: "Triceps extensions/pushdown", sets: setsLight, reps: "10–15", restSec: 60 },
  ];
}
function poolLegs(can: ReturnType<typeof canDo>, setsHeavy: number, setsMod: number, setsLight: number): AIExercise[] {
  return [
    can.kneeOK && can.barbell
      ? { name: "Back/Hack squat", sets: setsHeavy, reps: "4–8", restSec: 120 }
      : can.kneeOK
      ? { name: "Goblet squat / Leg press", sets: setsHeavy, reps: "8–12", restSec: 90 }
      : { name: "Hip hinge / Step-ups low", sets: setsMod, reps: "10–12", note: "knee-friendly", restSec: 75 },
    can.backOK
      ? { name: "Romanian deadlift", sets: setsMod, reps: "6–10", restSec: 90 }
      : { name: "Hip thrust / Glute bridge", sets: setsMod, reps: "8–12", restSec: 75 },
    { name: "Lunges / Split squat", sets: setsLight, reps: "10–12", restSec: 75 },
    { name: "Calf raises", sets: setsLight, reps: "12–15", restSec: 60 },
    { name: "Core (plank/abs)", sets: setsLight, reps: "60–90s / 12–15", restSec: 45 },
  ];
}
function poolBackShoulders(can: ReturnType<typeof canDo>, setsHeavy: number, setsMod: number, setsLight: number): AIExercise[] {
  return [
    { name: "Row (cable/DB/T-bar)", sets: setsHeavy, reps: "6–10", restSec: 90 },
    can.shoulderOK
      ? { name: "Face pulls / Rear-delt raises", sets: setsMod, reps: "12–15", restSec: 60 }
      : { name: "Scap drills (YTWL)", sets: setsLight, reps: "12–15", restSec: 45 },
    { name: "Lat focus (pulldown/pull-ups)", sets: setsMod, reps: "6–10", restSec: 90 },
    can.shoulderOK
      ? { name: "Lateral raises", sets: setsLight, reps: "12–15", restSec: 60 }
      : { name: "External rotations (band)", sets: setsLight, reps: "12–15", restSec: 45 },
  ];
}
function poolCardioCore(): AIExercise[] {
  return [
    { name: "Bike / brisk walk", sets: 1, reps: "25–35 min" },
    { name: "Abs circuit", sets: 3, reps: "12–15" },
    { name: "Mobility (hips/shoulders)", sets: 1, reps: "8–10 min" },
  ];
}
function poolHIIT(): AIExercise[] {
  return [
    { name: "Intervals 30:30 (run/row/bike)", sets: 1, reps: "20–25 min" },
    { name: "Cool-down + mobility", sets: 1, reps: "10 min" },
  ];
}
function poolActiveRest(): AIExercise[] {
  return [
    { name: "Walk", sets: 1, reps: "30–45 min" },
    { name: "Stretching & foam roll", sets: 1, reps: "10–15 min" },
  ];
}
function poolRest(): AIExercise[] {
  return [{ name: "Rest / Recovery", sets: 0, reps: "-", note: "sleep, hydration" }];
}

function canDo(equipment: Equipment, injuries: Injuries) {
  return {
    barbell: equipment === "gym",
    pullupBar: true,
    kneeOK: !injuries.knees,
    backOK: !injuries.back,
    shoulderOK: !injuries.shoulders,
  };
}

// ---------- מיקרו־סייקל 4 שבועות + התאמת נפח לזמן/ניסיון ----------
function setScheme(week: number, exp: Experience) {
  // שבוע 1–3 עומס עולה, שבוע 4 דלואד 60% סטים
  const base = exp === "advanced" ? { H: 5, M: 4, L: 3 }
            : exp === "intermediate" ? { H: 4, M: 3, L: 3 }
            : { H: 3, M: 3, L: 2 };
  const mult = week === 4 ? 0.6 : week === 3 ? 1.1 : week === 2 ? 1.0 : 0.9;
  return {
    heavy: Math.max(2, Math.round(base.H * mult)),
    moderate: Math.max(2, Math.round(base.M * mult)),
    light: Math.max(1, Math.round(base.L * mult)),
    repHint: week === 1 ? "12–15" : week === 2 ? "8–12" : week === 3 ? "6–10" : "10–12 (deload)",
  };
}

function trimByTime(items: AIExercise[], sessionMin: number) {
  const maxItems = sessionMin <= 30 ? 4 : sessionMin <= 45 ? 5 : sessionMin <= 60 ? 6 : 7;
  return items.slice(0, maxItems);
}

// ---------- בניית שבוע ----------
function buildWeek(week: number, splitBlocks: string[], input: AIInput): AIWeek {
  const { equipment, experience, injuries, sessionLengthMin } = input;
  const scheme = setScheme(week, experience);
  const can = canDo(equipment, injuries);

  const build = (block: string): AIExercise[] => {
    const U = () => poolUpper(can, scheme.heavy, scheme.moderate, scheme.light);
    const L = () => poolLegs(can, scheme.heavy, scheme.moderate, scheme.light);
    const BS = () => poolBackShoulders(can, scheme.heavy, scheme.moderate, scheme.light);
    if (block === "upper") return trimByTime(U(), sessionLengthMin);
    if (block === "legs") return trimByTime(L(), sessionLengthMin);
    if (block === "backShoulders") return trimByTime(BS(), sessionLengthMin);
    if (block === "cardioCore") return poolCardioCore();
    if (block === "hiit") return poolHIIT();
    if (block === "activeRest") return poolActiveRest();
    if (block === "rest") return poolRest();
    return [];
  };

  const days = splitBlocks.map((b, i) => ({
    dayIdx: i,
    block: b,
    items: build(b).map(e => ({ ...e, reps: e.reps })) // repHint אפשר גם לצרף
  }));
  return { week, days };
}

// ---------- מחולל ראשי ----------
export function generateAIPlan(input: AIInput): AIPlan {
  const bmr = bmrMifflin({ weightKg: input.weightKg, heightCm: input.heightCm, age: input.age, gender: input.gender });
  const tdee = Math.round(bmr * activityFactor(input.activity));
  const calories = caloriesForGoal(tdee, input.goal);
  const m = macros(input.weightKg, calories, input.goal);

  const split = chooseSplit(input.daysPerWeek, input.experience);
  const weeks: AIWeek[] = [1, 2, 3, 4].map(w => buildWeek(w, split.blocks, input));

  const notes: string[] = [];
  if (input.goal === "bulk" && input.weightKg / ((input.heightCm / 100) ** 2) >= 27) {
    notes.push("High BMI – consider short cut before bulking.");
  }
  if (input.injuries.knees || input.injuries.back || input.injuries.shoulders) {
    notes.push("Exercises adapted for injuries; keep pain-free range and consult a pro if needed.");
  }
  if (input.preferences) {
    notes.push(`Preferences noted: ${input.preferences}`);
  }

  const nutrition: AINutrition = {
    tdee,
    calories,
    proteinGr: m.protein,
    fatGr: m.fat,
    carbsGr: m.carbs,
    rationale: input.goal === "cut"
      ? "Caloric deficit ~15% with higher protein to preserve lean mass."
      : input.goal === "bulk"
      ? "Small surplus ~10% to support hypertrophy with manageable fat gain."
      : input.goal === "strength"
      ? "Slight surplus to push strength while controlling bodyweight."
      : "Maintenance calories for recomposition/health.",
  };

  return {
    summary: {
      split: split.name,
      microcycle: "3-up-1-down",
      notes,
    },
    nutrition,
    weeks,
  };
}
