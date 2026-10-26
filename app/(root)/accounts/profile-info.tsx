import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";
import { nigeriaStates, stateOptions as NIGERIA_STATE_OPTIONS } from "@/app/lib/utils";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { getUserProfile, updateUserProfile, updatePersonalProfile, updateResidentialAddress, updateNextOfKin, updateFinancialProfile, fetchIndustries, submitNin } from "@/app/lib/thunks/authThunks";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── App Colors ──────────────────────────────────────────────────────────────
const C = {
  bgPage: "#3F401B",
  bgDark: "#969841",
  bgMid: "#4a4b20",
  accent: "#969841",
  gold: "#FBCD58",
  green: "#21D184",
  white: "#FFFFFF",
  cardBorder: "#E8E5DC",
  inputBg: "#FAFAF5",
  textPrimary: "#2A2B0F",
  textSub: "#7A7B5A",
  textMuted: "#9A9B7A",
};

type TabType = "personal" | "update_personal" | "residential" | "employment" | "next_of_kin";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const MARITAL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "business_owner", label: "Business Owner" },
  { value: "student", label: "Student" },
  { value: "unemployed", label: "Unemployed" },
];

// Numeric values sent to the API as estimated_monthly_income
const INCOME_RANGE_OPTIONS = [
  { value: "50000", label: "Below ₦100,000" },
  { value: "200000", label: "₦100,000 – ₦300,000" },
  { value: "500000", label: "₦300,000 – ₦750,000" },
  { value: "1000000", label: "₦750,000 – ₦2,000,000" },
  { value: "3000000", label: "Above ₦2,000,000" },
];

const NOK_RELATIONSHIP_OPTIONS = [
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Sibling", label: "Sibling" },
  { value: "Child", label: "Child" },
  { value: "Next of Kin", label: "Next of Kin" },
];

const normaliseStateValue = (state?: string) => {
  const value = state?.trim();
  if (!value) return "";

  const matchedState = NIGERIA_STATE_OPTIONS.find(
    (option) => option.value === value.toLowerCase() || option.label.toLowerCase() === value.toLowerCase()
  );
  return matchedState?.value || value;
};

const includeCurrentOption = (
  options: { value: string; label: string }[],
  currentValue: string
) => {
  if (!currentValue || options.some((option) => option.value.toLowerCase() === currentValue.toLowerCase())) {
    return options;
  }
  return [{ value: currentValue, label: currentValue }, ...options];
};

// ─── Input field helper ───────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  maxLength?: number;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 12, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9B7A"
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={{
          backgroundColor: C.inputBg,
          borderColor: C.cardBorder,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          color: C.textPrimary,
          fontSize: 13,
          fontFamily: "Outfit",
        }}
      />
    </View>
  );
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────
type FeedbackType = "success" | "error" | "info";

function FeedbackModal({
  visible,
  type,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  type: FeedbackType;
  title: string;
  message: string;
  onClose: () => void;
}) {
  const icon =
    type === "success" ? "check-circle" : type === "error" ? "close-circle" : "alert-circle";
  const iconColor =
    type === "success" ? "#21D184" : type === "error" ? "#EF4444" : "#F59E0B";
  const pillBg =
    type === "success" ? "rgba(33,209,132,0.12)" : type === "error" ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.12)";

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 28,
            width: "100%",
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 10,
          }}
          onPress={() => { }}
        >
          {/* Icon circle */}
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: pillBg, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <MaterialCommunityIcons name={icon as any} size={36} color={iconColor} />
          </View>

          <Text style={{ fontFamily: "OutfitBold", fontSize: 17, color: "#2A2B0F", marginBottom: 8, textAlign: "center" }}>
            {title}
          </Text>
          <Text style={{ fontFamily: "Outfit", fontSize: 13, color: "#7A7B5A", textAlign: "center", lineHeight: 20 }}>
            {message}
          </Text>

          <Pressable
            onPress={onClose}
            style={{ marginTop: 24, backgroundColor: "#969841", borderRadius: 12, paddingVertical: 13, paddingHorizontal: 40 }}
          >
            <Text style={{ fontFamily: "OutfitBold", fontSize: 14, color: "#FFFFFF" }}>OK</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileInfoScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  // ── Feedback modal ──────────────────────────────────────────────────────────
  const [modal, setModal] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
    visible: false, type: "success", title: "", message: "",
  });
  const showModal = (type: FeedbackType, title: string, message: string) =>
    setModal({ visible: true, type, title, message });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const [activeTab, setActiveTab] = useState<TabType>("personal");

  // Residential
  const [address, setAddress] = useState(user?.address_1 || "");
  const [city, setCity] = useState(user?.city || "");
  const [stateName, setStateName] = useState(normaliseStateValue(user?.state));
  const [lga, setLga] = useState(user?.local_government || "");
  const [landmark, setLandmark] = useState((user as any)?.landmark || "");
  const [stateOfOrigin, setStateOfOrigin] = useState(normaliseStateValue((user as any)?.state_of_origin));
  const [lgaOfOrigin, setLgaOfOrigin] = useState((user as any)?.lga_of_origin || "");
  const [savingResidential, setSavingResidential] = useState(false);
  const skipNextResidentialHydration = useRef(false);

  // NIN
  const [ninValue, setNinValue] = useState("");
  const [savingNin, setSavingNin] = useState(false);

  // Employment
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [industry, setIndustry] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [savingEmployment, setSavingEmployment] = useState(false);
  const [industries, setIndustries] = useState<{ value: string; label: string }[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  // NOK
  const [nokFirstName, setNokFirstName] = useState("");
  const [nokLastName, setNokLastName] = useState("");
  const [nokRelationship, setNokRelationship] = useState("");
  const [nokPhone, setNokPhone] = useState("");
  const [nokAddress, setNokAddress] = useState("");
  const [savingNok, setSavingNok] = useState(false);

  // Update Personal Info (empty → placeholder shows current value)
  const [upEmail, setUpEmail] = useState("");
  const [upLga, setUpLga] = useState("");
  const [upAddress2, setUpAddress2] = useState("");
  const [upMarital, setUpMarital] = useState("");
  const [upNationality, setUpNationality] = useState("");
  const [upOccupation, setUpOccupation] = useState("");
  const [upAltPhone, setUpAltPhone] = useState("");
  const [upGender, setUpGender] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);

  useEffect(() => {
    dispatch(getUserProfile());
    loadSaved();
    loadIndustries();
  }, [dispatch]);

  // The profile is fetched after this screen mounts, so populate the form when
  // those saved residential values arrive instead of leaving them as placeholders.
  useEffect(() => {
    if (!user) return;

    // A successful save intentionally resets this form. Do not immediately
    // repopulate it from the profile refresh that follows that save.
    if (skipNextResidentialHydration.current) {
      skipNextResidentialHydration.current = false;
      return;
    }

    setAddress(user.address_1 || "");
    setCity(user.city || "");
    setStateName(normaliseStateValue(user.state));
    setLandmark((user as any).landmark || "");
    setStateOfOrigin(normaliseStateValue((user as any).state_of_origin));
    setLgaOfOrigin((user as any).lga_of_origin || "");
  }, [user]);

  const loadIndustries = async () => {
    setLoadingIndustries(true);
    try {
      const result = await dispatch(fetchIndustries()).unwrap();
      // API may return array directly, or nested under data/industries
      const list: any[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.data?.industries)
            ? result.data.industries
            : [];
      setIndustries(list.map((item: any) => ({
        value: typeof item === "string" ? item : (item.name || item.value || item.id),
        label: typeof item === "string" ? item : (item.name || item.label || item.value),
      })));
    } catch {
      // fall back to empty — user can still type sector manually
    } finally { setLoadingIndustries(false); }
  };

  const loadSaved = async () => {
    try {
      const storedEmp = await AsyncStorage.getItem("user_employment_details");
      if (storedEmp) {
        const p = JSON.parse(storedEmp);
        if (p.employmentStatus) setEmploymentStatus(p.employmentStatus);
        if (p.industry) setIndustry(p.industry);
        if (p.employerName) setEmployerName(p.employerName);
        if (p.incomeRange) setIncomeRange(p.incomeRange);
      }
    } catch (e) { console.log(e); }
  };

  const handleSaveResidential = async () => {
    const stateLabel = NIGERIA_STATE_OPTIONS.find((option) => option.value === stateName)?.label || stateName;
    const stateOfOriginLabel = NIGERIA_STATE_OPTIONS.find((option) => option.value === stateOfOrigin)?.label || stateOfOrigin;
    const raw: Record<string, string> = {
      address_1: address.trim(),
      city: city.trim(),
      state: stateLabel.trim(),
      landmark: landmark.trim(),
      state_of_origin: stateOfOriginLabel.trim(),
      lga_of_origin: lgaOfOrigin.trim(),
    };
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => !!v));
    if (Object.keys(payload).length === 0) {
      showModal("info", "Nothing to update", "Please fill in at least one field.");
      return;
    }
    setSavingResidential(true);
    try {
      await dispatch(updateResidentialAddress(payload)).unwrap();
      skipNextResidentialHydration.current = true;
      await dispatch(getUserProfile());
      setAddress("");
      setCity("");
      setStateName("");
      setLga("");
      setLandmark("");
      setStateOfOrigin("");
      setLgaOfOrigin("");
      showModal("success", "Residential Updated", "Your residential details have been saved.");
    } catch (err: any) {
      showModal("error", "Update Failed", typeof err === "string" ? err : "Failed to update residential details.");
    } finally { setSavingResidential(false); }
  };

  const handleSaveEmployment = async () => {
    if (!employmentStatus) {
      showModal("info", "Validation", "Please select an employment status.");
      return;
    }
    const payload: any = { employment_status: employmentStatus };
    if (industry) payload.industry = industry;
    if (employerName.trim()) payload.employer = employerName.trim();
    if (incomeRange) payload.estimated_monthly_income = Number(incomeRange);

    setSavingEmployment(true);
    try {
      await dispatch(updateFinancialProfile(payload)).unwrap();
      await AsyncStorage.removeItem("user_employment_details");
      setEmploymentStatus("");
      setIndustry("");
      setEmployerName("");
      setIncomeRange("");
      showModal("success", "Employment Updated", "Your employment details have been saved.");
    } catch (err: any) {
      showModal("error", "Update Failed", typeof err === "string" ? err : "Failed to save employment details.");
    } finally { setSavingEmployment(false); }
  };

  const handleSaveNok = async () => {
    if (!nokFirstName.trim() || !nokLastName.trim() || !nokPhone.trim()) {
      showModal("info", "Validation", "First name, last name and phone are required.");
      return;
    }
    const raw: Record<string, string> = {
      first_name: nokFirstName.trim(),
      last_name: nokLastName.trim(),
      relationship: nokRelationship,
      phone: nokPhone.trim(),
      address_1: nokAddress.trim(),
    };
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => !!v));
    setSavingNok(true);
    try {
      await dispatch(updateNextOfKin(payload)).unwrap();
      setNokFirstName("");
      setNokLastName("");
      setNokRelationship("");
      setNokPhone("");
      setNokAddress("");
      showModal("success", "Next of Kin Updated", "Your next of kin details have been saved.");
    } catch (err: any) {
      showModal("error", "Update Failed", typeof err === "string" ? err : "Failed to update next of kin.");
    } finally { setSavingNok(false); }
  };

  const handleSavePersonal = async () => {
    const raw: Record<string, string> = {
      email: upEmail.trim(),
      local_government: upLga.trim(),
      address_2: upAddress2.trim(),
      marital_status: upMarital,
      nationality: upNationality.trim(),
      occupation: upOccupation.trim(),
      alternate_phone: upAltPhone.trim(),
      gender: upGender,
    };
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => !!v));
    if (Object.keys(payload).length === 0) {
      showModal("info", "Nothing to Update", "Please change at least one field.");
      return;
    }
    setSavingPersonal(true);
    try {
      await dispatch(updatePersonalProfile(payload)).unwrap();
      await dispatch(getUserProfile());
      setUpEmail(""); setUpLga(""); setUpAddress2(""); setUpMarital("");
      setUpNationality(""); setUpOccupation(""); setUpAltPhone(""); setUpGender("");
      showModal("success", "Profile Updated", "Your personal information has been updated.");
    } catch (err: any) {
      showModal("error", "Update Failed", typeof err === "string" ? err : "Failed to update personal info.");
    } finally { setSavingPersonal(false); }
  };

  const handleSaveContact = async () => {
    const raw: Record<string, string> = {
      email: upEmail.trim(),
      alternate_phone: upAltPhone.trim(),
    };
    const payload = Object.fromEntries(Object.entries(raw).filter(([, value]) => !!value));
    if (Object.keys(payload).length === 0) {
      showModal("info", "Nothing to Update", "Enter an email address or alternate phone number.");
      return;
    }

    setSavingPersonal(true);
    try {
      await dispatch(updatePersonalProfile(payload)).unwrap();
      await dispatch(getUserProfile());
      setUpEmail("");
      setUpAltPhone("");
      showModal("success", "Contact Details Updated", "Your email and alternate phone number have been updated.");
    } catch (err: any) {
      showModal("error", "Update Failed", typeof err === "string" ? err : "Failed to update contact details.");
    } finally { setSavingPersonal(false); }
  };

  const proofStatus: "Verified" | "Pending" | "Unverified" =
    user?.utility_bill_provided || (user?.kyc_level && user.kyc_level >= 3) ? "Verified" : "Pending";

  const maskedBvn = user?.bvn_masked || "******1234";
  const maskedNin = user?.nin_masked || "******5678";

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "personal", label: "Personal", icon: "account-box-outline" },
    // { key: "update_personal", label: "Update Personal Info", icon: "account-edit-outline" },
    { key: "residential", label: "Residential", icon: "home-outline" },
    { key: "employment", label: "Employment", icon: "briefcase-outline" },
    { key: "next_of_kin", label: "Next of Kin", icon: "account-group-outline" },
  ];

  const SaveButton = ({ onPress, saving, label }: { onPress: () => void; saving: boolean; label: string }) => (
    <Pressable
      onPress={onPress}
      disabled={saving}
      style={{ backgroundColor: C.bgDark }}
      className="rounded-xl py-3.5 items-center mt-4 active:opacity-85"
    >
      <Text className="text-white text-sm font-outfit-bold">{saving ? "Saving..." : label}</Text>
    </Pressable>
  );

  const residentialStateOptions = includeCurrentOption(NIGERIA_STATE_OPTIONS, stateName);
  const stateOfOriginOptions = includeCurrentOption(NIGERIA_STATE_OPTIONS, stateOfOrigin);
  const lgaOfOriginOptions = includeCurrentOption(
    (nigeriaStates[stateOfOrigin.toLowerCase()] || []).map((area) => ({ value: area, label: area })),
    lgaOfOrigin
  );
  const residentialDetails = [
    { label: "State", value: NIGERIA_STATE_OPTIONS.find((option) => option.value === stateName)?.label || stateName },
    { label: "Street Address", value: address },
    { label: "Landmark", value: landmark },
    { label: "State of Origin", value: NIGERIA_STATE_OPTIONS.find((option) => option.value === stateOfOrigin)?.label || stateOfOrigin },
    { label: "LGA of Origin", value: lgaOfOrigin },
  ].filter((detail) => detail.value.trim());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Profile Information" />

      {/* Tab bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: isActive ? C.bgDark : C.white,
                  borderWidth: 1,
                  borderColor: isActive ? C.bgDark : C.cardBorder,
                }}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={16} color={isActive ? C.white : C.textSub} />
                <Text style={{ marginLeft: 6, fontSize: 12, fontFamily: "OutfitMedium", color: isActive ? C.white : C.textSub }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          className="flex-1 px-4 py-2"
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

          {/* ── PERSONAL ────────────────────────────────────────────── */}
          {activeTab === "personal" && (
            <View>
              {/* Notice banner */}
              <View
                style={{ backgroundColor: "#EEEEE4", borderColor: C.accent, borderWidth: 1 }}
                className="p-4 rounded-2xl flex-row items-center gap-3 mb-4"
              >
                <View style={{ backgroundColor: C.bgDark }} className="w-10 h-10 rounded-full justify-center items-center">
                  <MaterialCommunityIcons name="shield-lock-outline" size={20} color={C.white} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: C.bgDark }} className="text-xs font-outfit-bold">Official Regulatory Verification</Text>
                  <Text style={{ color: C.bgMid }} className="text-[11px] font-outfit mt-0.5 leading-4">
                    Your personal information is verified via CBN BVN and NIMC records. These fields are read-only.
                  </Text>
                </View>
              </View>

              {/* Info card */}
              <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-5 shadow-sm">
                {[
                  { label: "First Name", value: user?.first_name },
                  { label: "Middle Name", value: user?.middle_name || "—" },
                  { label: "Last Name", value: user?.last_name },
                  { label: "Date of Birth", value: user?.date_of_birth },
                  { label: "Gender", value: user?.gender },
                ].map((row, i, arr) => (
                  <View
                    key={row.label}
                    style={{ borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.cardBorder, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "Outfit" }}>{row.label}</Text>
                    <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold", textTransform: "capitalize" }}>{row.value}</Text>
                  </View>
                ))}

                {/* BVN */}
                {user?.bvn_verified === true && (
                  <View style={{ borderBottomWidth: 1, borderBottomColor: C.cardBorder, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "Outfit" }}>Verified BVN</Text>
                      <MaterialCommunityIcons name="check-decagram" size={14} color={C.green} />
                    </View>
                    <View style={{ backgroundColor: "rgba(33,209,132,0.1)", borderColor: "rgba(33,209,132,0.3)", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                      <Text style={{ color: "#16a34a", fontSize: 11, fontFamily: "OutfitBold", letterSpacing: 1 }}>{maskedBvn}</Text>
                    </View>
                  </View>
                )}

                {/* NIN */}
                {user?.nin_verified ? (
                  <View style={{ paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "Outfit" }}>Verified NIN / vNIN</Text>
                      <MaterialCommunityIcons name="check-decagram" size={14} color={C.green} />
                    </View>
                    <View style={{ backgroundColor: "rgba(33,209,132,0.1)", borderColor: "rgba(33,209,132,0.3)", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                      <Text style={{ color: "#16a34a", fontSize: 11, fontFamily: "OutfitBold", letterSpacing: 1 }}>{maskedNin}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ paddingTop: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={14} color={C.textSub} />
                      <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "OutfitMedium" }}>NIN / vNIN</Text>
                      <View style={{ backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: "#b45309", fontSize: 10, fontFamily: "OutfitBold" }}>Not Verified</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TextInput
                        value={ninValue}
                        onChangeText={(v) => setNinValue(v.replace(/[^0-9]/g, "").slice(0, 11))}
                        placeholder="Enter 11-digit NIN"
                        placeholderTextColor="#9A9B7A"
                        keyboardType="number-pad"
                        maxLength={11}
                        style={{
                          flex: 1,
                          backgroundColor: C.inputBg,
                          borderColor: ninValue.length > 0 && ninValue.length < 11 ? "#F59E0B" : C.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 11,
                          color: C.textPrimary,
                          fontSize: 14,
                          fontFamily: "OutfitMedium",
                          letterSpacing: 2,
                        }}
                      />
                      <Pressable
                        disabled={ninValue.length !== 11 || savingNin}
                        onPress={async () => {
                          setSavingNin(true);
                          try {
                            await dispatch(submitNin(ninValue)).unwrap();
                            await dispatch(getUserProfile());
                            setNinValue("");
                            showModal("success", "NIN Submitted", "Your NIN has been submitted for verification.");
                          } catch (err: any) {
                            showModal("error", "Submission Failed", typeof err === "string" ? err : "Failed to submit NIN.");
                          } finally { setSavingNin(false); }
                        }}
                        style={{
                          backgroundColor: ninValue.length === 11 && !savingNin ? C.bgDark : "#D1D5DB",
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 11,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontFamily: "OutfitBold", fontSize: 12 }}>
                          {savingNin ? "..." : "Submit"}
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={{ color: ninValue.length === 11 ? C.green : C.textMuted, fontSize: 11, fontFamily: "Outfit", marginTop: 5 }}>
                      {ninValue.length}/11 digits{ninValue.length === 11 ? " ✓" : ""}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }}
                className="rounded-2xl p-5 shadow-sm mt-4"
              >
                <Field label="Email Address" value={upEmail} onChangeText={setUpEmail} placeholder={user?.email || "Enter email address"} keyboardType="email-address" />
                <Field label="Alternate Phone" value={upAltPhone} onChangeText={setUpAltPhone} placeholder={(user as any)?.alternate_phone || "e.g. 08012345678"} keyboardType="phone-pad" />
                <SaveButton onPress={handleSaveContact} saving={savingPersonal} label="Update Email or Alternate Phone" />
              </View>
            </View>
          )}

          {/* ── UPDATE PERSONAL INFO ───────────────────────────────── */}
          {/* {activeTab === "update_personal" && (
            <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-5 shadow-sm">
              <Field label="Email Address" value={upEmail} onChangeText={setUpEmail} placeholder={user?.email || "Enter email address"} keyboardType="email-address" />
              <Field label="Alternate Phone" value={upAltPhone} onChangeText={setUpAltPhone} placeholder={(user as any)?.alternate_phone || "e.g. 08012345678"} keyboardType="phone-pad" />
              <Dropdown
                label="Gender"
                placeholder={user?.gender ? String(user.gender).charAt(0).toUpperCase() + String(user.gender).slice(1) : "Select gender"}
                options={GENDER_OPTIONS}
                selectedValue={upGender}
                onSelect={setUpGender}
                variant="light"
              />
              <View style={{ marginTop: 16 }}>
                <Dropdown
                  label="Marital Status"
                  placeholder={(user as any)?.marital_status ? String((user as any).marital_status).charAt(0).toUpperCase() + String((user as any).marital_status).slice(1) : "Select marital status"}
                  options={MARITAL_STATUS_OPTIONS}
                  selectedValue={upMarital}
                  onSelect={setUpMarital}
                  variant="light"
                />
              </View>
              <View style={{ marginTop: 16 }}>
                <Field label="Nationality" value={upNationality} onChangeText={setUpNationality} placeholder={(user as any)?.nationality || "e.g. Nigerian"} />
              </View>
              <Field label="Occupation" value={upOccupation} onChangeText={setUpOccupation} placeholder={(user as any)?.occupation || "e.g. Software Engineer"} />
              <Field label="Local Government Area" value={upLga} onChangeText={setUpLga} placeholder={user?.local_government || "e.g. Eti-Osa"} />
              <Field label="Address Line 2" value={upAddress2} onChangeText={setUpAddress2} placeholder={user?.address_2 || "Apartment, suite, landmark"} />
              <SaveButton onPress={handleSavePersonal} saving={savingPersonal} label="Update Personal Information" />
            </View>
          )} */}

          {/* ── RESIDENTIAL ─────────────────────────────────────────── */}
          {activeTab === "residential" && (
            <View>
              {/* Proof of address status */}
              {/* <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-4 shadow-sm flex-row items-center justify-between mb-4">
                <View>
                  <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit" }}>Proof of Address Status</Text>
                  <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold", marginTop: 2 }}>Utility & Residential Validation</Text>
                </View>
                <View
                  style={{
                    backgroundColor: proofStatus === "Verified" ? "rgba(33,209,132,0.12)" : proofStatus === "Pending" ? "rgba(251,205,88,0.18)" : "#F5F5F0",
                    borderColor: proofStatus === "Verified" ? "rgba(33,209,132,0.4)" : proofStatus === "Pending" ? "rgba(251,205,88,0.5)" : C.cardBorder,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <MaterialCommunityIcons
                    name={proofStatus === "Verified" ? "check-circle" : proofStatus === "Pending" ? "clock-outline" : "alert-circle-outline"}
                    size={13}
                    color={proofStatus === "Verified" ? C.green : proofStatus === "Pending" ? "#ca8a04" : C.textMuted}
                  />
                  <Text style={{ color: proofStatus === "Verified" ? "#16a34a" : proofStatus === "Pending" ? "#ca8a04" : C.textSub, fontSize: 11, fontFamily: "OutfitBold" }}>
                    {proofStatus}
                  </Text>
                </View>
              </View> */}

              {/* {residentialDetails.length > 0 && (
                <View
                  style={{ backgroundColor: "#EEEEE4", borderColor: C.cardBorder, borderWidth: 1 }}
                  className="rounded-2xl p-5 mb-4"
                >
                  <Text style={{ color: C.textPrimary, fontFamily: "OutfitBold", fontSize: 14, marginBottom: 8 }}>
                    Saved Residential Details
                  </Text>
                  {residentialDetails.map((detail, index) => (
                    <View
                      key={detail.label}
                      style={{
                        borderBottomColor: C.cardBorder,
                        borderBottomWidth: index < residentialDetails.length - 1 ? 1 : 0,
                        paddingVertical: 9,
                      }}
                    >
                      <Text style={{ color: C.textSub, fontFamily: "Outfit", fontSize: 11 }}>{detail.label}</Text>
                      <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 13, marginTop: 2 }}>
                        {detail.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )} */}

              <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-5 shadow-sm">
                <Dropdown
                  label="State"
                  placeholder="Select your state"
                  options={residentialStateOptions}
                  selectedValue={stateName}
                  onSelect={setStateName}
                  searchable
                  searchPlaceholder="Search states"
                  variant="light"
                />
                <Field label="Street Address" value={address} onChangeText={setAddress} placeholder={user?.address_1 || "Enter your street address"} />
                <Field label="City / Town" value={city} onChangeText={setCity} placeholder={user?.city || "e.g. Ikeja, Lekki, Victoria Island"} />
                <Field label="Landmark" value={landmark} onChangeText={setLandmark} placeholder={(user as any)?.landmark || "e.g. Beside First Bank, Opp. Shoprite"} />
                <Dropdown
                  label="State of Origin"
                  placeholder="Select your state of origin"
                  options={stateOfOriginOptions}
                  selectedValue={stateOfOrigin}
                  onSelect={(value) => {
                    setStateOfOrigin(value);
                    setLgaOfOrigin("");
                  }}
                  searchable
                  searchPlaceholder="Search states"
                  variant="light"
                />
                <Dropdown
                  label="LGA of Origin"
                  placeholder={stateOfOrigin ? "Select your LGA of origin" : "Select a state of origin first"}
                  options={lgaOfOriginOptions}
                  selectedValue={lgaOfOrigin}
                  onSelect={setLgaOfOrigin}
                  searchable
                  searchPlaceholder="Search LGAs"
                  disabled={!stateOfOrigin}
                  variant="light"
                />
                <SaveButton onPress={handleSaveResidential} saving={savingResidential} label="Save Residential Details" />
              </View>
            </View>
          )}

          {/* ── EMPLOYMENT ──────────────────────────────────────────── */}
          {activeTab === "employment" && (
            <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-5 shadow-sm">
              <Dropdown
                label="Employment Status"
                placeholder="Select status"
                options={EMPLOYMENT_STATUS_OPTIONS}
                selectedValue={employmentStatus}
                onSelect={setEmploymentStatus}
                variant="light"
              />
              <View style={{ marginTop: 16 }}>
                <Dropdown
                  label={loadingIndustries ? "Industry (loading...)" : "Industry"}
                  placeholder="Select your industry"
                  options={industries.length > 0 ? industries : [{ value: "", label: "No industries loaded" }]}
                  selectedValue={industry}
                  onSelect={setIndustry}
                  variant="light"
                />
              </View>
              <View style={{ marginTop: 16 }}>
                <Field label="Employer / Business Name" value={employerName} onChangeText={setEmployerName} placeholder="e.g. Ellington Financial / Self" />
              </View>
              <Dropdown
                label="Estimated Monthly Income"
                placeholder="Select monthly income"
                options={INCOME_RANGE_OPTIONS}
                selectedValue={incomeRange}
                onSelect={setIncomeRange}
                variant="light"
              />
              <SaveButton onPress={handleSaveEmployment} saving={savingEmployment} label="Save Employment Details" />
            </View>
          )}


          {/* ── NEXT OF KIN ─────────────────────────────────────────── */}
          {activeTab === "next_of_kin" && (
            <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-5 shadow-sm">
              <Field label="First Name" value={nokFirstName} onChangeText={setNokFirstName} placeholder="e.g. Funmilayo" />
              <Field label="Last Name" value={nokLastName} onChangeText={setNokLastName} placeholder="e.g. Awoyomi" />
              <Dropdown
                label="Relationship"
                placeholder={nokRelationship || "Select relationship"}
                options={NOK_RELATIONSHIP_OPTIONS}
                selectedValue={nokRelationship}
                onSelect={setNokRelationship}
                variant="light"
              />
              <View style={{ marginTop: 16 }}>
                <Field
                  label="Phone Number"
                  value={nokPhone}
                  onChangeText={(value) => setNokPhone(value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="e.g. 08012345678"
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
              <Field label="Residential Address" value={nokAddress} onChangeText={setNokAddress} placeholder="e.g. 15 Admiralty Way, Lekki Phase 1, Lagos" />
              <SaveButton onPress={handleSaveNok} saving={savingNok} label="Save Next of Kin" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FeedbackModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}
