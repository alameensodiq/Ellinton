import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  ActionSheetIOS,
  InteractionManager,
  TouchableOpacity,
  Keyboard,
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
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { isValidDocumentDataUri, normalizeDataUri, prepareImageForUpload } from "@/app/lib/imageUpload";
import { fetchProfileCompletion, getUserProfile, submitDocUpload, submitGovernmentId, submitProofOfAddress, GovernmentIdType, ProofOfAddressType, type ProfileCompletion } from "@/app/lib/thunks/authThunks";

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

const MAX_TIER3_DOCUMENT_BYTES = 4 * 1024 * 1024;
const MAX_TIER3_DOCUMENT_LABEL = "4 MB";
const SESSION_TOKEN_TIMEOUT_MS = 30 * 1000;
// Max time to wait for our backend to return the liveness result (after QoreID finishes).
const FACE_VERIFICATION_TIMEOUT_MS = 30 * 1000;
// Safety net only: if QoreID never calls back (e.g. user closes it), stop the loader.
const QOREID_RESULT_WATCHDOG_MS = 5 * 60 * 1000;

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

const getIdentificationNumberError = (
  type: GovernmentIdType,
  value: string,
): string | null => {
  const id = value.trim().toUpperCase();
  if (!id) return null;

  switch (type) {
    case GovernmentIdType.PASSPORT:
      return /^[A-Z]\d{8}$/.test(id)
        ? null
        : "Passport number must be 1 uppercase letter followed by 8 digits.";
    case GovernmentIdType.VOTERS_CARD:
      return /^[A-Z0-9]{19}$/.test(id)
        ? null
        : "Voter's Card number must contain 19 letters or digits.";
    case GovernmentIdType.DRIVERS_LICENSE:
      return /^[A-Z]{3}\d{5}[A-Z]{2}\d{1,2}$/.test(id)
        ? null
        : "Driver's License number must match the 11 or 12 character format.";
    case GovernmentIdType.NIN:
    case GovernmentIdType.NATIONAL_ID:
      return /^\d{11}$/.test(id) ? null : "NIN must contain 11 digits.";
    default:
      return null;
  }
};

const getIdentificationNumberMaxLength = (type: GovernmentIdType) => {
  switch (type) {
    case GovernmentIdType.PASSPORT:
      return 9;
    case GovernmentIdType.VOTERS_CARD:
      return 19;
    case GovernmentIdType.DRIVERS_LICENSE:
      return 12;
    default:
      return 11;
  }
};

export default function AccountLimitsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => (state as any).auth.token);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);

  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const livenessRequest = useRef<{ reference: string; bvn: string } | null>(null);
  const isCheckingLiveness = useRef(false);
  const qoreIdWatchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bvnModalVisible, setBvnModalVisible] = useState(false);
  const [bvnInput, setBvnInput] = useState("");
  const [bvnError, setBvnError] = useState("");

  const clearQoreIdWatchdog = () => {
    if (qoreIdWatchdog.current) {
      clearTimeout(qoreIdWatchdog.current);
      qoreIdWatchdog.current = null;
    }
  };

  useEffect(() => clearQoreIdWatchdog, []);

  const onQoreResult = async () => {
    // QoreID has responded, so the "no callback" safety net is no longer needed.
    clearQoreIdWatchdog();
    if (isCheckingLiveness.current) return;

    const request = livenessRequest.current;
    if (!request) {
      setIsVerifyingFace(false);
      // showFb("error", "Verification", "Unable to confirm the liveness result.");
      return;
    }

    isCheckingLiveness.current = true;
    const controller = new AbortController();
    let didResultTimeout = false;
    const resultTimeoutId = setTimeout(() => {
      didResultTimeout = true;
      controller.abort();
    }, FACE_VERIFICATION_TIMEOUT_MS);
    try {
      // QoreID completes first; allow the provider time to persist the result
      // before asking our backend for the definitive verification status.
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(ONBOARDING_ENDPOINT(request.reference), {
        method: "GET",
        headers,
        signal: controller.signal,
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
          // console.warn("Unable to refresh profile after liveness verification:", error);
        });
        setIsVerifyingFace(false);
        showFbAfterDismiss("success", "Verification", "BVN liveness completed.");
      } else {
        // Only now do we know the verification actually failed.
        setIsVerifyingFace(false);
        showFbAfterDismiss(
          "error",
          "Verification Failed",
          result?.message || payload?.message || "Something went wrong, Please try again"
        );
      }
    } catch (error: any) {
      setIsVerifyingFace(false);
      showFbAfterDismiss(
        "error",
        "Verification Failed",
        didResultTimeout
          ? "Verification is taking too long. Please try again."
          : "Something went wrong, Please try again"
      );
    } finally {
      clearTimeout(resultTimeoutId);
      livenessRequest.current = null;
      isCheckingLiveness.current = false;
    }
  };

  const { launchQoreId } = useQoreIdSdk({ onResult: onQoreResult });

  const hasAccount = Boolean(user?.account_number);
  const kycLevel = hasAccount ? (user?.kyc_level || 1) : 0;

  const missingProfileFields = profileCompletion?.missing_fields ?? [];
  const isProfileComplete =
    profileCompletion?.completion_percentage === 100 &&
    missingProfileFields.length === 0;
  const hasVerifiedBvn =
    user?.bvn_verified === true;
  const hasVerifiedNin = user?.nin_verified === true;
  // A tier is complete only after its verification steps and corresponding
  // server KYC level have both been confirmed.
  const hasCompletedTier1 = kycLevel >= 1 && hasVerifiedBvn;
  const hasCompletedTier2 = kycLevel >= 2 && hasCompletedTier1 && hasVerifiedNin;
  const canUploadTier3Documents =
    hasCompletedTier1 && hasCompletedTier2 && isProfileComplete;

  useEffect(() => {
    dispatch(fetchProfileCompletion())
      .unwrap()
      .then(setProfileCompletion)
      .catch((error) => {

      });
  }, [dispatch]);
  // ── Feedback modal state
  type FBType = "success" | "error" | "info";
  const [fb, setFb] = useState<{ visible: boolean; type: FBType; title: string; msg: string }>(
    { visible: false, type: "success", title: "", msg: "" }
  );
  const showFb = (type: FBType, title: string, msg: string) => setFb({ visible: true, type, title, msg });
  const closeFb = () => setFb((f) => ({ ...f, visible: false }));
  // iOS silently drops a Modal presented while another Modal is dismissing.
  // Use this whenever a sheet/loader is closed in the same step as the popup.
  const showFbAfterDismiss = (type: FBType, title: string, msg: string) => {
    if (Platform.OS === "ios") setTimeout(() => showFb(type, title, msg), 500);
    else showFb(type, title, msg);
  };


  const [prereqModalVisible, setPrereqModalVisible] = useState(false);
  const [utilityModalVisible, setUtilityModalVisible] = useState(false);
  const [govtIdModalVisible, setGovtIdModalVisible] = useState(false);
  const [documentPickerTarget, setDocumentPickerTarget] = useState<"utility" | "govtid" | null>(null);
  const [preparingDocument, setPreparingDocument] = useState(false);

  // Proof of address
  const [proofType, setProofType] = useState<ProofOfAddressType>(ProofOfAddressType.METER_RECEIPT);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [uploadingUtility, setUploadingUtility] = useState(false);
  const [submittingTier3Upgrade, setSubmittingTier3Upgrade] = useState(false);

  // Government ID
  const [govtIdType, setGovtIdType] = useState<GovernmentIdType>(GovernmentIdType.NIN);
  const [govtIdBase64, setGovtIdBase64] = useState<string | null>(null);
  const [govtIdFileName, setGovtIdFileName] = useState<string | null>(null);
  const [identificationNumber, setIdentificationNumber] = useState("");
  const identificationNumberInputRef = useRef<TextInput>(null);
  const shouldRefocusIdentificationNumber = useRef(false);
  const [uploadingGovtId, setUploadingGovtId] = useState(false);
  const isNinId =
    govtIdType === GovernmentIdType.NIN ||
    govtIdType === GovernmentIdType.NATIONAL_ID;

  useEffect(() => {
    if (!shouldRefocusIdentificationNumber.current) return;

    // iOS may keep the old keyboard type if the field is refocused while the
    // previous keyboard is still dismissing. Wait for dismissal to finish so
    // the updated keyboardType is applied before focusing the same input.
    const timeout = setTimeout(() => {
      shouldRefocusIdentificationNumber.current = false;
      identificationNumberInputRef.current?.focus();
    }, Platform.OS === "ios" ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [govtIdType]);

  // Document status comes from the latest user profile returned by the API.
  // These verification fields are the source of truth for Tier 3 documents.
  const isProofOfAddressVerified = (user as any)?.proof_of_address_verified === true;
  const isGovernmentIdVerified = (user as any)?.goverment_id_verified === true;
  const hasCompletedTier3 =
    kycLevel >= 3 && isProofOfAddressVerified && isGovernmentIdVerified;
  const canSubmitTier3Upgrade =
    canUploadTier3Documents &&
    isProofOfAddressVerified &&
    isGovernmentIdVerified;

  const tierCompletion = {
    1: hasCompletedTier1,
    2: hasCompletedTier2,
    3: hasCompletedTier3,
  } as const;

  const utilityStatus: "COMPLETED" | "PENDING REVIEW" | "REQUIRED" =
    isProofOfAddressVerified
      ? "COMPLETED"
      : "REQUIRED";

  const govtIdStatus: "COMPLETED" | "PENDING REVIEW" | "REQUIRED" =
    isGovernmentIdVerified
      ? "COMPLETED"
      : "REQUIRED";

  const handleTier2VerificationPress = () => {
    if (!hasCompletedTier1) {
      handleLaunchBVNLiveness();
      return;
    }

    router.push("/(root)/kyc");
  };

  const handleTier3UploadPress = async (type: "utility" | "govtid") => {
    if (!hasCompletedTier1) {
      handleTier2VerificationPress();
      return;
    }

    if (!hasCompletedTier2) {
      handleTier2VerificationPress();
      return;
    }

    // Profile Info can be edited while this screen stays mounted. Always use
    // the latest server result here instead of the completion snapshot from
    // the first render, otherwise a completed profile remains locked out.
    let completion: ProfileCompletion;
    try {
      completion = await dispatch(fetchProfileCompletion()).unwrap();
      setProfileCompletion(completion);
    } catch {
      showFb("error", "Unable to Check Profile", "Please try again in a moment.");
      return;
    }

    const missingFields = completion.missing_fields ?? [];
    if (completion.completion_percentage < 100 || missingFields.length > 0) {
      setPrereqModalVisible(true);
      return;
    }


    if (type === "utility") setUtilityModalVisible(true);
    else setGovtIdModalVisible(true);
  };

  const saveSelectedDocument = (target: "utility" | "govtid", dataUri: string, name: string) => {
    if (target === "utility") {
      setProofBase64(dataUri);
      setProofFileName(name);
    } else {
      setGovtIdBase64(dataUri);
      setGovtIdFileName(name);
    }
  };

  const handlePickImage = async (target: "utility" | "govtid") => {
    try {
      // iOS 14+ uses PHPicker which needs no library permission; requesting it
      // can return "limited" and wrongly block the user.
      // Try image picker first
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        base64: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        setPreparingDocument(true);
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const size = (fileInfo as { size?: number }).size ?? asset.fileSize ?? 0;
        if (size > MAX_TIER3_DOCUMENT_BYTES) {
          showFbAfterDismiss("info", "File Too Large", `Please select a document no larger than ${MAX_TIER3_DOCUMENT_LABEL}.`);
          return;
        }
        const preparedImage = await prepareImageForUpload(asset.uri, {
          maxBytes: MAX_TIER3_DOCUMENT_BYTES,
          startWidth: 1080,
          minWidth: 600,
          initialCompress: 0.65,
          minCompress: 0.22,
        });

        if (preparedImage.size > MAX_TIER3_DOCUMENT_BYTES || !preparedImage.base64) {
          showFbAfterDismiss("info", "Image Too Large", `Please select an image no larger than ${MAX_TIER3_DOCUMENT_LABEL}.`);
          return;
        }

        const dataUri = normalizeDataUri(
          preparedImage.base64,
          asset.mimeType || "image/jpeg"
        );
        saveSelectedDocument(target, dataUri, asset.fileName || "document.jpg");
      }
    } catch {
      showFbAfterDismiss("error", "Upload Error", "Could not select the document.");
    } finally {
      setPreparingDocument(false);
      if (Platform.OS !== "ios") {
        if (target === "utility") setUtilityModalVisible(true);
        else setGovtIdModalVisible(true);
      }
    }
  };

  const handlePickDeviceFile = async (target: "utility" | "govtid") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPreparingDocument(true);
      const isPdf =
        asset.mimeType === "application/pdf" ||
        asset.name.toLowerCase().endsWith(".pdf");
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      const size = (fileInfo as { size?: number }).size ?? asset.size ?? 0;
      if (size > MAX_TIER3_DOCUMENT_BYTES) {
        showFbAfterDismiss("info", "File Too Large", `Please select a document no larger than ${MAX_TIER3_DOCUMENT_LABEL}.`);
        return;
      }

      if (!isPdf) {
        const preparedImage = await prepareImageForUpload(asset.uri, {
          maxBytes: MAX_TIER3_DOCUMENT_BYTES,
          startWidth: 1080,
          minWidth: 600,
          initialCompress: 0.65,
          minCompress: 0.22,
        });
        if (preparedImage.size > MAX_TIER3_DOCUMENT_BYTES || !preparedImage.base64) {
          showFbAfterDismiss("info", "Image Too Large", `Please select an image no larger than ${MAX_TIER3_DOCUMENT_LABEL}.`);
          return;
        }
        saveSelectedDocument(
          target,
          normalizeDataUri(preparedImage.base64, asset.mimeType || "image/jpeg"),
          asset.name
        );
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: "base64" });
      const dataUri = normalizeDataUri(base64, "application/pdf");
      if (!dataUri || !isValidDocumentDataUri(dataUri)) {
        showFbAfterDismiss("error", "Upload Error", "The selected PDF could not be read.");
        return;
      }
      saveSelectedDocument(target, dataUri, asset.name);
    } catch {
      showFbAfterDismiss("error", "Upload Error", "Could not select the document.");
    } finally {
      setPreparingDocument(false);
      if (Platform.OS !== "ios") {
        if (target === "utility") setUtilityModalVisible(true);
        else setGovtIdModalVisible(true);
      }
    }
  };

  // Images are picked from the photo library; PDFs and files are picked from
  // the device's document provider.
  const handlePickFile = (target: "utility" | "govtid") => {
    if (preparingDocument) return;
    if (Platform.OS === "ios") {
      // iOS: keep the sheet open and present the native action sheet + pickers
      // on top of it. Dismissing the RN Modal while presenting a picker makes
      // iOS silently drop the picker.
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Upload Document",
          message: "Choose an image from your gallery or a JPEG, PNG, or PDF from your files.",
          options: ["Gallery", "Files", "Cancel"],
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 2) return;
          // Wait for the action sheet to fully dismiss before presenting.
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              if (index === 0) void handlePickImage(target);
              else void handlePickDeviceFile(target);
            }, 350);
          });
        }
      );
      return;
    }
    setDocumentPickerTarget(target);
  };

  const selectDocumentSource = async (source: "gallery" | "files") => {
    const target = documentPickerTarget;
    if (!target) return;

    setDocumentPickerTarget(null);
    setUtilityModalVisible(false);
    setGovtIdModalVisible(false);
    // Let the upload sheet's native Modal dismiss before presenting the OS picker.
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (source === "gallery") {
      void handlePickImage(target);
    } else {
      void handlePickDeviceFile(target);
    }
  };

  const renderDocumentSourceChoice = () => (
    <View className="py-2">
      <Text style={{ color: C.textSub }} className="text-xs font-outfit mb-4">
        Select an image from your gallery or a JPEG, PNG, or PDF from your files.
      </Text>
      <Pressable
        onPress={() => void selectDocumentSource("gallery")}
        style={{ backgroundColor: "#FAFAF5", borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <MaterialCommunityIcons name="image-outline" size={22} color={C.bgDark} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: C.textPrimary, fontFamily: "OutfitBold", fontSize: 14 }}>Gallery</Text>
          <Text style={{ color: C.textSub, fontFamily: "Outfit", fontSize: 11, marginTop: 2 }}>Choose an image from your photo library</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => void selectDocumentSource("files")}
        style={{ backgroundColor: "#FAFAF5", borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center" }}
      >
        <MaterialCommunityIcons name="file-document-outline" size={22} color={C.bgDark} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: C.textPrimary, fontFamily: "OutfitBold", fontSize: 14 }}>Files</Text>
          <Text style={{ color: C.textSub, fontFamily: "Outfit", fontSize: 11, marginTop: 2 }}>Choose a JPEG, PNG, or PDF file</Text>
        </View>
      </Pressable>
      <Pressable onPress={() => setDocumentPickerTarget(null)} style={{ alignItems: "center", paddingVertical: 14 }}>
        <Text style={{ color: C.bgDark, fontFamily: "OutfitBold", fontSize: 14 }}>Cancel</Text>
      </Pressable>
    </View>
  );

  const handleSubmitUtility = async () => {
    if (uploadingUtility) return;
    if (!canUploadTier3Documents) {
      setUtilityModalVisible(false);
      handleTier3UploadPress("utility");
      return;
    }

    if (!proofBase64 || !isValidDocumentDataUri(proofBase64)) {
      showFb("info", "Validation", "Please select a valid proof of address document in JPEG, PNG or PDF format.");
      return;
    }

    // The proof-of-address endpoint requires the residential address details
    // alongside the document. The profile API stores the street address as
    // `address_1`, while this endpoint expects it as `address`.
    const address = String(user?.address ?? user?.address_1 ?? "").trim();
    const city = String(user?.city ?? "").trim();
    const state = String(user?.state ?? "").trim();

    if (!address || !city || !state) {
      showFb(
        "info",
        "Complete Residential Address",
        "Please add your address, city, and state in your profile before submitting proof of address."
      );
      return;
    }

    setUploadingUtility(true);
    try {
      await dispatch(submitProofOfAddress({
        address,
        city,
        state,
        proof_of_address_type: proofType,
        proof_of_address: proofBase64,
      })).unwrap();
      await dispatch(getUserProfile()).unwrap().catch((error) => {
        console.warn("Unable to refresh profile after proof-of-address upload:", error);
      });
      setUploadingUtility(false);
      setUtilityModalVisible(false);
      setProofBase64(null); setProofFileName(null);
      showFbAfterDismiss("success", "Submitted", "Proof of address submitted for compliance review.");
    } catch (err: any) {
      setUploadingUtility(false);
      setUtilityModalVisible(false);
      showFbAfterDismiss("error", "Submission Failed", typeof err === "string" ? err : "Failed to submit proof of address.");
    }
  };

  const handleSubmitGovtId = async () => {
    if (uploadingGovtId) return;
    if (!canUploadTier3Documents) {
      setGovtIdModalVisible(false);
      handleTier3UploadPress("govtid");
      return;
    }

    if (!govtIdBase64 || !isValidDocumentDataUri(govtIdBase64)) {
      showFb("info", "Validation", "Please select a valid Government ID document in JPEG, PNG or PDF format.");
      return;
    }
    const identificationNumberError = getIdentificationNumberError(
      govtIdType,
      identificationNumber,
    );
    if (identificationNumberError) {
      showFb("info", "Validation", identificationNumberError);
      return;
    }
    setUploadingGovtId(true);
    try {
      await dispatch(submitGovernmentId({
        government_id_type: govtIdType,
        identification_number: identificationNumber.trim() || undefined,
        government_id: govtIdBase64,
      })).unwrap();
      await dispatch(getUserProfile()).unwrap().catch((error) => {
        console.warn("Unable to refresh profile after Government ID upload:", error);
      });
      setUploadingGovtId(false);
      setGovtIdModalVisible(false);
      setGovtIdBase64(null); setGovtIdFileName(null); setIdentificationNumber("");
      showFbAfterDismiss("success", "Submitted", "Government ID submitted for compliance review.");
    } catch (err: any) {
      setUploadingGovtId(false);
      setGovtIdModalVisible(false);
      showFbAfterDismiss("error", "Submission Failed", typeof err === "string" ? err : "Failed to submit Government ID.");
    }
  };

  const handleTier3Upgrade = async () => {
    if (!canSubmitTier3Upgrade || submittingTier3Upgrade) return;

    setSubmittingTier3Upgrade(true);
    try {
      await dispatch(submitDocUpload()).unwrap();
      await Promise.all([
        dispatch(getUserProfile()).unwrap(),
        dispatch(fetchProfileCompletion()).unwrap().then(setProfileCompletion),
      ]);
      showFb("success", "Tier 3 Submitted", "Your Tier 3 verification request has been submitted.");
    } catch (error: any) {
      showFb(
        "error",
        "Submission Failed",
        typeof error === "string" ? error : error?.message || "Unable to submit your Tier 3 verification request."
      );
    } finally {
      setSubmittingTier3Upgrade(false);
    }
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

    const controller = new AbortController();
    let didSessionTokenRequestTimeout = false;
    const timeoutId = setTimeout(() => {
      didSessionTokenRequestTimeout = true;
      controller.abort();
    }, SESSION_TOKEN_TIMEOUT_MS);

    try {
      const resp = await fetch(SESSIONTOKEN_ENDPOINT(), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await resp.json().catch(() => ({}));
      console.log(json)
      if (!resp.ok) {
        showFb("error", "BVN Verification", "BVN has been used");
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
      setIsVerifyingFace(true);
      clearQoreIdWatchdog();
      qoreIdWatchdog.current = setTimeout(() => {
        qoreIdWatchdog.current = null;
        // Never interrupt a result check that is already in progress.
        if (isCheckingLiveness.current) return;
        livenessRequest.current = null;
        setIsVerifyingFace(false);
      }, QOREID_RESULT_WATCHDOG_MS);
      launchQoreId(formData);
    } catch (error: any) {
      livenessRequest.current = null;
      if (didSessionTokenRequestTimeout) {
        // showFb(
        //   "error",
        //   "Timeout Error",
        //   "The session token request took too long. Please try again."
        // );
      } else {
        // showFb("error", "Launch Error", error?.message || "Failed to request session token");
      }
      setIsVerifyingFace(false);
    } finally {
      clearTimeout(timeoutId);
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
    const isCompleted = tierCompletion[tier as keyof typeof tierCompletion] ?? false;
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
                  hasVerifiedBvn
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
                pill={
                  hasCompletedTier1 ? (
                    <StatusPill status="COMPLETED" />
                  ) : (
                    <StatusPill status="REQUIRED" />
                  )
                }
              />
              <ReqRow
                dark
                label="National Identity Number (NIN / vNIN)"
                sublabel="11-digit NIN or 16-char vNIN"
                pill={
                  hasCompletedTier2 ? (
                    <StatusPill status="COMPLETED" />
                  ) : (
                    <StatusPill status="VERIFY" onPress={handleTier2VerificationPress} />
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
            disabled={!canSubmitTier3Upgrade || submittingTier3Upgrade}
            onPress={() => void handleTier3Upgrade()}
            style={{
              backgroundColor: C.bgDark,
              opacity: canSubmitTier3Upgrade && !submittingTier3Upgrade ? 1 : 0.5,
            }}
            className="rounded-2xl py-4 items-center shadow-sm active:opacity-90 flex-row justify-center gap-2"
          >
            <Text className="text-white text-sm font-outfit-bold">
              {submittingTier3Upgrade ? "Submitting Tier 3..." : "Complete Tier 3 Verification"}
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
            Complete Your Profile First
          </Text>
          <Text style={{ color: C.textSub }} className="text-xs font-outfit text-center leading-5 px-2 mb-4">
            Complete these profile details before uploading your utility bill or Government-issued ID:
          </Text>
          <View style={{ width: "100%", gap: 8 }}>
            {missingProfileFields.length > 0 ? missingProfileFields.map((field) => (
              <View key={field} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="circle-small" size={20} color={C.bgDark} />
                <Text style={{ color: "#fff", fontFamily: "Outfit", fontSize: 13, flex: 1 }}>
                  {field.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </Text>
              </View>
            )) : (
              <Text style={{ color: C.textSub, fontFamily: "Outfit", fontSize: 12, textAlign: "center" }}>
                Your profile is incomplete. Review and complete the information in Profile Information.
              </Text>
            )}
          </View>
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
        hideshowButton={documentPickerTarget === "utility"}
        title="Proof of Address"
        buttonText={uploadingUtility ? "Submitting..." : "Submit Proof of Address"}
        onConfirm={handleSubmitUtility}
      >
        {documentPickerTarget === "utility" ? renderDocumentSourceChoice() : <View className="py-2">
          <Text style={{ color: C.textSub }} className="text-xs font-outfit mb-3">
            Select the document type and upload a clear copy from your gallery or files (maximum 4 MB).
          </Text>

          {/* Type picker */}
          <Text style={{ color: C.textPrimary }} className="text-xs font-outfit-bold mb-2">Document Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {PROOF_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  if (opt.value !== proofType) {
                    setProofBase64(null);
                    setProofFileName(null);
                  }
                  setProofType(opt.value);
                }}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 6,
                  backgroundColor: C.white,
                  borderColor: proofType === opt.value ? C.bgDark : C.cardBorder,
                  borderWidth: proofType === opt.value ? 1.5 : 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                }}
              >
                <MaterialCommunityIcons name={opt.icon as any} size={14} color={proofType === opt.value ? C.bgDark : C.textSub} />
                <Text style={{ color: proofType === opt.value ? C.bgDark : C.textPrimary, fontSize: 11, fontFamily: proofType === opt.value ? "OutfitBold" : "OutfitMedium" }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* File picker */}
          <TouchableOpacity
            onPress={() => handlePickFile("utility")}
            activeOpacity={0.6}
            disabled={preparingDocument}
            hitSlop={8}
            style={{ borderColor: C.accent, borderWidth: 2, borderStyle: "dashed", borderRadius: 12, backgroundColor: C.white, padding: 20, alignItems: "center" }}
          >
            {preparingDocument && Platform.OS === "ios" ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <MaterialCommunityIcons name={proofFileName ? "file-check-outline" : "file-upload-outline"} size={30} color={proofFileName ? C.green : C.accent} />
            )}
            <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 12, marginTop: 6, textAlign: "center" }}>
              {preparingDocument && Platform.OS === "ios"
                ? "Preparing document…"
                : proofFileName ? `✓ ${proofFileName}` : "Tap to choose from Gallery or Files"}
            </Text>
            {proofFileName && !preparingDocument && (
              <Text style={{ color: C.green, fontSize: 10, fontFamily: "Outfit", marginTop: 2 }}>File ready to upload · tap to change</Text>
            )}
          </TouchableOpacity>
        </View>}
      </BottomSheet>

      {/* GOVERNMENT ID BOTTOM SHEET */}
      <BottomSheet
        visible={govtIdModalVisible}
        onClose={() => setGovtIdModalVisible(false)}
        hideshowButton={documentPickerTarget === "govtid"}
        title="Government-Issued ID"
        buttonText={uploadingGovtId ? "Uploading..." : "Submit Government ID"}
        onConfirm={handleSubmitGovtId}
      >
        {documentPickerTarget === "govtid" ? renderDocumentSourceChoice() : <View className="py-2">
          <Text style={{ color: C.textSub }} className="text-xs font-outfit mb-3">
            Select your ID type, enter the ID number, then upload a clear photo or scan (maximum 4 MB).
          </Text>

          {/* ID type picker */}
          <Text style={{ color: C.textPrimary }} className="text-xs font-outfit-bold mb-2">ID Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {GOVT_ID_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  if (opt.value !== govtIdType) {
                    shouldRefocusIdentificationNumber.current =
                      identificationNumberInputRef.current?.isFocused() ?? false;
                    identificationNumberInputRef.current?.blur();
                    Keyboard.dismiss();
                    setIdentificationNumber("");
                    setGovtIdBase64(null);
                    setGovtIdFileName(null);
                  }
                  setGovtIdType(opt.value);
                }}
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
            ref={identificationNumberInputRef}
            value={identificationNumber}
            onChangeText={(value) => {
              const normalized = isNinId
                ? value.replace(/\D/g, "")
                : value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
              setIdentificationNumber(
                normalized.slice(0, getIdentificationNumberMaxLength(govtIdType)),
              );
            }}
            placeholder={`Enter your ${GOVT_ID_OPTIONS.find(o => o.value === govtIdType)?.label || "ID"} number`}
            placeholderTextColor="#9A9B7A"
            keyboardType={isNinId ? "numeric" : "default"}
            autoCapitalize="characters"
            maxLength={getIdentificationNumberMaxLength(govtIdType)}
            style={{ backgroundColor: "#FAFAF5", borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: C.textPrimary, fontFamily: "Outfit", fontSize: 13, marginBottom: 14 }}
          />

          {/* File picker */}
          <TouchableOpacity
            onPress={() => handlePickFile("govtid")}
            activeOpacity={0.6}
            disabled={preparingDocument}
            hitSlop={8}
            style={{ borderColor: C.accent, borderWidth: 2, borderStyle: "dashed", borderRadius: 12, backgroundColor: C.white, padding: 20, alignItems: "center" }}
          >
            {preparingDocument && Platform.OS === "ios" ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <MaterialCommunityIcons name={govtIdFileName ? "file-check-outline" : "card-account-details-outline"} size={30} color={govtIdFileName ? C.green : C.accent} />
            )}
            <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 12, marginTop: 6, textAlign: "center" }}>
              {preparingDocument && Platform.OS === "ios"
                ? "Preparing document…"
                : govtIdFileName ? `✓ ${govtIdFileName}` : `Upload photo of your ${GOVT_ID_OPTIONS.find(o => o.value === govtIdType)?.label}`}
            </Text>
            {govtIdFileName && !preparingDocument && (
              <Text style={{ color: C.green, fontSize: 10, fontFamily: "Outfit", marginTop: 2 }}>File ready to upload · tap to change</Text>
            )}
          </TouchableOpacity>
        </View>}
      </BottomSheet>

      <Modal
        transparent
        animationType="fade"
        visible={(preparingDocument && Platform.OS !== "ios") || uploadingUtility || uploadingGovtId}
        onRequestClose={() => { }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: C.white, borderRadius: 16, padding: 24, alignItems: "center", minWidth: 180 }}>
            <ActivityIndicator size="large" color={C.bgDark} />
            <Text style={{ color: C.textPrimary, fontFamily: "OutfitMedium", fontSize: 14, marginTop: 14 }}>
              {preparingDocument ? "Preparing document…" : "Uploading document…"}
            </Text>
          </View>
        </View>
      </Modal>

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
