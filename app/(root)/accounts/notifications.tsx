import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchAccountInfo, updateNotificationPreference } from "@/app/lib/thunks/accountThunks";

const C = {
  bgPage: "#3F401B",
  accent: "#969841",
  white: "#FFFFFF",
  cardBorder: "#E8E5DC",
  textPrimary: "#2A2B0F",
  textSub: "#7A7B5A",
};

const PREFERENCES = [
  { value: 0, title: "No alerts", subtitle: "Do not send transaction alerts" },
  { value: 1, title: "SMS alerts", subtitle: "Send alerts to your verified phone number" },
  { value: 2, title: "Email alerts", subtitle: "Send alerts to your registered email address" },
  { value: 3, title: "SMS & email alerts", subtitle: "Send alerts by both SMS and email" },
] as const;

export default function NotificationPreferencesScreen() {
  const dispatch = useAppDispatch();
  const accountInfo = useAppSelector((state) => state.accounts.accountInfo);
  const [preference, setPreference] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAccountInfo());
  }, [dispatch]);

  console.log(accountInfo)

  useEffect(() => {
    const value = accountInfo?.notificationPreference;
    if (value !== undefined && value >= 0 && value <= 3) {
      setPreference(value);
    }
  }, [accountInfo?.notificationPreference]);

  const selectPreference = async (value: number) => {
    if (isSaving || value === preference) return;

    const previousPreference = preference;
    setPreference(value);
    setIsSaving(true);

    try {
      await dispatch(updateNotificationPreference(value)).unwrap();
    } catch (error) {
      setPreference(previousPreference);
      Alert.alert("Unable to update alerts", typeof error === "string" ? error : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Notification Preferences" />

      <ScrollView className="flex-1 px-4 py-2" contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: "#D1D1D1", fontSize: 11, fontFamily: "OutfitBold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, marginTop: 4 }}>
          Transaction alerts
        </Text>

        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl mb-2 shadow-sm overflow-hidden">
          {PREFERENCES.map((option, index) => {
            const selected = preference === option.value;
            return (
              <React.Fragment key={option.value}>
                {index > 0 && <View style={{ height: 1, backgroundColor: C.cardBorder, marginHorizontal: 16 }} />}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: isSaving }}
                  disabled={isSaving}
                  onPress={() => selectPreference(option.value)}
                  style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center" }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: C.textPrimary, fontSize: 14, fontFamily: "OutfitBold" }}>{option.title}</Text>
                    <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginTop: 3 }}>{option.subtitle}</Text>
                  </View>
                  <MaterialCommunityIcons name={selected ? "radiobox-marked" : "radiobox-blank"} size={24} color={selected ? C.accent : "#94A3B8"} />
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>

        <View style={{ backgroundColor: "rgba(251,205,88,0.12)", borderColor: "rgba(251,205,88,0.5)", borderWidth: 1 }} className="p-3 rounded-xl mb-5 flex-row items-center gap-2.5">
          {isSaving ? <ActivityIndicator size="small" color="#ca8a04" /> : <MaterialCommunityIcons name="information" size={18} color="#ca8a04" />}
          <Text style={{ color: "#78350f", fontSize: 11, fontFamily: "Outfit", lineHeight: 16, flex: 1 }}>
            Standard SMS notification charges of ₦6.50 per SMS may apply to SMS transaction alerts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
