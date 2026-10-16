import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import BottomSheet from "@/app/components/BottomSheet";
import FaceVerificationProgressModal from "@/app/components/FaceVerificationProgressModal";
import { ONBOARDING_ENDPOINT, SESSIONTOKEN_ENDPOINT } from "@/app/lib/api";
import { useQoreIdSdk } from "@/app/lib/qoreidShim";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { fetchProfileCompletion, getUserProfile, submitDocUpload, GovernmentIdType, ProofOfAddressType, type ProfileCompletion } from "@/app/lib/thunks/authThunks";

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
  textPrimary: "#2A2B0F",
  textSub: "#7A7B5A",
  textMuted: "#9A9B7A",
};

// ─── Status Pill ─────────────────────────────────────────────────────────────
function StatusPill({
  status,
  onPress,
}: {
  status: "COMPLETED" | "PENDING REVIEW" | "REQUIRED" | "VERIFY" | "UPLOAD" | "COMPLETE";
  onPress?: () => void;
}) {
  if (status === "COMPLETED") {
    return (
      <View
        style={{ backgroundColor: "rgba(33,209,132,0.15)", borderColor: "rgba(33,209,132,0.4)", borderWidth: 1 }}
        className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
      >
        <MaterialCommunityIcons name="check" size={12} color="#21D184" />
        <Text style={{ color: "#16a34a" }} className="text-[10px] font-outfit-bold">COMPLETED</Text>
      </View>
    );
  }
  if (status === "PENDING REVIEW") {
    return (
      <View
        style={{ backgroundColor: "rgba(251,205,88,0.2)", borderColor: "rgba(251,205,88,0.6)", borderWidth: 1 }}
        className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
      >
        <MaterialCommunityIcons name="clock-outline" size={12} color="#ca8a04" />
        <Text style={{ color: "#ca8a04" }} className="text-[10px] font-outfit-bold">PENDING REVIEW</Text>
      </View>
    );
  }
  // Actionable button
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: C.bgDark }}
      className="px-3 py-1.5 rounded-full active:opacity-80"
    >
      <Text className="text-white text-[10px] font-outfit-bold">{status}</Text>
    </Pressable>
  );
}

// ── Doc type option maps ───────────────────────────────────────────────────────────
const GOVT_ID_OPTIONS: { value: GovernmentIdType; label: string; icon: string }[] = [
  { value: GovernmentIdType.NIN, label: "NIN Slip", icon: "card-account-details-outline" },
  { value: GovernmentIdType.PASSPORT, label: "International Passport", icon: "passport" },
  { value: GovernmentIdType.DRIVERS_LICENSE, label: "Driver's License", icon: "car-outline" },
  { value: GovernmentIdType.VOTERS_CARD, label: "Voter's Card", icon: "vote-outline" },
  { value: GovernmentIdType.NATIONAL_ID, label: "National ID Card", icon: "badge-account-outline" },
];

const PROOF_OPTIONS: { value: ProofOfAddressType; label: string; icon: string }[] = [
  { value: ProofOfAddressType.METER_RECEIPT, label: "Prepaid Meter Receipt", icon: "lightning-bolt-outline" },
  { value: ProofOfAddressType.LAWMA_BILL, label: "LAWMA / Utility Bill", icon: "file-document-outline" },
  { value: ProofOfAddressType.BANK_STATEMENT, label: "3-Month Bank Statement", icon: "bank-outline" },
];

export default function AccountLimitsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  console.log(user)
  const token = useAppSelector((state) => (state as any).auth.token);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);

  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const livenessRequest = useRef<{ reference: string; bvn: string } | null>(null);
  const isCheckingLiveness = useRef(false);
  const [bvnModalVisible, setBvnModalVisible] = useState(false);
  const [bvnInput, setBvnInput] = useState("");
  const [bvnError, setBvnError] = useState("");

  const onQoreResult = async () => {
    if (isCheckingLiveness.current) return;

    const request = livenessRequest.current;
    if (!request) {
      setIsVerifyingFace(false);
      showFb("error", "Verification", "Unable to confirm the liveness result.");
      return;
    }

    isCheckingLiveness.current = true;
    try {
      // QoreID completes first; allow the provider time to persist the result
      // before asking our backend for the definitive verification status.
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(ONBOARDING_ENDPOINT(request.reference), {
        method: "GET",
        headers,
      });
      const payload = await response.json().catch(() => ({}));
      const result = payload?.data ?? payload;
      const status = String(
        result?.verification_status ?? result?.liveness_status ?? result?.status ?? ""
      ).toLowerCase();
      const verified =
        response.ok &&
        payload?.success !== false &&
        (result?.verified === true ||
          result?.is_verified === true ||
          result?.bvn_verified === true ||
          status === "verified" ||
          status === "success" ||
          payload?.success === true);

      if (verified) {
        // Refresh the Redux user state so the new BVN/KYC status is reflected
        // everywhere as soon as liveness verification is confirmed.
        await dispatch(getUserProfile()).unwrap().catch((error) => {
          console.warn("Unable to refresh profile after liveness verification:", error);
        });
        setIsVerifyingFace(false);
        showFb("success", "Verification", "BVN liveness completed.");
      } else {
        setIsVerifyingFace(false);
        showFb(
          "error",
          "Verification",
          result?.message || payload?.message || "BVN liveness verification was not successful."
        );
      }
    } catch (error: any) {
      setIsVerifyingFace(false);
      showFb("error", "Verification", error?.message || "Unable to retrieve the BVN liveness result.");
    } finally {
      livenessRequest.current = null;
      isCheckingLiveness.current = false;
    }
  };

  const { launchQoreId } = useQoreIdSdk({ onResult: onQoreResult });

  const hasAccount = Boolean(user?.account_number);
  const kycLevel = hasAccount ? (user?.kyc_level || 1) : 0;

  const isProfileComplete =
    profileCompletion?.completion_percentage === 100 &&
    Array.isArray(profileCompletion.missing_fields) &&
    profileCompletion.missing_fields.length === 0;
  const hasCompletedKyc1 = kycLevel >= 1;
  const hasCompletedKyc2 = kycLevel >= 2;

  useEffect(() => {
    dispatch(fetchProfileCompletion())
      .unwrap()
      .then(setProfileCompletion)
      .catch((error) => console.warn("Unable to load profile completion:", error));
  }, [dispatch]);

  // ── Feedback modal state
  type FBType = "success" | "error" | "info";
  const [fb, setFb] = useState<{ visible: boolean; type: FBType; title: string; msg: string }>(
    { visible: false, type: "success", title: "", msg: "" }
  );
  const showFb = (type: FBType, title: string, msg: string) => setFb({ visible: true, type, title, msg });
  const closeFb = () => setFb((f) => ({ ...f, visible: false }));

  const [prereqModalVisible, setPrereqModalVisible] = useState(false);
  const [utilityModalVisible, setUtilityModalVisible] = useState(false);
  const [govtIdModalVisible, setGovtIdModalVisible] = useState(false);

  // Proof of address
  const [proofType, setProofType] = useState<ProofOfAddressType>(ProofOfAddressType.METER_RECEIPT);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [uploadingUtility, setUploadingUtility] = useState(false);

  // Government ID
  const [govtIdType, setGovtIdType] = useState<GovernmentIdType>(GovernmentIdType.NIN);
  const [govtIdBase64, setGovtIdBase64] = useState<string | null>(null);
  const [govtIdFileName, setGovtIdFileName] = useState<string | null>(null);
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [uploadingGovtId, setUploadingGovtId] = useState(false);

  const [utilityBillDoc] = useState<string | null>(null); // kept for status calc only
  const [govtIdDoc] = useState<string | null>(null);      // kept for status calc only

  const utilityStatus: "COMPLETED" | "PENDING REVIEW" | "REQUIRED" =
    user?.utility_bill_provided || kycLevel >= 3
      ? "COMPLETED"
      : utilityBillDoc
        ? "PENDING REVIEW"
        : "REQUIRED";

  const govtIdStatus: "COMPLETED" | "PENDING REVIEW" | "REQUIRED" =
    kycLevel >= 3
      ? "COMPLETED"
      : govtIdDoc
        ? "PENDING REVIEW"
        : "REQUIRED";

  const handleTier3UploadPress = (type: "utility" | "govtid") => {
    if (!hasCompletedKyc1 || !hasCompletedKyc2 || !isProfileComplete) {
      router.push("/(root)/kyc");
      return;
    }
    if (type === "utility") setUtilityModalVisible(true);
    else setGovtIdModalVisible(true);
  };

  // Pick image or document and return base64
  const handlePickFile = async (target: "utility" | "govtid") => {
    try {
      if (Platform.OS === "ios") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { showFb("info", "Permission", "Photo library access is required."); return; }
      }
      // Try image picker first
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const b64 = asset.base64 || "";
        const name = asset.fileName || "document.jpg";
        if (target === "utility") { setProofBase64(b64); setProofFileName(name); }
        else { setGovtIdBase64(b64); setGovtIdFileName(name); }
      }
    } catch {
      showFb("error", "Upload Error", "Could not select the document.");
    }
  };

  const handleSubmitUtility = async () => {
    if (!proofBase64) { showFb("info", "Validation", "Please select a proof of address document."); return; }
    setUploadingUtility(true);
    try {
      await dispatch(submitDocUpload({
        address: user?.address_1 || undefined,
        city: user?.city || undefined,
        state: user?.state || undefined,
        proof_of_address_type: proofType,
        proof_of_address: proofBase64,
      })).unwrap();
      setUtilityModalVisible(false);
      setProofBase64(null); setProofFileName(null);
      showFb("success", "Submitted", "Proof of address submitted for compliance review.");
    } catch (err: any) {
      setUtilityModalVisible(false);
      showFb("error", "Submission Failed", typeof err === "string" ? err : "Failed to submit proof of address.");
    } finally { setUploadingUtility(false); }
  };

  const handleSubmitGovtId = async () => {
    if (!govtIdBase64) { showFb("info", "Validation", "Please select a photo of your Government ID."); return; }
    setUploadingGovtId(true);
    try {
      await dispatch(submitDocUpload({
        address: user?.address_1 || undefined,
        city: user?.city || undefined,
        state: user?.state || undefined,
        government_id_type: govtIdType,
        identification_number: identificationNumber.trim() || undefined,
        government_id: govtIdBase64,
      })).unwrap();
      setGovtIdModalVisible(false);
      setGovtIdBase64(null); setGovtIdFileName(null); setIdentificationNumber("");
      showFb("success", "Submitted", "Government ID submitted for compliance review.");
    } catch (err: any) {
      setGovtIdModalVisible(false);
      showFb("error", "Submission Failed", typeof err === "string" ? err : "Failed to submit Government ID.");
    } finally { setUploadingGovtId(false); }
  };

  const handleLaunchBVNLiveness = async (providedBvn?: string) => {
    const rawBvn = providedBvn || (user as any)?.bvn || (user as any)?.bvn_number || null;
    if (!rawBvn) {
      // If we don't have a raw BVN, prompt user for it via modal (no navigation)
      setBvnInput("");
      setBvnError("");
      setBvnModalVisible(true);
      return;
    }

    const reference = `${rawBvn}_${Date.now()}`;
    livenessRequest.current = { reference, bvn: String(rawBvn) };
    console.log(rawBvn)
    const body = { type: "collection", productCode: "liveness_bvn", reference };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      setIsVerifyingFace(true);
      const resp = await fetch(SESSIONTOKEN_ENDPOINT(), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const json = await resp.json().catch(() => ({}));
      console.log(json)
      if (!resp.ok) {
        const message = json?.data?.message || json?.message || `Session token request failed (${resp.status})`;
        showFb("error", "Session Token Error", message);
        setIsVerifyingFace(false);
        return;
      }

      const sessionToken =
        json?.data?.sdkSessionToken || json?.data?.sdk_session_token ||
        json?.data?.session_token || json?.data?.sessionToken ||
        json?.sdkSessionToken || json?.sdk_session_token ||
        json?.session_token || json?.sessionToken;
      if (!sessionToken) {
        showFb("error", "Session Token Error", "Session token not returned from server");
        setIsVerifyingFace(false);
        return;
      }

      const formData: any = {
        sessionToken,
        applicantData: {
          // firstName: user?.first_name || user?.firstName || "",
          // middleName: user?.middle_name || user?.middleName || "",
          // lastName: user?.last_name || user?.lastName || "",
          // gender: user?.gender || "",
          // phoneNumber: user?.phone || "",
          // email: user?.email || "",
          firstName: "Samson",
          middleName: user?.middle_name || user?.middleName || "",
          lastName: "Jabo",
          gender: user?.gender || "",
          phoneNumber: "+2348000000001",
          email: user?.email || "",
        },
        identityData: { idType: "BVN", idNumber: String(rawBvn) },
        addressData: { address: user?.address_1 || "", city: user?.city || "", lga: user?.local_government || "" },
      };

      // Launch the QoreId flow
      launchQoreId(formData);
    } catch (error: any) {
      livenessRequest.current = null;
      showFb("error", "Launch Error", error?.message || "Failed to request session token");
      setIsVerifyingFace(false);
    }
  };

  // ── Tier card component ─────────────────────────────────────────────────
  const TierCard = ({
    tier,
    daily,
    perTx,
    maxBal,
    feature,
    active,
    requirements,
  }: {
    tier: number;
    daily: string;
    perTx: string;
    maxBal: string;
    feature: string;
    active: boolean;
    requirements: React.ReactNode;
  }) => {
    const isCompleted = kycLevel >= tier;
    const isDark = tier < 3;

    return (
      <View
        style={{
          backgroundColor: isDark ? C.bgMid : C.white,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : C.cardBorder,
          borderWidth: 1,
        }}
        className="rounded-2xl p-5 mb-4 shadow-sm"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <Text style={{ color: isDark ? C.white : C.textPrimary }} className="text-lg font-outfit-bold">
              Tier {tier}
            </Text>
            <View
              style={{
                backgroundColor: isCompleted
                  ? "rgba(33,209,132,0.15)"
                  : tier === 3
                    ? "rgba(150,152,65,0.15)"
                    : "rgba(251,205,88,0.18)",
                borderColor: isCompleted
                  ? "rgba(33,209,132,0.4)"
                  : tier === 3
                    ? "rgba(150,152,65,0.4)"
                    : "rgba(251,205,88,0.5)",
                borderWidth: 1,
              }}
              className="px-2.5 py-0.5 rounded-full"
            >
              <Text
                style={{
                  color: isCompleted ? "#21D184" : tier === 3 ? C.accent : "#ca8a04",
                }}
                className="text-[10px] font-outfit-bold"
              >
                {isCompleted ? "ACTIVE" : tier === 3 ? "MAXIMUM TIER" : "UPGRADE AVAILABLE"}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color={isCompleted ? C.green : isDark ? "#4a5568" : C.cardBorder}
          />
        </View>

        {/* Limits */}
        <View style={{ borderTopColor: isDark ? C.bgMid : C.cardBorder, borderTopWidth: 1 }} className="pt-3">
          {[
            { label: "Daily limit", value: daily },
            { label: "Per transaction", value: perTx },
            { label: "Maximum balance", value: maxBal },
          ].map((row, i) => (
            <View
              key={i}
              style={{
                borderBottomColor: isDark ? C.bgMid : C.cardBorder,
                borderBottomWidth: i < 2 ? 1 : 0,
              }}
              className="flex-row justify-between items-center py-2"
            >
              <Text style={{ color: isDark ? "#a0a87a" : C.textSub }} className="text-xs font-outfit">
                {row.label}
              </Text>
              <Text
                style={{
                  color:
                    row.value === "Unlimited"
                      ? C.green
                      : isDark
                        ? C.white
                        : C.textPrimary,
                }}
                className="text-xs font-outfit-bold"
              >
                {row.value}
              </Text>
            </View>
          ))}

          <View className="flex-row items-center gap-2 pt-2">
            <MaterialCommunityIcons name="check-circle" size={15} color={C.green} />
            <Text style={{ color: isDark ? "#a0d8a0" : "#16a34a" }} className="text-xs font-outfit">
              {feature}
            </Text>
          </View>
        </View>

        {/* Requirements */}
        <View style={{ borderTopColor: isDark ? C.bgMid : C.cardBorder, borderTopWidth: 1 }} className="mt-4 pt-3">
          <Text
            style={{ color: isDark ? "#a0a87a" : C.textSub }}
            className="text-[11px] font-outfit-bold uppercase tracking-wider mb-2"
          >
            Verification Requirements
          </Text>
          {requirements}
        </View>
      </View>
    );
  };

  // ── Requirement row ─────────────────────────────────────────────────────
  const ReqRow = ({
    label,
    sublabel,
    pill,
    dark = false,
    isPrerequisite = false,
    onPress,
  }: {
    label: string;
    sublabel: string;
    pill: React.ReactNode;
    dark?: boolean;
    isPrerequisite?: boolean;
    onPress?: () => void;
  }) => {
    const inner = (
      <View
        style={{
          backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#FAFAF5",
          borderColor: dark ? "rgba(255,255,255,0.08)" : C.cardBorder,
          borderWidth: 1,
        }}
        className="rounded-xl p-3 flex-row items-center justify-between mb-2"
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text style={{ color: dark ? C.white : C.textPrimary }} className="text-xs font-outfit-medium">
              {label}
            </Text>
            {isPrerequisite && (
              <View style={{ backgroundColor: "rgba(251,205,88,0.2)", borderColor: "rgba(251,205,88,0.5)", borderWidth: 1 }} className="px-1.5 py-0.5 rounded">
                <Text style={{ color: "#ca8a04" }} className="text-[9px] font-outfit-bold">PREREQUISITE</Text>
              </View>
            )}
          </View>
          <Text style={{ color: dark ? "#a0a87a" : C.textMuted }} className="text-[10px] font-outfit mt-0.5">
            {sublabel}
          </Text>
        </View>
        {pill}
      </View>
    );
    if (onPress) {
      return <Pressable onPress={onPress} className="active:opacity-70">{inner}</Pressable>;
    }
    return inner;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Account Limits" />

      <ScrollView
        className="flex-1 px-4 py-2"
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active tier banner */}
        <View style={{ backgroundColor: C.bgMid }} className="rounded-2xl p-5 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: C.accent }} className="text-xs font-outfit">Active Account Tier</Text>
              <Text className="text-white text-xl font-outfit-bold mt-0.5">Tier {kycLevel} Account</Text>
            </View>
            <View style={{ backgroundColor: C.green }} className="px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="check-decagram" size={14} color={C.bgDark} />
              <Text style={{ color: C.bgDark }} className="text-xs font-outfit-bold">Level {kycLevel} Active</Text>
            </View>
          </View>
          <Text style={{ color: "#a0a87a" }} className="text-xs font-outfit mt-3 leading-4">
            Tier verification levels determine your single transfer limit, daily limit, and balance ceiling in accordance with CBN regulations.
          </Text>
        </View>

        {/* ── TIER 1 ─────────────────────────────────────────────────── */}
        <TierCard
          tier={1}
          daily="₦300,000.00"
          perTx="₦50,000.00"
          maxBal="₦300,000.00"
          feature="Base Account: Local inbound/outbound transfers & wallet"
          active={kycLevel >= 1}
          requirements={
            <>
              {/* <ReqRow
                dark
                label="Bank Verification Number"
                sublabel="11-digit BVN"
                pill={<StatusPill status="COMPLETED" />}
              /> */}
              {
                // Determine BVN liveness status from user flags
              }
              <ReqRow
                dark
                label="BVN Liveness Check"
                sublabel="Facial liveness match"
                pill={
                  (user?.facial_verification_status === "verified" || user?.bvn_verified)
                    ? <StatusPill status="COMPLETED" />
                    : <StatusPill status="VERIFY" onPress={() => handleLaunchBVNLiveness()} />
                }
              />
            </>
          }
        />

        {/* ── TIER 2 ─────────────────────────────────────────────────── */}
        <TierCard
          tier={2}
          daily="₦500,000.00"
          perTx="₦200,000.00"
          maxBal="₦500,000.00"
          feature="Increased daily throughput & transaction limits"
          active={kycLevel >= 2}
          requirements={
            <>
              <ReqRow
                dark
                label="Tier 1 Profile"
                sublabel="BVN verification"
                pill={<StatusPill status="COMPLETED" />}
              />
              <ReqRow
                dark
                label="National Identity Number (NIN / vNIN)"
                sublabel="11-digit NIN or 16-char vNIN"
                pill={
                  kycLevel >= 2 ? (
                    <StatusPill status="COMPLETED" />
                  ) : (
                    <StatusPill status="VERIFY" onPress={() => router.push("/(root)/kyc")} />
                  )
                }
              />
            </>
          }
        />

        {/* ── TIER 3 ─────────────────────────────────────────────────── */}
        <TierCard
          tier={3}
          daily="₦5,000,000.00"
          perTx="₦2,000,000.00"
          maxBal="Unlimited"
          feature="High-value transfers, credit/loan eligibility & international"
          active={kycLevel >= 3}
          requirements={
            <>
              {/* <ReqRow
                label="1. Profile Information"
                sublabel="Residential address, employment & next of kin"
                isPrerequisite
                pill={
                  isProfileComplete ? (
                    <StatusPill status="COMPLETED" />
                  ) : (
                    <StatusPill
                      status="COMPLETE"
                      onPress={() => router.push("/(root)/accounts/profile-info" as any)}
                    />
                  )
                }
              /> */}
              <ReqRow
                label="1. Proof of Address"
                sublabel="Prepaid meter number or utility bill upload"
                onPress={utilityStatus !== "COMPLETED" ? () => handleTier3UploadPress("utility") : undefined}
                pill={
                  <StatusPill
                    status={utilityStatus === "REQUIRED" ? "UPLOAD" : utilityStatus}
                    onPress={utilityStatus !== "COMPLETED" ? () => handleTier3UploadPress("utility") : undefined}
                  />
                }
              />
              <ReqRow
                label="2. Government-Issued ID"
                sublabel="Passport, Driver's License, Voter's Card, or NIN Slip"
                onPress={govtIdStatus !== "COMPLETED" ? () => handleTier3UploadPress("govtid") : undefined}
                pill={
                  <StatusPill
                    status={govtIdStatus === "REQUIRED" ? "UPLOAD" : govtIdStatus}
                    onPress={govtIdStatus !== "COMPLETED" ? () => handleTier3UploadPress("govtid") : undefined}
                  />
                }
              />
            </>
          }
        />

        {/* Upgrade CTA */}
        {kycLevel < 3 && (
          <Pressable
            onPress={() => {
              // debug: log upgrade click and navigate
              console.log("Upgrade CTA clicked - kycLevel:", kycLevel);
              showFb("info", "Navigation", `Attempting to navigate for kycLevel ${kycLevel}`);
              if (kycLevel === 0 || kycLevel === 1) router.push("/(root)/kyc");
              else handleTier3UploadPress("utility");
            }}
            style={{ backgroundColor: C.bgDark }}
            className="rounded-2xl py-4 items-center shadow-sm active:opacity-90 flex-row justify-center gap-2"
          >
            <Text className="text-white text-sm font-outfit-bold">
              {kycLevel === 0
                ? "Complete KYC to Activate Account"
                : kycLevel === 1
                  ? "Upgrade to Tier 2 — Enter NIN"
                  : "Complete Tier 3 Verification"}
            </Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </ScrollView>

      {/* PREREQUISITE LOCKING BOTTOM SHEET */}
      <BottomSheet
        visible={prereqModalVisible}
        onClose={() => setPrereqModalVisible(false)}
        title="Complete Profile First"
        buttonText="Go to Profile Information"
        onConfirm={() => {
          setPrereqModalVisible(false);
          router.push("/(root)/accounts/profile-info" as any);
        }}
      >
        <View className="py-2 items-center">
          <View style={{ backgroundColor: "rgba(251,205,88,0.15)" }} className="w-14 h-14 rounded-full justify-center items-center mb-4">
            <MaterialCommunityIcons name="lock-alert" size={30} color="#ca8a04" />
          </View>
          <Text style={{ color: C.textPrimary }} className="text-base font-outfit-bold text-center mb-2">
            Prerequisite Action Required
          </Text>
          <Text style={{ color: C.textSub }} className="text-xs font-outfit text-center leading-5 px-2 mb-4">
            Before uploading your utility bill or Government-issued ID for Tier 3 verification, please complete your residential address, occupation, and next of kin details in Profile Information.
          </Text>
        </View>
      </BottomSheet>

      {/* BVN input modal (used when raw BVN not available) */}
      <Modal transparent animationType="fade" visible={bvnModalVisible} onRequestClose={() => setBvnModalVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }} onPress={() => setBvnModalVisible(false)}>
          <Pressable style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 420 }} onPress={() => { }}>
            <Text style={{ fontFamily: "OutfitBold", fontSize: 17, color: "#2A2B0F", marginBottom: 8 }}>Enter your BVN</Text>
            <Text style={{ fontFamily: "Outfit", fontSize: 13, color: "#7A7B5A", marginBottom: 12 }}>Provide your 11-digit BVN to run the liveness check.</Text>
            <TextInput
              value={bvnInput}
              onChangeText={(t) => { setBvnInput(t.replace(/\D/g, "")); setBvnError(""); }}
              placeholder="12345678901"
              keyboardType="numeric"
              maxLength={11}
              placeholderTextColor="#9A9B7A"
              style={{ backgroundColor: "#FAFAF5", borderColor: C.cardBorder, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: C.textPrimary, fontFamily: "Outfit", fontSize: 14, marginBottom: 8 }}
            />
            {bvnError ? <Text style={{ color: "#EF4444", fontSize: 12, marginBottom: 8 }}>{bvnError}</Text> : null}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <Pressable onPress={() => setBvnModalVisible(false)} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: C.bgDark, marginRight: 8 }}>
                <Text style={{ color: "#fff", fontFamily: "OutfitBold" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  const isValid = /^\d{11}$/.test(bvnInput);
                  if (!isValid) { setBvnError("BVN must be 11 digits"); return; }
                  setBvnModalVisible(false);
                  await handleLaunchBVNLiveness(bvnInput);
                }}
                style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: C.green }}
              >
                <Text style={{ color: "#fff", fontFamily: "OutfitBold" }}>Submit</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* PROOF OF ADDRESS BOTTOM SHEET */}
      <BottomSheet
        visible={utilityModalVisible}
        onClose={() => setUtilityModalVisible(false)}
        title="Proof of Address"
        buttonText={uploadingUtility ? "Submitting..." : "Submit Proof of Address"}
        onConfirm={handleSubmitUtility}
      >
        <View className="py-2">
          <Text style={{ color: C.textSub }} className="text-xs font-outfit mb-3">
            Select the document type and upload a clear copy from your gallery or files.
          </Text>

          {/* Type picker */}
          <Text style={{ color: C.textPrimary }} className="text-xs font-outfit-bold mb-2">Document Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {PROOF_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setProofType(opt.value)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 6,
                  backgroundColor: proofType === opt.value ? C.bgDark : C.white,
                  borderColor: proofType === opt.value ? C.bgDark : C.cardBorder,
                  borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                }}
              >
                <MaterialCommunityIcons name={opt.icon as any} size={14} color={proofType === opt.value ? "#fff" : C.textSub} />
                <Text style={{ color: proofType === opt.value ? "#fff" : C.textPrimary, fontSize: 11, fontFamily: "OutfitMedium" }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* File picker */}
          <Pressable
            onPress={() => handlePickFile("utility")}
            style={{ borderColor: C.accent, borderWidth: 2, borderStyle: "dashed", borderRadius: 12, backgroundColor: "#FAFAF5" }}
            className="p-5 items-center"
          >
            <MaterialCommunityIcons name="file-upload-outline" size={30} color={C.accent} />
            <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 12, marginTop: 6, textAlign: "center" }}>
              {proofFileName ? `✓ ${proofFileName}` : "Tap to choose from Gallery or Files"}
            </Text>
            {proofFileName && (
              <Text style={{ color: C.green, fontSize: 10, fontFamily: "Outfit", marginTop: 2 }}>File ready to upload</Text>
            )}
          </Pressable>
        </View>
      </BottomSheet>

      {/* GOVERNMENT ID BOTTOM SHEET */}
      <BottomSheet
        visible={govtIdModalVisible}
        onClose={() => setGovtIdModalVisible(false)}
        title="Government-Issued ID"
        buttonText={uploadingGovtId ? "Uploading..." : "Submit Government ID"}
        onConfirm={handleSubmitGovtId}
      >
        <View className="py-2">
          <Text style={{ color: C.textSub }} className="text-xs font-outfit mb-3">
            Select your ID type, enter the ID number, then upload a clear photo or scan.
          </Text>

          {/* ID type picker */}
          <Text style={{ color: C.textPrimary }} className="text-xs font-outfit-bold mb-2">ID Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {GOVT_ID_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setGovtIdType(opt.value)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 6,
                  backgroundColor: govtIdType === opt.value ? C.bgDark : C.white,
                  borderColor: govtIdType === opt.value ? C.bgDark : C.cardBorder,
                  borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                }}
              >
                <MaterialCommunityIcons name={opt.icon as any} size={14} color={govtIdType === opt.value ? "#fff" : C.textSub} />
                <Text style={{ color: govtIdType === opt.value ? "#fff" : C.textPrimary, fontSize: 11, fontFamily: "OutfitMedium" }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* ID Number */}
          <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 12, marginBottom: 6 }}>ID / Document Number</Text>
          <TextInput
            value={identificationNumber}
            onChangeText={setIdentificationNumber}
            placeholder={`Enter your ${GOVT_ID_OPTIONS.find(o => o.value === govtIdType)?.label || "ID"} number`}
            placeholderTextColor="#9A9B7A"
            style={{ backgroundColor: "#FAFAF5", borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: C.textPrimary, fontFamily: "Outfit", fontSize: 13, marginBottom: 14 }}
          />

          {/* File picker */}
          <Pressable
            onPress={() => handlePickFile("govtid")}
            style={{ borderColor: C.accent, borderWidth: 2, borderStyle: "dashed", borderRadius: 12, backgroundColor: "#FAFAF5" }}
            className="p-5 items-center"
          >
            <MaterialCommunityIcons name="card-account-details-outline" size={30} color={C.accent} />
            <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 12, marginTop: 6, textAlign: "center" }}>
              {govtIdFileName ? `✓ ${govtIdFileName}` : `Upload photo of your ${GOVT_ID_OPTIONS.find(o => o.value === govtIdType)?.label}`}
            </Text>
            {govtIdFileName && (
              <Text style={{ color: C.green, fontSize: 10, fontFamily: "Outfit", marginTop: 2 }}>File ready to upload</Text>
            )}
          </Pressable>
        </View>
      </BottomSheet>

      {/* FEEDBACK MODAL */}
      <Modal transparent animationType="fade" visible={fb.visible} onRequestClose={closeFb}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }} onPress={closeFb}>
          <Pressable style={{ backgroundColor: "#fff", borderRadius: 24, padding: 28, width: "100%", alignItems: "center", elevation: 10 }} onPress={() => { }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: fb.type === "success" ? "rgba(33,209,132,0.12)" : fb.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.12)", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
              <MaterialCommunityIcons
                name={fb.type === "success" ? "check-circle" : fb.type === "error" ? "close-circle" : "alert-circle"}
                size={36}
                color={fb.type === "success" ? "#21D184" : fb.type === "error" ? "#EF4444" : "#F59E0B"}
              />
            </View>
            <Text style={{ fontFamily: "OutfitBold", fontSize: 17, color: "#2A2B0F", marginBottom: 8, textAlign: "center" }}>{fb.title}</Text>
            <Text style={{ fontFamily: "Outfit", fontSize: 13, color: "#7A7B5A", textAlign: "center", lineHeight: 20 }}>{fb.msg}</Text>
            <Pressable onPress={closeFb} style={{ marginTop: 24, backgroundColor: C.bgDark, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 40 }}>
              <Text style={{ fontFamily: "OutfitBold", fontSize: 14, color: "#fff" }}>OK</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <FaceVerificationProgressModal visible={isVerifyingFace} />
    </SafeAreaView>
  );
}
