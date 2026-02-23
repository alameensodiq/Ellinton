import { Stack, useRouter, useSegments } from "expo-router";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { AppDispatch, RootState } from "../lib/store";
import { useAppSelector } from "../lib/hooks/useAppSelector";
import { restoreAuth } from "../lib/thunks/authThunks";

export default function AuthWrapper() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    isAuthenticated,
    isRestoring,
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
    const isOnLogin = segments.join("/") === "(auth)/login";

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
          error.toLowerCase().includes("invalid token"))
    );

    if (hasSessionError && !inAuthGroup && !isOnLogin) {
      router.replace("/(auth)/login");
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
    user,
  ]);

  if (!ready) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
