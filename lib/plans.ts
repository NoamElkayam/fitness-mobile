// lib/plans.ts
export type Goal = "maintain" | "cut" | "bulk" | "strength";

export type Equipment = "home" | "gym";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Injuries = { knees: boolean; back: boolean; shoulders: boolean; none: boolean };

export type BlockKey =
  | "upper"
  | "legs"
  | "backShoulders"
  | "cardioCore"
  | "hiit"
  | "activeRest"
  | "rest";

export type DayPlan = {
  day: number;       // 0..6 (א׳..ש׳)
  block: BlockKey;   // סוג האימון
  items: Exercise[]; // רשימת תרגילים עם סטים/חזרות
};

export type Exercise = {
  name: string;
  sets: number;
  reps: string;      // "8–10" / "12–15" / "10 min" וכו׳
  note?: string;
};

export type PlanInput = {
  daysPerWeek: number;      // 2..7
  equipment: Equipment;     // בית / חדר כושר
  experience: Experience;   // מתחיל / בינוני / מתקדם
  injuries: Injuries;       // פציעות
};

/** BMI + קטגוריה לצ׳יפ הצבעוני */
export function calcBMI(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  let category: "underweight" | "normal" | "overweight" | "obese" = "normal";
  if (bmi < 18.5) category = "underweight";
  else if (bmi < 25) category = "normal";
  else if (bmi < 30) category = "overweight";
  else category = "obese";
  return { bmi: Number(bmi.toFixed(1)), category };
}

/** מפיק לוח שבועי (מה לשים בכל יום) לפי מס׳ ימי אימון */
function getWeeklyBlocks(daysPerWeek: number): BlockKey[] {
  // 7 ימים תמיד — דוחפים Rest/ActiveRest לימים בלי אימון
  // דוגמאות סנסיביליות לכל כמות ימים
  switch (daysPerWeek) {
    case 2:
      return ["upper", "rest", "legs", "rest", "cardioCore", "rest", "rest"];
    case 3:
      return ["upper", "legs", "backShoulders", "rest", "cardioCore", "rest", "rest"];
    case 4:
      return ["upper", "legs", "rest", "backShoulders", "cardioCore", "rest", "activeRest"];
    case 5:
      return ["upper", "legs", "hiit", "backShoulders", "cardioCore", "activeRest", "rest"];
    case 6:
      return ["upper", "legs", "hiit", "backShoulders", "cardioCore", "activeRest", "rest"];
    case 7:
      return ["upper", "legs", "hiit", "backShoulders", "cardioCore", "activeRest", "rest"];
    default:
      return ["upper", "rest", "legs", "rest", "cardioCore", "rest", "rest"];
  }
}

/** מייצר רשימת תרגילים לפי בלוק + ציוד + ניסיון + פציעות */
function buildExercises(
  block: BlockKey,
  equipment: Equipment,
  exp: Experience,
  inj: Injuries
): Exercise[] {
  const heavy = exp === "advanced" ? 5 : exp === "intermediate" ? 4 : 3;
  const moderate = exp === "advanced" ? 4 : 3;
  const light = 3;

  // עוזר להחליף תרגילים בעייתיים לפי פציעות/ציוד
  const can = {
    barbell: equipment === "gym",
    pullupBar: equipment !== "home" ? true : true, // גם בבית יש מיתח לפעמים
    kneeOK: !inj.knees,
    backOK: !inj.back,
    shoulderOK: !inj.shoulders,
  };

  const ex: Record<BlockKey, Exercise[]> = {
    upper: [
      // חזה
      can.shoulderOK && can.barbell
        ? { name: "Barbell bench press", sets: heavy, reps: "4–6" }
        : { name: "Dumbbell bench press / Push-ups", sets: heavy, reps: "6–10" },
      // גב משיכה
      can.pullupBar
        ? { name: "Pull-ups or Lat pulldown", sets: moderate, reps: "6–10" }
        : { name: "Single-arm row (DB)", sets: moderate, reps: "8–12" },
      // כתפיים
      can.shoulderOK
        ? { name: "Shoulder press (DB/Machine)", sets: moderate, reps: "8–12" }
        : { name: "Front/side raises light", sets: light, reps: "12–15", note: "pain-free range" },
      // ידיים
      { name: "Biceps curls", sets: light, reps: "10–15" },
      { name: "Triceps pushdowns / extensions", sets: light, reps: "10–15" },
    ],
    legs: [
      can.kneeOK && can.barbell
        ? { name: "Squat (barbell or hack machine)", sets: heavy, reps: "4–8" }
        : can.kneeOK
        ? { name: "Goblet squat / Leg press", sets: heavy, reps: "8–12" }
        : { name: "Hip hinge focus + step-ups low", sets: moderate, reps: "10–12", note: "knee-friendly" },
      can.backOK
        ? { name: "Romanian deadlift", sets: moderate, reps: "6–10" }
        : { name: "Hip thrust / Glute bridge", sets: moderate, reps: "8–12" },
      { name: "Lunges / Split squat", sets: light, reps: "10–12" },
      { name: "Calf raises", sets: light, reps: "12–15" },
      { name: "Core (plank/abs)", sets: light, reps: "60–90s / 12–15" },
    ],
    backShoulders: [
      { name: "Row (cable/DB/T-bar)", sets: heavy, reps: "6–10" },
      can.shoulderOK
        ? { name: "Face pulls / Rear-delt raises", sets: moderate, reps: "12–15" }
        : { name: "Scap drills (YTWL)", sets: light, reps: "12–15" },
      { name: "Lat focus (pulldown/pull-ups)", sets: moderate, reps: "6–10" },
      can.shoulderOK
        ? { name: "Lateral raises", sets: light, reps: "12–15" }
        : { name: "External rotations (band)", sets: light, reps: "12–15" },
    ],
    cardioCore: [
      { name: "Bike / brisk walk", sets: 1, reps: "25–35 min" },
      { name: "Abs circuit", sets: 3, reps: "12–15" },
      { name: "Mobility (hips/shoulders)", sets: 1, reps: "8–10 min" },
    ],
    hiit: [
      { name: "Intervals 30:30 (run/row/bike)", sets: 1, reps: "20–25 min" },
      { name: "Cool-down + mobility", sets: 1, reps: "10 min" },
    ],
    activeRest: [
      { name: "Walk", sets: 1, reps: "30–45 min" },
      { name: "Stretching & foam roll", sets: 1, reps: "10–15 min" },
    ],
    rest: [{ name: "Rest / Recovery", sets: 0, reps: "-", note: "sleep, hydration" }],
  };

  return ex[block].filter(Boolean) as Exercise[];
}

/** בניית תוכנית שבועית מלאה */
export function generatePlan(input: PlanInput): DayPlan[] {
  const blocks = getWeeklyBlocks(Math.max(2, Math.min(7, input.daysPerWeek)));
  return blocks.map((block, idx) => ({
    day: idx, // 0..6
    block,
    items: buildExercises(block, input.equipment, input.experience, input.injuries),
  }));
}
