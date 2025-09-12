// app/(tabs)/_layout.tsx
import { Slot } from "expo-router";

/**
 * Layout פשוט לקבוצת tabs:
 * אין כאן ייבוא של HapticTab / IconSymbol / TabBarBackground בכלל,
 * כך שלא יהיו שגיאות מודול.
 */
export default function TabsGroupLayout() {
  return <Slot />;
}
