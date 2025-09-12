// components/ui/LanguageToggle.tsx
import { useTranslation } from "react-i18next";
import { View, Pressable, Text } from "react-native";

export default function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const cur = i18n.language;

  return (
    <View style={{ flexDirection: "row" }}>
      <Pressable
        onPress={() => i18n.changeLanguage("he")}
        style={{
          backgroundColor: cur === "he" ? "#16a34a" : "#374151",
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          marginRight: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>{t("hebrew")}</Text>
      </Pressable>

      <Pressable
        onPress={() => i18n.changeLanguage("en")}
        style={{
          backgroundColor: cur === "en" ? "#16a34a" : "#374151",
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>{t("english")}</Text>
      </Pressable>
    </View>
  );
}
