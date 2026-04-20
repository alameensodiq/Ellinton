import { Stack, useRouter, useSegments } from "expo-router";
import { useDispatch } from "react-redux";
import { useEffect, useState, useCallback } from "react";
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

  // Function to refresh stored data
  const refreshStoredData = useCallback(async () => {
    try {
      const dataStr = await AsyncStorage.getItem("data");
      console.log("🔄 Refreshing stored data:", dataStr);
      if (dataStr) {
        const parsedData = JSON.parse(dataStr);
        setStoredData(parsedData);
        console.log("📦 Refreshed persisted data:", {
          mfa_required: parsedData?.mfa_required,
          requires_mfa: parsedData?.requires_mfa,
          device_authentication_required: parsedData?.device_authentication_required,
          requires_device_verification: parsedData?.requires_device_verification
        });
        return parsedData;
      }
    } catch (error) {
      console.error("Failed to refresh stored data:", error);
    }
    return null;
  }, []);

  // Load the persisted data from AsyncStorage (initial load)
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const dataStr = await AsyncStorage.getItem("data");
        console.log("📦 Initial data load:", dataStr);
        if (dataStr) {
          const parsedData = JSON.parse(dataStr);
          setStoredData(parsedData);
          console.log("📦 Loaded persisted data:", {
            mfa_required: parsedData?.mfa_required,
            requires_mfa: parsedData?.requires_mfa,
            device_authentication_required: parsedData?.device_authentication_required,
            requires_device_verification: parsedData?.requires_device_verification
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

  // Refresh stored data whenever segments change (navigation occurs)
  useEffect(() => {
    if (ready) {
      refreshStoredData();
    }
  }, [segments, ready, refreshStoredData]);

  // Main navigation effect with refresh flag for auth screens
  useEffect(() => {
    if (!ready) return;

    const checkAndNavigate = async () => {
      // ALWAYS refresh data when on current-user or login screens
      const isOnAuthScreen = segments.join("/") === "(auth)/current-user" || 
                            segments.join("/") === "(auth)/login";
      
      let currentStoredData = storedData;
      if (isOnAuthScreen) {
        console.log("🔄 On auth screen, refreshing data...");
        const freshData = await refreshStoredData();
        currentStoredData = freshData || storedData;
      }
      
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

      // Check for MFA requirement from current stored data
      const requiresMFA = currentStoredData?.mfa_required || currentStoredData?.requires_mfa;
      const requiresDeviceVerification =
        currentStoredData?.device_authentication_required ||
        currentStoredData?.requires_device_verification;

      const effectiveToken =
        currentStoredData?.access_token || currentStoredData?.token || authToken;
      
      console.log("🔍 Navigation check - requiresMFA:", requiresMFA);
      console.log("🔍 Navigation check - requiresDeviceVerification:", requiresDeviceVerification);
      console.log("🔍 Navigation check - effectiveToken:", effectiveToken ? "Present" : "Missing");

      if (isAuthenticated && (isOnLogin || isOnCurrentUser)) {
        if (requiresMFA && !isOnMultiFactorOtp) {
          console.log("🔐 MFA required, redirecting to multifactorotp");
          router.replace("/(auth)/multifactorotp");
          return;
        }

        // Then check Device Authentication requirement
        if (requiresDeviceVerification && !isOnDeviceOtp) {
          console.log("📱 Device authentication required, redirecting to deviceotp");
          const tokenToPass = effectiveToken ? String(effectiveToken) : "";
          router.replace({
            pathname: "/(auth)/deviceotp",
            params: {
              token: tokenToPass,
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
    };
    
    checkAndNavigate();
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
    authToken,
    router,
    refreshStoredData
  ]);

  if (!ready || isLoadingData) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}