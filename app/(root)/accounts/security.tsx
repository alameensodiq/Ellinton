import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { MfaReset, ResetPinOtp } from "@/app/lib/thunks/authThunks";
import { TransactionPinValidation } from "@/app/lib/thunks/transferThunks";
import { useRouter } from "expo-router";

const C = {
  bgPage: "#3F401B",
  bgDark: "#969841",
  bgMid: "#4a4b20",
  accent: "#969841",
  gold: "#FBCD58",
  green: "#21D184",
  white: "#FFFFFF",
  cardBorder: "#E8E5DC",
  textPrimary: "#2A2B0F",
  textSub: "#7A7B5A",
  textMuted: "#9A9B7A",
};

const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
const TRANS_PIN_KEY = "transBiometricPin";
const LOGIN_BIOMETRIC_KEY = "loginBiometricEnabled";

interface ActiveDevice {
  id: string;
  name: string;
  type: "mobile" | "tablet" | "desktop";
  lastActive: string;
  ip: string;
  isCurrent: boolean;
}

const DEFAULT_DEVICES: ActiveDevice[] = [
  { id: "dev_curr", name: Platform.OS === "ios" ? "iPhone 15 Pro" : "Android Device", type: "mobile", lastActive: "Active Now", ip: "102.89.44.12 • Lagos, NG", isCurrent: true },
  { id: "dev_2", name: 'MacBook Pro 16" (Chrome)', type: "desktop", lastActive: "Yesterday, 4:18 PM", ip: "102.89.44.15 • Lagos, NG", isCurrent: false },
  { id: "dev_3", name: "iPad Air 5th Gen", type: "tablet", lastActive: "Oct 04, 2026", ip: "197.210.52.88 • Abuja, NG", isCurrent: false },
];

export default function SecurityScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_required ?? false);
  const [loginBiometric, setLoginBiometric] = useState(true);
  const [transBiometric, setTransBiometric] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [devices, setDevices] = useState<ActiveDevice[]>(DEFAULT_DEVICES);

  useEffect(() => {
    setMfaEnabled(user?.mfa_required ?? false);
    loadBiometrics();
  }, [user?.mfa_required]);

  const loadBiometrics = async () => {
    try {
      const [storedTrans, storedLogin] = await Promise.all([
        AsyncStorage.getItem(TRANS_BIOMETRIC_KEY),
        AsyncStorage.getItem(LOGIN_BIOMETRIC_KEY),
      ]);
      if (storedTrans !== null) setTransBiometric(storedTrans === "true" || JSON.parse(storedTrans) === true);
      if (storedLogin !== null) setLoginBiometric(storedLogin === "true" || JSON.parse(storedLogin) === true);
    } catch (e) { console.log(e); }
  };

  const handleMfaToggle = async (val: boolean) => {
    setMfaEnabled(val);
    try {
      await dispatch(MfaReset({ enabled: val })).unwrap();
      const ex = await AsyncStorage.getItem("data");
      if (ex) { const p = JSON.parse(ex); p.mfa_required = val; await AsyncStorage.setItem("data", JSON.stringify(p)); }
    } catch (err: any) {
      setMfaEnabled(!val);
      Alert.alert("MFA Error", err?.message || "Failed to update MFA.");
    }
  };

  const handleLoginBiometricToggle = async (val: boolean) => {
    if (val) {
      try {
        const hasHW = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHW || !enrolled) { Alert.alert("Biometrics Not Available", "Please set up Face ID or Fingerprint on your device."); setLoginBiometric(false); return; }
        await AsyncStorage.setItem(LOGIN_BIOMETRIC_KEY, JSON.stringify(true));
        setLoginBiometric(true);
      } catch { setLoginBiometric(false); }
    } else {
      await AsyncStorage.setItem(LOGIN_BIOMETRIC_KEY, JSON.stringify(false));
      setLoginBiometric(false);
    }
  };

  const handleTransBiometricToggle = async (val: boolean) => {
    if (val) {
      try {
        const hasHW = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHW || !enrolled) { Alert.alert("Biometrics Not Available", "Please set up fingerprint or Face ID."); setTransBiometric(false); return; }
        setPinValue(""); setPinError(""); setShowPinModal(true);
      } catch { setTransBiometric(false); }
    } else {
      await AsyncStorage.removeItem(TRANS_PIN_KEY);
      await AsyncStorage.setItem(TRANS_BIOMETRIC_KEY, JSON.stringify(false));
      setTransBiometric(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pinValue.length !== 4) { setPinError("Please enter a 4-digit PIN"); return; }
    setSavingPin(true);
    try {
      await dispatch(TransactionPinValidation({ pin: pinValue })).unwrap();
      await AsyncStorage.setItem(TRANS_PIN_KEY, pinValue);
      await AsyncStorage.setItem(TRANS_BIOMETRIC_KEY, JSON.stringify(true));
      setTransBiometric(true);
      setShowPinModal(false); setPinValue(""); setPinError("");
      Alert.alert("Biometrics Active", "You can now authenticate transfers with biometrics.");
    } catch (err: any) {
      setPinError(typeof err === "string" ? err : err?.message || "Invalid transaction PIN.");
    } finally { setSavingPin(false); }
  };

  const handleLogoutOtherDevices = () => {
    Alert.alert("Log Out Other Devices", "Invalidate all other active sessions?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out All", style: "destructive", onPress: () => { setDevices((p) => p.filter((d) => d.isCurrent)); Alert.alert("Success", "All other sessions revoked."); } },
    ]);
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <Text style={{ color: "#D1D1D1", fontSize: 11, fontFamily: "OutfitBold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, marginTop: 4 }}>
      {label}
    </Text>
  );

  const NavRow = ({ icon, iconBg, iconColor, title, subtitle, onPress }: any) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="px-4 py-4 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3 flex-1 mr-2">
        <View style={{ backgroundColor: iconBg, width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold" }}>{title}</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginTop: 2 }} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={17} color="#B0B49A" />
    </Pressable>
  );

  const ToggleRow = ({ icon, iconBg, iconColor, title, subtitle, value, onChange, disabled }: any) => (
    <View className="px-4 py-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1 mr-3">
        <View style={{ backgroundColor: iconBg, width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold" }}>{title}</Text>
          <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginTop: 2 }} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ false: "#CBD5E1", true: C.accent }} />
    </View>
  );

  const Divider = () => <View style={{ height: 1, backgroundColor: C.cardBorder, marginHorizontal: 16 }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Security & Passcode" />

      <ScrollView className="flex-1 px-4 py-2" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* SECTION 1: PASSCODE & PIN */}
        <SectionLabel label="Passcode & PIN" />
        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl mb-5 shadow-sm overflow-hidden">
          <NavRow icon="lock-reset" iconBg="#EEEEE4" iconColor={C.bgMid} title="Change App Passcode" subtitle="Update your 6-digit login passcode" onPress={() => router.push("/(root)/account-settings/change-passcode")} />
          <Divider />
          <NavRow icon="numeric" iconBg="#EEEEE4" iconColor={C.bgMid} title="Change Transaction PIN" subtitle="Update 4-digit transfer approval PIN" onPress={() => router.push("/(root)/account-settings/change-transaction-pin")} />
          <Divider />
          <NavRow
            icon="key-wireless"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Forgot Transaction PIN?"
            subtitle="Request OTP to reset transfer PIN"
            onPress={async () => {
              try { await dispatch(ResetPinOtp()).unwrap(); router.push("/(root)/account-settings/reset-transaction-pin"); }
              catch { router.push("/(root)/account-settings/reset-transaction-pin"); }
            }}
          />
        </View>

        {/* SECTION 2: BIOMETRIC & MFA */}
        <SectionLabel label="Biometric & Multi-Factor" />
        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl mb-5 shadow-sm overflow-hidden">
          <ToggleRow icon="face-recognition" iconBg="#EEEEE4" iconColor={C.bgMid} title="Biometric Login" subtitle="Sign in using Face ID or Fingerprint" value={loginBiometric} onChange={handleLoginBiometricToggle} />
          <Divider />
          <ToggleRow icon="shield-check-outline" iconBg="#EEEEE4" iconColor={C.bgMid} title="Two-Factor Auth (MFA)" subtitle="Require SMS/Email OTP on new device login" value={mfaEnabled} onChange={handleMfaToggle} />
          <Divider />
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3.5 flex-1 mr-2">
              <View style={{ backgroundColor: "#EEEEE4" }} className="w-10 h-10 rounded-xl justify-center items-center">
                <MaterialCommunityIcons name="fingerprint" size={20} color={C.bgMid} />
              </View>
              <View className="flex-1">
                <Text style={{ color: C.textPrimary }} className="text-sm font-outfit-bold">Transaction Pin Biometric</Text>
                <Text style={{ color: C.textSub }} className="text-xs font-outfit mt-0.5" numberOfLines={1}>Approve transfers with Face ID / Fingerprint</Text>
              </View>
            </View>
            <Switch
              value={transBiometric}
              onValueChange={handleTransBiometricToggle}
              trackColor={{ false: "#CBD5E1", true: "#63642A" }}
              thumbColor={transBiometric ? "#fff" : "#ccc"}
              ios_backgroundColor="#CBD5E1"
            />
          </View>
        </View>

        {/* SECTION 3: ACTIVE SESSIONS */}
        {/* <SectionLabel label="Active Sessions & Devices" />
        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-4 mb-4 shadow-sm">
          <View style={{ gap: 12, marginBottom: 16 }}>
            {devices.map((device, i) => (
              <View
                key={device.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottomWidth: i < devices.length - 1 ? 1 : 0,
                  borderBottomColor: C.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: "#EEEEE4", justifyContent: "center", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name={device.type === "desktop" ? "laptop" : device.type === "tablet" ? "tablet" : "cellphone"}
                      size={18}
                      color={C.bgMid}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={{ color: C.textPrimary, fontSize: 12, fontFamily: "OutfitBold" }}>{device.name}</Text>
                      {device.isCurrent && (
                        <View style={{ backgroundColor: "rgba(33,209,132,0.12)", borderColor: "rgba(33,209,132,0.35)", borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: "#16a34a", fontSize: 9, fontFamily: "OutfitBold" }}>THIS DEVICE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: C.textMuted, fontSize: 10, fontFamily: "Outfit", marginTop: 2 }}>{device.ip}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontFamily: "OutfitMedium", color: device.isCurrent ? C.green : C.textMuted }}>
                  {device.lastActive}
                </Text>
              </View>
            ))}
          </View>

          {devices.length > 1 && (
            <Pressable
              onPress={handleLogoutOtherDevices}
              style={{ backgroundColor: "#FEF2F2", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#DC2626", fontSize: 12, fontFamily: "OutfitBold" }}>Log Out All Other Devices</Text>
            </Pressable>
          )}
        </View> */}
      </ScrollView>

      {/* PIN MODAL */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowPinModal(false); setPinValue(""); setPinError(""); setTransBiometric(false); }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "100%", maxWidth: 380, alignItems: "center" }}>
            <View style={{ backgroundColor: "rgba(150,152,65,0.15)", width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <MaterialCommunityIcons name="fingerprint" size={28} color="#969841" />
            </View>
            <Text style={{ color: C.textPrimary, fontSize: 18, fontFamily: "OutfitBold", marginBottom: 4 }}>Authorize Biometrics</Text>
            <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "Outfit", textAlign: "center", marginBottom: 24, paddingHorizontal: 16 }}>
              Enter your 4-digit transaction PIN to link Face ID / Fingerprint to your Ellington wallet.
            </Text>
            <OtpInput
              digitCount={4}
              value={pinValue}
              onChange={(val) => { setPinValue(val); setPinError(""); }}
              secure
              autoFocus
              inputStyle="w-12 h-12 text-lg"
            />
            {pinError ? <Text style={{ color: "#DC2626", fontSize: 12, fontFamily: "Outfit", textAlign: "center", marginTop: 12 }}>{pinError}</Text> : null}
            <View style={{ flexDirection: "row", width: "100%", marginTop: 24, gap: 10 }}>
              <Pressable
                onPress={() => { setShowPinModal(false); setPinValue(""); setPinError(""); setTransBiometric(false); }}
                style={{ flex: 1, borderColor: "#E8E5DC", borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
              >
                <Text style={{ color: C.textPrimary, fontFamily: "OutfitBold", fontSize: 14 }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handlePinSubmit}
                disabled={savingPin}
                style={{ flex: 1, backgroundColor: "#969841", opacity: savingPin ? 0.7 : 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "OutfitBold", fontSize: 14 }}>{savingPin ? "Validating..." : "Confirm PIN"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
