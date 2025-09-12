// app/_layout.tsx
import "../lib/i18n";
import i18n from "../lib/i18n";
import { I18nextProvider } from "react-i18next";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, I18nManager } from "react-native";

function applyRTL(lang: string) {
  const rtl = lang === "he";
  if (Platform.OS === "web") {
    if (typeof document !== "undefined") {
      document.documentElement.dir = rtl ? "rtl" : "ltr";
    }
  } else {
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(rtl);
    }
  }
}

export default function RootLayout() {
  useEffect(() => {
    applyRTL(i18n.language);
    const onChange = (lng: string) => applyRTL(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <Stack screenOptions={{ headerShown: false }} />
    </I18nextProvider>
  );
}
