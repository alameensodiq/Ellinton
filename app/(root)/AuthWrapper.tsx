import { Stack, useRouter, useSegments } from "expo-router";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { AppDispatch, RootState } from "../lib/store";
import { useAppSelector } from "../lib/hooks/useAppSelector";
import { restoreAuth } from "../lib/thunks/authThunks";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthWrapper() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    isAuthenticated,
    isRestoring,
    requiresPasscodeSetup,
    requiresTransactionPinSetup,
    error: authError,
    token: authToken
  } = useAppSelector((state: RootState) => state.auth);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const { error: beneficiariesError } = useAppSelector(
    (state) => state.beneficiaries
  );
  const { error: accountError } = useAppSelector((state) => state.accounts);
  const { error: billsError } = useAppSelector((state) => state.bills);
  const { error: cardError } = useAppSelector((state) => state.cards);
  const { error: kycError } = useAppSelector((state) => state.kyc);
  const { error: transferError } = useAppSelector((state) => state.transfers);

  const [ready, setReady] = useState(false);
  const [storedData, setStoredData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  // Load the persisted data from AsyncStorage
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const dataStr = await AsyncStorage.getItem("data");
        if (dataStr) {
          const parsedData = JSON.parse(dataStr);
          setStoredData(parsedData);
          console.log("📦 Loaded persisted data:", {
            mfa_required: parsedData?.mfa_required,
            requires_mfa: parsedData?.requires_mfa,
            device_authentication_required:
              parsedData?.device_authentication_required,
            requires_device_verification:
              parsedData?.requires_device_verification
          });
        } else {
          console.log("📦 No persisted data found");
        }
      } catch (error) {
        console.error("Failed to load stored data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadStoredData();
  }, []);

  useEffect(() => {
    if (!isRestoring && !isLoadingData) {
      setReady(true);
    }
  }, [isRestoring, isLoadingData]);

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inRootGroup = segments[0] === "(root)";
    const isOnLogin = segments.join("/") === "(auth)/login";
    const isOnCurrentUser = segments.join("/") === "(auth)/current-user";
    const isOnMultiFactorOtp = segments.join("/") === "(auth)/multifactorotp";
    const isOnDeviceOtp = segments.join("/") === "(auth)/deviceotp";

    const errors = [
      authError,
      beneficiariesError,
      accountError,
      billsError,
      cardError,
      kycError,
      transferError
    ];

    const hasSessionError = errors.some(
      (error) =>
        typeof error === "string" &&
        (error.toLowerCase().includes("session") ||
          error.toLowerCase().includes("invalid token") ||
          error.toLowerCase().includes("token expired") ||
          error.toLowerCase().includes("unauthorized") ||
          error.toLowerCase().includes("401"))
    );

    // Check for MFA requirement from stored data
    const requiresMFA = storedData?.mfa_required || storedData?.requires_mfa;
    const requiresDeviceVerification =
      storedData?.device_authentication_required ||
      storedData?.requires_device_verification;

    const effectiveToken =
      storedData?.access_token || storedData?.token || authToken;

    if (isAuthenticated && (isOnLogin || isOnCurrentUser)) {
      // Handle MFA requirement first - no params needed
      if (requiresMFA && !isOnMultiFactorOtp) {
        console.log("🔐 MFA required, redirecting to multifactorotp");
        router.replace("/(auth)/multifactorotp");
        return;
      }
      // Handle Device Authentication requirement - no params needed
      if (requiresDeviceVerification && !isOnDeviceOtp) {
        console.log(
          "📱 Device authentication required, redirecting to deviceotp"
        );
        router.replace({
          pathname: "/(auth)/deviceotp",
          params: {
            paramToken: effectiveToken,
            source: "login"
          }
        });
        return;
      }

      // Normal flow based on user status
      if (user?.status === "otp_verified") {
        router.replace("/(auth)/profile-update");
        return;
      }

      if (user?.status === "bvn_verified") {
        router.replace("/(auth)/facial-verification");
        return;
      }

      if (requiresPasscodeSetup) {
        router.replace("/(auth)/create-passcode");
        return;
      }

      if (requiresTransactionPinSetup && user?.id) {
        router.replace({
          pathname: "/(auth)/transacion-pin",
          params: { userId: user.id, source: "login" }
        });
        return;
      }

      router.replace("/(root)/(tabs)");
      return;
    }

    if (!isAuthenticated && inRootGroup) {
      router.replace(user ? "/(auth)/current-user" : "/(auth)/login");
      return;
    }

    if (
      hasSessionError &&
      !inAuthGroup &&
      !isOnLogin &&
      !isOnCurrentUser &&
      !isOnMultiFactorOtp &&
      !isOnDeviceOtp
    ) {
      router.replace(user ? "/(auth)/current-user" : "/(auth)/login");
    }
  }, [
    ready,
    segments,
    authError,
    beneficiariesError,
    accountError,
    billsError,
    cardError,
    kycError,
    transferError,
    isAuthenticated,
    requiresPasscodeSetup,
    requiresTransactionPinSetup,
    user,
    storedData,
    authToken
  ]);

  if (!ready || isLoadingData) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
