import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase";
import { getUserProfile, logoutUser, MfaReset } from "@/app/lib/thunks/authThunks";
import { fetchAccountInfo } from "@/app/lib/thunks/accountThunks";
import * as LocalAuthentication from "expo-local-authentication";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import OtpInput from "@/app/components/inputs/OtpInput";
import { TransactionPinValidation } from "@/app/lib/thunks/transferThunks";

const LOGIN_BIOMETRIC_KEY = "loginBiometricEnabled";
const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
const TRANS_PIN_KEY = "transBiometricPin";

// ─── App Color Tokens ────────────────────────────────────────────────────────
const C = {
  bgPage: "#3F401B",           // dark olive page background (matches Dashboard)
  bgDark: "#969841",           // primary dark olive (tab bar / card header)
  bgMid: "#4a4b20",            // slightly lighter olive
  accent: "#969841",           // active olive-yellow
  gold: "#FBCD58",             // gold highlight
  green: "#21D184",            // success green
  white: "#FFFFFF",
  card: "#FFFFFF",
  cardBorder: "#E8E5DC",       // warm grey border
  sectionHeader: "#7A7B5A",    // muted olive for section labels
  textPrimary: "#2A2B0F",      // very dark olive for body text
  textSub: "#7A7B5A",          // muted olive for subtitles
  chevron: "#B0B49A",
  red: "#DC2626",
};

export default function AccountScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const accountInfo = useAppSelector((state) => state.accounts.accountInfo);

  const [copied, setCopied] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginBiometric, setLoginBiometric] = useState(false);

  useEffect(() => {
    dispatch(getUserProfile());
    dispatch(fetchAccountInfo());
    loadLoginBiometric();
  }, [dispatch]);

  const loadLoginBiometric = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOGIN_BIOMETRIC_KEY);
      if (stored !== null) setLoginBiometric(stored === "true" || JSON.parse(stored) === true);
      const storedTrans = await AsyncStorage.getItem(TRANS_BIOMETRIC_KEY);
      if (storedTrans !== null) setTransBiometric(storedTrans === "true" || JSON.parse(storedTrans) === true);
    } catch (e) { console.log(e); }
  };

  // ─── Transaction Pin Biometric ─────────────────────────────────────────────
  const [transBiometric, setTransBiometric] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  const handleTransBiometricToggle = async (val: boolean) => {
    if (val) {
      try {
        const hasHW = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHW || !enrolled) {
          Alert.alert("Biometrics Not Available", "Please set up fingerprint or Face ID on your device.");
          return;
        }
        setPinValue("");
        setPinError("");
        setShowPinModal(true);
      } catch {
        setTransBiometric(false);
      }
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
      setShowPinModal(false);
      setPinValue("");
    } catch (err: any) {
      setPinError(typeof err === "string" ? err : err?.message || "Invalid transaction PIN.");
    } finally {
      setSavingPin(false);
    }
  };

  const accountNumber =
    accountInfo?.accountNumber ||
    (user?.account_number ? String(user.account_number) : "");

  const displayName =
    user?.full_name?.toUpperCase() ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.toUpperCase();

  const profileImageUri =
    typeof user?.passport === "string" && user.passport.trim()
      ? user.passport
      : user?.firebaseUser?.photoURL || null;

  const profileInitials = [user?.first_name, user?.last_name]
    .filter((name): name is string => typeof name === "string" && Boolean(name.trim()))
    .map((name) => name.trim().charAt(0).toUpperCase())
    .join("");

  const hasAccount = Boolean(user?.account_number);
  const kycLevel = hasAccount ? (user?.kyc_level || 1) : 0;

  const handleCopyAccountNumber = async () => {
    await Clipboard.setStringAsync(accountNumber);
    setCopied(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setCopied(false));
    }, 1800);
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await AsyncStorage.removeItem("authToken");
      await dispatch(logoutUser()).unwrap();
      await signOut(auth);
      setSignOutModalVisible(false);
      router.replace("/(auth)/current-user");
    } catch (e) {
      setSignOutModalVisible(false);
      router.replace("/(auth)/current-user");
    } finally {
      setLoggingOut(false);
    }
  };

  const tierLabel =
    kycLevel >= 3 ? "Tier 3" : kycLevel === 2 ? "Tier 2" : kycLevel === 1 ? "Tier 1" : "No Tier";
  const upgradeText =
    kycLevel === 0
      ? "Complete KYC to activate your account"
      : kycLevel === 1
        ? "Upgrade to Tier 2 — Enter NIN"
        : kycLevel === 2
          ? "Upgrade to Tier 3 for Unlimited Transfers"
          : null;

  // ─── Row helper ────────────────────────────────────────────────────────────
  const Row = ({
    icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    onPress,
    badge,
  }: {
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
    onPress?: () => void;
    badge?: React.ReactNode;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="px-4 py-4 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3.5 flex-1 mr-2">
        <View
          style={{ backgroundColor: iconBg }}
          className="w-10 h-10 rounded-xl justify-center items-center"
        >
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text style={{ color: C.textPrimary }} className="text-sm font-outfit-bold">
              {title}
            </Text>
            {badge}
          </View>
          <Text style={{ color: C.textSub }} className="text-xs font-outfit mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={C.chevron} />
    </Pressable>
  );

  const Divider = () => (
    <View style={{ height: 1, backgroundColor: C.cardBorder, marginHorizontal: 16 }} />
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <Text
      style={{ color: C.sectionHeader }}
      className="text-[11px] font-outfit-bold uppercase tracking-widest mb-2 ml-1 mt-1"
    >
      {label}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />

      {/* ── TOP HEADER ─────────────────────────────────────────────────────── */}
      <View
        style={{ backgroundColor: C.bgPage }}
        className="px-5 pt-3 pb-4 flex-row items-center justify-between"
      >
        <Text className="text-xl font-outfit-bold text-white">Account</Text>
        {/* <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/(root)/accounts/notifications" as any)}
            className="w-9 h-9 rounded-full justify-center items-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <Feather name="bell" size={17} color="#FFFFFF" />
          </Pressable>
        </View> */}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BANK CARD ─────────────────────────────────────────────────────── */}
        <View
          style={{ backgroundColor: C.bgMid }}
          className="rounded-3xl p-5 mb-5 shadow-md"
        >
          {/* Emblem */}
          <View className="items-center mb-3">
            <View className="w-14 h-14 rounded-full bg-white justify-center items-center shadow-sm overflow-hidden">
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: C.bgDark }} className="text-xl font-outfit-bold">
                  {profileInitials}
                </Text>
              )}
            </View>
          </View>

          {/* Name */}
          <Text className="text-white text-base font-outfit-bold text-center tracking-wider mb-1">
            {displayName}
          </Text>

          {/* Account number + copy */}
          <View className="flex-row items-center justify-center gap-2 mb-3">
            <Text style={{ color: C.accent }} className="text-xs font-outfit">
              Ellington MFB • {accountNumber}
            </Text>
            <Pressable
              onPress={handleCopyAccountNumber}
              className="px-2 py-0.5 rounded-md flex-row items-center gap-1"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Text className="text-white text-[10px] font-outfit-bold">
                {copied ? "Copied" : "Copy"}
              </Text>
              <Feather name="copy" size={10} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Tier pill */}
          <View className="items-center mb-4">
            <View
              style={{ backgroundColor: C.gold }}
              className="px-3.5 py-1 rounded-full flex-row items-center gap-1.5"
            >
              <MaterialCommunityIcons name="star" size={12} color={C.bgDark} />
              <Text style={{ color: C.bgDark }} className="text-xs font-outfit-bold">
                {tierLabel}
              </Text>
            </View>
          </View>

          {/* Upgrade banner / verified banner */}
          {kycLevel < 3 ? (
            <View
              style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: C.accent }}
              className="border rounded-2xl p-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <Text className="text-base">🚀</Text>
                <Text className="text-white text-xs font-outfit-medium flex-1">
                  {upgradeText}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/(root)/accounts/account-limits" as any)}
                className="px-3 py-1.5 rounded-full flex-row items-center gap-1 active:opacity-90"
                style={{ backgroundColor: C.accent }}
              >
                <Text className="text-white text-xs font-outfit-bold">Upgrade</Text>
                <Feather name="chevron-right" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View
              style={{ backgroundColor: "rgba(33,209,132,0.15)", borderColor: "rgba(33,209,132,0.4)" }}
              className="border rounded-2xl p-3 flex-row items-center gap-2 justify-center"
            >
              <MaterialCommunityIcons name="check-decagram" size={16} color={C.green} />
              <Text style={{ color: C.green }} className="text-xs font-outfit-medium">
                Tier 3 Verified • Unlimited Transaction Limits
              </Text>
            </View>
          )}
        </View>

        {/* ── ACCOUNT MANAGEMENT ───────────────────────────────────────────── */}
        <SectionLabel label="Account Management" />
        <View
          style={{ backgroundColor: C.card, borderColor: C.cardBorder }}
          className="rounded-2xl mb-5 shadow-sm border overflow-hidden"
        >
          <Row
            icon="account-outline"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Profile Information"
            subtitle="Personal, Residential, Employment & Next of Kin"
            onPress={() => router.push("/(root)/accounts/profile-info" as any)}
          />
          <Divider />
          <Row
            icon="chart-bar"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Account Limits & Tiers"
            subtitle="View daily transfer limits and current KYC status"
            onPress={() => router.push("/(root)/accounts/account-limits" as any)}
            badge={
              <View style={{ backgroundColor: kycLevel === 0 ? "#F0E0D8" : "#F0F0D8", borderColor: kycLevel === 0 ? "#cc7a50" : C.accent, borderWidth: 0.5 }} className="px-2 py-0.5 rounded-full">
                <Text style={{ color: kycLevel === 0 ? "#7A3A1B" : C.bgMid }} className="text-[9px] font-outfit-bold">
                  {kycLevel === 0 ? "No Tier" : `Tier ${kycLevel}`}
                </Text>
              </View>
            }
          />
          <Divider />
          <Row
            icon="file-document-outline"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Account Statements & Receipts"
            subtitle="Generate official PDF account statements"
            onPress={() => router.push("/(root)/accounts/statements" as any)}
          />
          <Divider />
          <Row
            icon="credit-card-outline"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Saved Beneficiaries & Cards"
            subtitle="Manage transfer contacts and linked debit cards"
            onPress={() => router.push("/(root)/accounts/beneficiaries-cards" as any)}
          />
        </View>

        {/* ── SECURITY & PREFERENCES ───────────────────────────────────────── */}
        <SectionLabel label="Security & Preferences" />
        <View
          style={{ backgroundColor: C.card, borderColor: C.cardBorder }}
          className="rounded-2xl mb-5 shadow-sm border overflow-hidden"
        >
          <Row
            icon="shield-check-outline"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Security & Passcode"
            subtitle="Change 6-digit PIN, manage Face ID / Fingerprint"
            onPress={() => router.push("/(root)/accounts/security" as any)}
          />
          <Divider />
          {/* Transaction Pin Biometric toggle */}
          {/* <View className="px-4 py-4 flex-row items-center justify-between">
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
          <Divider /> */}
          <Row
            icon="bell-outline"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Notification Preferences"
            subtitle="SMS alerts, transaction emails, push notifications"
            onPress={() => router.push("/(root)/accounts/notifications" as any)}
          />
          {/* <Divider /> */}
          {/* Appearance row with inline toggle */}
          {/* <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3.5 flex-1 mr-2">
              <View style={{ backgroundColor: "#EEEEE4" }} className="w-10 h-10 rounded-xl justify-center items-center">
                <MaterialCommunityIcons name="circle-half-full" size={20} color={C.bgMid} />
              </View>
              <Pressable onPress={() => router.push("/(root)/accounts/appearance" as any)} className="flex-1">
                <Text style={{ color: C.textPrimary }} className="text-sm font-outfit-bold">Appearance</Text>
                <Text style={{ color: C.textSub }} className="text-xs font-outfit mt-0.5">Switch between Light and Dark mode</Text>
              </Pressable>
            </View>
            <Feather name="chevron-right" size={18} color={C.chevron} />
          </View> */}
        </View>

        {/* ── SUPPORT & LEGAL ──────────────────────────────────────────────── */}
        <SectionLabel label="Support & Legal" />
        <View
          style={{ backgroundColor: C.card, borderColor: C.cardBorder }}
          className="rounded-2xl mb-5 shadow-sm border overflow-hidden"
        >
          <Row
            icon="headset"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Help & Support"
            subtitle="Live chat, report a transaction dispute, FAQs"
            onPress={() => router.push("/(root)/accounts/support" as any)}
          />
          <Divider />
          <Row
            icon="file-certificate-outline"
            iconBg="#EEEEE4"
            iconColor={C.bgMid}
            title="Terms of Service & Privacy Policy"
            subtitle="Read our operational policies and regulatory disclosures"
            onPress={() => router.push("/(root)/accounts/legal" as any)}
          />
        </View>

        {/* ── ACCOUNT ACTIONS ──────────────────────────────────────────────── */}
        <SectionLabel label="Account Actions" />
        <View
          style={{ backgroundColor: C.card, borderColor: C.cardBorder }}
          className="rounded-2xl mb-6 shadow-sm border overflow-hidden"
        >
          <Pressable
            onPress={() => setSignOutModalVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="px-4 py-4 flex-row items-center gap-3.5"
          >
            <View style={{ backgroundColor: "#FEF2F2" }} className="w-10 h-10 rounded-xl justify-center items-center">
              <Feather name="log-out" size={18} color="#EF4444" />
            </View>
            <Text className="text-sm font-outfit-bold text-red-500">Sign Out</Text>
          </Pressable>
          {/* <Divider />
          <Pressable
            onPress={() => router.push("/(root)/accounts/delete-account" as any)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="px-4 py-4 flex-row items-center gap-3.5"
          >
            <View style={{ backgroundColor: "#FEF2F2" }} className="w-10 h-10 rounded-xl justify-center items-center">
              <Feather name="trash-2" size={18} color="#EF4444" />
            </View>
            <Text className="text-sm font-outfit-bold text-red-500">Delete Account</Text>
          </Pressable> */}
        </View>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <View className="items-center px-4 mb-4">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialCommunityIcons name="shield-check" size={13} color={C.sectionHeader} />
            <Text style={{ color: C.sectionHeader }} className="text-[11px] font-outfit text-center">
              Licensed by CBN • Insured by NDIC
            </Text>
          </View>
          <Text style={{ color: C.sectionHeader }} className="text-[10px] font-outfit">
            Ellington MFB App Version 2.0.7
          </Text>
        </View>
      </ScrollView>

      {/* ── SIGN OUT MODAL ───────────────────────────────────────────────── */}
      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl items-center">
            <View className="w-14 h-14 rounded-full bg-red-50 justify-center items-center mb-4">
              <Feather name="log-out" size={26} color="#EF4444" />
            </View>
            <Text style={{ color: C.textPrimary }} className="text-lg font-outfit-bold text-center mb-1">
              Sign Out
            </Text>
            <Text style={{ color: C.textSub }} className="text-xs font-outfit text-center mb-6 leading-5">
              Are you sure you want to sign out of your Ellington account? You'll need your passcode to log back in.
            </Text>
            <View className="flex-row gap-3 w-full">
              <Pressable
                onPress={() => setSignOutModalVisible(false)}
                style={{ borderColor: C.cardBorder }}
                className="flex-1 py-3.5 rounded-xl border items-center active:bg-gray-50"
              >
                <Text style={{ color: C.textPrimary }} className="text-xs font-outfit-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSignOut}
                disabled={loggingOut}
                className="flex-1 py-3.5 rounded-xl bg-red-600 items-center active:opacity-90"
              >
                <Text className="text-white text-xs font-outfit-bold">
                  {loggingOut ? "Signing Out..." : "Sign Out"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── TRANSACTION PIN BIOMETRIC CONFIRMATION ───────────────────────── */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowPinModal(false); setPinValue(""); setPinError(""); }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "100%", maxWidth: 380 }} className="items-center">
            <View style={{ backgroundColor: "rgba(150,152,65,0.15)" }} className="w-14 h-14 rounded-full items-center justify-center mb-3">
              <MaterialCommunityIcons name="fingerprint" size={28} color="#969841" />
            </View>
            <Text style={{ color: C.textPrimary }} className="text-lg font-outfit-bold mb-1">Authorize Biometrics</Text>
            <Text style={{ color: C.textSub }} className="text-xs font-outfit text-center mb-6 px-4">
              Enter your 4-digit transaction PIN to enable biometric approval for transfers.
            </Text>
            <OtpInput
              digitCount={4}
              value={pinValue}
              onChange={(val) => { setPinValue(val); setPinError(""); }}
              secure
              autoFocus
              inputStyle="w-12 h-12 text-lg"
            />
            {pinError ? <Text className="text-red-600 text-xs font-outfit text-center mt-3">{pinError}</Text> : null}
            <View className="flex-row w-full mt-6" style={{ gap: 10 }}>
              <Pressable
                onPress={() => { setShowPinModal(false); setPinValue(""); setPinError(""); }}
                style={{ borderColor: "#E8E5DC", borderWidth: 1 }}
                className="flex-1 py-3 rounded-xl items-center"
              >
                <Text style={{ color: C.textPrimary }} className="font-outfit-bold text-sm">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handlePinSubmit}
                disabled={savingPin}
                style={{ backgroundColor: "#969841", opacity: savingPin ? 0.7 : 1 }}
                className="flex-1 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-outfit-bold text-sm">{savingPin ? "Validating..." : "Confirm PIN"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
