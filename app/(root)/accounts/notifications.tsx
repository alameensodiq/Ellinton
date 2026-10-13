import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
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
  textMuted: "#9A9B7A",
};

const NOTIF_STORAGE_KEY = "user_notification_preferences";

export default function NotificationPreferencesScreen() {
  const [pushTxAlerts, setPushTxAlerts] = useState(true);
  const [pushSecurityAlerts, setPushSecurityAlerts] = useState(true);
  const [pushOffers, setPushOffers] = useState(false);
  const [smsTxAlerts, setSmsTxAlerts] = useState(true);
  const [smsSecurityOtp, setSmsSecurityOtp] = useState(true);
  const [emailInstantReceipts, setEmailInstantReceipts] = useState(true);
  const [emailMonthlySummary, setEmailMonthlySummary] = useState(true);
  const [emailNewsletters, setEmailNewsletters] = useState(false);

  useEffect(() => { loadPreferences(); }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        if (p.pushTxAlerts !== undefined) setPushTxAlerts(p.pushTxAlerts);
        if (p.pushSecurityAlerts !== undefined) setPushSecurityAlerts(p.pushSecurityAlerts);
        if (p.pushOffers !== undefined) setPushOffers(p.pushOffers);
        if (p.smsTxAlerts !== undefined) setSmsTxAlerts(p.smsTxAlerts);
        if (p.smsSecurityOtp !== undefined) setSmsSecurityOtp(p.smsSecurityOtp);
        if (p.emailInstantReceipts !== undefined) setEmailInstantReceipts(p.emailInstantReceipts);
        if (p.emailMonthlySummary !== undefined) setEmailMonthlySummary(p.emailMonthlySummary);
        if (p.emailNewsletters !== undefined) setEmailNewsletters(p.emailNewsletters);
      }
    } catch (e) { console.log(e); }
  };

  const savePreference = async (key: string, value: boolean) => {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : {};
      existing[key] = value;
      await AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) { console.log(e); }
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <Text style={{ color: "#D1D1D1", fontSize: 11, fontFamily: "OutfitBold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, marginTop: 4 }}>
      {label}
    </Text>
  );

  const Divider = () => <View style={{ height: 1, backgroundColor: C.cardBorder, marginHorizontal: 16 }} />;

  const ToggleRow = ({ title, subtitle, value, onChange, disabled }: {
    title: string; subtitle: string; value: boolean; onChange?: (v: boolean) => void; disabled?: boolean;
  }) => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold" }}>{title}</Text>
        <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginTop: 3 }}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ false: "#CBD5E1", true: C.accent }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Notification Preferences" />

      <ScrollView className="flex-1 px-4 py-2" contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        <SectionLabel label="Push Notifications" />
        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl mb-5 shadow-sm overflow-hidden">
          <ToggleRow title="Transaction Alerts" subtitle="Instant alerts on money received, sent, or bill payments" value={pushTxAlerts} onChange={(v) => { setPushTxAlerts(v); savePreference("pushTxAlerts", v); }} />
          <Divider />
          <ToggleRow title="Security Notices" subtitle="New device logins, passcode resets, and card freezes" value={pushSecurityAlerts} onChange={(v) => { setPushSecurityAlerts(v); savePreference("pushSecurityAlerts", v); }} />
          <Divider />
          <ToggleRow title="Product Updates & Rates" subtitle="New savings rates, features, and system maintenance" value={pushOffers} onChange={(v) => { setPushOffers(v); savePreference("pushOffers", v); }} />
        </View>

        <SectionLabel label="SMS Alerts" />
        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl mb-2 shadow-sm overflow-hidden">
          <ToggleRow title="Debit & Credit SMS" subtitle="Real-time SMS to your verified phone number" value={smsTxAlerts} onChange={(v) => { setSmsTxAlerts(v); savePreference("smsTxAlerts", v); }} />
          <Divider />
          <ToggleRow title="Critical Security OTPs" subtitle="Required one-time codes (mandatory for safety)" value={smsSecurityOtp} disabled />
        </View>

        {/* Regulatory Disclosure */}
        <View
          style={{ backgroundColor: "rgba(251,205,88,0.12)", borderColor: "rgba(251,205,88,0.5)", borderWidth: 1 }}
          className="p-3 rounded-xl mb-5 flex-row items-center gap-2.5"
        >
          <MaterialCommunityIcons name="information" size={18} color="#ca8a04" />
          <Text style={{ color: "#78350f", fontSize: 11, fontFamily: "Outfit", lineHeight: 16, flex: 1 }}>
            CBN Regulatory Disclosure: Standard SMS notification charges of ₦4.00 per SMS may apply to voluntary transaction SMS alerts.
          </Text>
        </View>

        <SectionLabel label="Email Statements & Receipts" />
        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl mb-5 shadow-sm overflow-hidden">
          <ToggleRow title="Instant Email Receipts" subtitle="Official PDF receipt sent after every transfer" value={emailInstantReceipts} onChange={(v) => { setEmailInstantReceipts(v); savePreference("emailInstantReceipts", v); }} />
          <Divider />
          <ToggleRow title="Monthly Summary Statement" subtitle="Account statement emailed on the 1st of each month" value={emailMonthlySummary} onChange={(v) => { setEmailMonthlySummary(v); savePreference("emailMonthlySummary", v); }} />
          <Divider />
          <ToggleRow title="Newsletters & Finance Tips" subtitle="Quarterly market digests and wealth management tips" value={emailNewsletters} onChange={(v) => { setEmailNewsletters(v); savePreference("emailNewsletters", v); }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
