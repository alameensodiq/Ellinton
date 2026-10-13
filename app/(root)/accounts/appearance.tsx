import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import AsyncStorage from "@react-native-async-storage/async-storage";

const C = {
  bgPage: "#3F401B",
  bgDark: "#969841",
  bgMid: "#4a4b20",
  accent: "#969841",
  gold: "#FBCD58",
  white: "#FFFFFF",
  cardBorder: "#E8E5DC",
  textPrimary: "#2A2B0F",
  textSub: "#7A7B5A",
};

type ThemeMode = "system" | "light" | "dark";

export default function AppearanceScreen() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>("light");

  useEffect(() => { loadTheme(); }, []);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem("app_theme");
      if (stored === "system" || stored === "light" || stored === "dark") setSelectedTheme(stored);
    } catch (e) { console.log(e); }
  };

  const handleSelectTheme = async (theme: ThemeMode) => {
    setSelectedTheme(theme);
    await AsyncStorage.setItem("app_theme", theme);
  };

  const themes = [
    {
      id: "light" as ThemeMode,
      label: "Light Mode",
      subtitle: "Clean, high-clarity daylight interface with olive accents",
      icon: "white-balance-sunny",
      iconBg: "#FFFFF0",
      iconBorder: "#D4D47A",
      iconColor: "#969841",
    },
    {
      id: "dark" as ThemeMode,
      label: "Dark Mode",
      subtitle: "Deep olive-dark theme that reduces eye strain in dim environments",
      icon: "moon-waning-crescent",
      iconBg: "#2A2B10",
      iconBorder: "#4a4b20",
      iconColor: "#FBCD58",
    },
    {
      id: "system" as ThemeMode,
      label: "System Default",
      subtitle: "Automatically matches your device's system appearance settings",
      icon: "cellphone-cog",
      iconBg: "#EEEEE4",
      iconBorder: C.cardBorder,
      iconColor: C.bgMid,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="App Appearance" />

      <ScrollView className="flex-1 px-4 py-2" contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "Outfit", marginBottom: 20, paddingHorizontal: 4, lineHeight: 18 }}>
          Choose your interface preference. You can switch between crisp daytime clarity or deep contrast for low-light environments.
        </Text>

        <View style={{ gap: 12 }}>
          {themes.map((theme) => {
            const sel = selectedTheme === theme.id;
            return (
              <Pressable
                key={theme.id}
                onPress={() => handleSelectTheme(theme.id)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                  backgroundColor: C.white,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? C.bgDark : C.cardBorder,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOpacity: sel ? 0.1 : 0.04,
                  shadowRadius: 6,
                  elevation: sel ? 3 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1, marginRight: 12 }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 14,
                    backgroundColor: theme.iconBg,
                    borderColor: theme.iconBorder, borderWidth: 1,
                    justifyContent: "center", alignItems: "center",
                  }}>
                    <MaterialCommunityIcons name={theme.icon as any} size={24} color={theme.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold" }}>{theme.label}</Text>
                    <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginTop: 3 }}>{theme.subtitle}</Text>
                  </View>
                </View>

                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: sel ? C.bgDark : C.white,
                  borderColor: sel ? C.bgDark : C.cardBorder,
                  borderWidth: 1.5,
                  justifyContent: "center", alignItems: "center",
                }}>
                  {sel && <MaterialCommunityIcons name="check" size={13} color={C.white} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Active indicator */}
        <View
          style={{ backgroundColor: "rgba(150,152,65,0.1)", borderColor: "rgba(150,152,65,0.4)", borderWidth: 1 }}
          className="mt-5 p-4 rounded-xl flex-row items-center gap-3"
        >
          <MaterialCommunityIcons name="palette-outline" size={20} color={C.accent} />
          <Text style={{ color: C.bgMid, fontSize: 12, fontFamily: "Outfit", flex: 1 }}>
            Currently active: <Text style={{ fontFamily: "OutfitBold" }}>{themes.find((t) => t.id === selectedTheme)?.label}</Text>. Changes take effect immediately.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
