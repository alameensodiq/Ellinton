import { Stack, useRouter, useSegments } from "expo-router";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { AppDispatch, RootState } from "../lib/store";
import { useAppSelector } from "../lib/hooks/useAppSelector";
import { restoreAuth } from "../lib/thunks/authThunks";
import { usePreventScreenCapture } from "expo-screen-capture";

export default function AuthWrapper() {
  const dispatch = useDispatch<AppDispatch>();
    

  const {
    isAuthenticated,
    isRestoring,
    requiresPasscodeSetup,
    requiresTransactionPinSetup,
    error: authError,
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

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isRestoring) {
      setReady(true);
    }
  }, [isRestoring]);

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inRootGroup = segments[0] === "(root)";
    const isOnLogin = segments.join("/") === "(auth)/login";
    const isOnCurrentUser = segments.join("/") === "(auth)/current-user";

    const errors = [
      authError,
      beneficiariesError,
      accountError,
      billsError,
      cardError,
      kycError,
      transferError,
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

    if (isAuthenticated && (isOnLogin || isOnCurrentUser)) {
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
          params: { userId: user.id, source: "login" },
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

    if (hasSessionError && !inAuthGroup && !isOnLogin && !isOnCurrentUser) {
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
  ]);

  if (!ready) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
