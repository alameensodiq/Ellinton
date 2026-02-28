import React, { useCallback, useState } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import Loading from "@/app/components/Loading";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { confirmLoanConsent } from "@/app/lib/thunks/loansThunks";

export default function RecoverConsentScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { loanId, approvalUrl, confirmationUrl, amount } =
    useLocalSearchParams<{
      loanId?: string;
      approvalUrl?: string;
      confirmationUrl?: string;
      amount?: string;
    }>();

  const loanIdStr = Array.isArray(loanId) ? loanId[0] : loanId;
  const approvalUrlStr = Array.isArray(approvalUrl)
    ? approvalUrl[0]
    : approvalUrl;
  const confirmationUrlStr = Array.isArray(confirmationUrl)
    ? confirmationUrl[0]
    : confirmationUrl;

  const amountStr = Array.isArray(amount) ? amount[0] : amount;

  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const shouldConfirmFromUrl = useCallback(
    (url: string) => {
      if (!url) return false;

      // best: match the exact confirmation URL your API gave you
      if (confirmationUrlStr && url.startsWith(confirmationUrlStr)) return true;

      // fallback: match a known path if the URL has extra params
      if (url.includes("/consent/confirm")) return true;

      return false;
    },
    [confirmationUrlStr]
  );

  const runConfirm = useCallback(async () => {
    if (confirming || done) return;

    if (!loanIdStr) {
      setErr("Missing loan id.");
      return;
    }

    setErr("");
    setConfirming(true);

    try {
      await dispatch(confirmLoanConsent(loanIdStr) as any).unwrap();
      setDone(true);

      router.replace({
        pathname: "/(root)/loans/success",
        params: { amount: amountStr || "0" },
      });
    } catch (e: any) {
      setErr(
        typeof e === "string" ? e : e?.message || "Consent confirmation failed"
      );
    } finally {
      setConfirming(false);
    }
  }, [confirming, done, loanIdStr, dispatch, router, amountStr]);

  if (!approvalUrlStr) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100">
        <StatusBar barStyle="light-content" />
        <Header title="Recover consent" />
        <View className="flex-1 px-5 justify-center">
          <CustomText className="text-red-400 mb-4">
            Missing approval link.
          </CustomText>
          <Button
            title="Go back"
            variant="primary"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Recover consent" />

      <Loading visible={confirming} />

      {!!err && (
        <View className="px-5 pt-3">
          <CustomText size="sm" className="text-red-400">
            {err}
          </CustomText>
          <View className="mt-3">
            <Button
              title="Try confirm again"
              variant="primary"
              onPress={runConfirm}
            />
          </View>
        </View>
      )}

      <View className="flex-1">
        <WebView
          source={{ uri: approvalUrlStr }}
          originWhitelist={["*"]}
          startInLoadingState
          onNavigationStateChange={(nav) => {
            const url = nav.url || "";
            if (shouldConfirmFromUrl(url)) runConfirm();
          }}
          onError={() => setErr("Could not load consent page.")}
        />
      </View>

      <View className="px-5 pb-6">
        <Button
          title="Cancel"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}
