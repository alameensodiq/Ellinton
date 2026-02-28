import React, { useState } from "react";
import { View, StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import Loading from "@/app/components/Loading";
import ErrorModal from "@/app/components/ErrorModal";

import { confirmLoanConsent } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";

const RepaymentSchedule = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<Record<string, string>>();

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [error, setError] = useState<string>("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const loanId = params.loanId ? String(params.loanId) : "";
  const amount = params.amount ? String(params.amount) : "0";

  const onAccept = () => {
    if (!loanId) {
      setError("Missing loanId.");
      setShowErrorModal(true);
      return;
    }

    if (confirming) return;

    setConfirming(true);
    setError("");
    setShowErrorModal(false);

    dispatch(confirmLoanConsent(loanId))
      .unwrap()
      .then(() => {
        setConfirmed(true);

        router.replace({
          pathname: "/(root)/loans/success",
          params: { amount },
        });
      })
      .catch((err) => {
        setConfirmed(false);

        const msg =
          err?.message ||
          err?.payload ||
          "Consent confirmation failed. Please try again.";

        setError(msg);
        setShowErrorModal(true);
      })
      .finally(() => setConfirming(false));
  };

  const onDecline = () => router.replace("/(root)/(tabs)");
  const onDismissError = () => {
    setShowErrorModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Recover consent" />

      <Loading visible={confirming} />

      <ErrorModal
        visible={showErrorModal}
        title="Consent confirmation failed"
        message={error || "Please try again."}
        onDismiss={onDismissError}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-5">
          {confirmed && (
            <View className="mb-4">
              <CustomText weight="bold" className="text-white mb-2">
                Consent confirmed ✅
              </CustomText>
              <CustomText secondary className="leading-5">
                Your loan consent has been confirmed successfully.
              </CustomText>
            </View>
          )}

          <View className="mb-4">
            <CustomText secondary weight="bold" className="mb-2">
              YOUR DATA IS PROTECTED
            </CustomText>
            <CustomText secondary className="leading-5">
              All our banking and investment procedures happen through encrypted
              technology and robust firewalls that ensure the protection of your
              data.
            </CustomText>
          </View>

          <View className="mb-4">
            <CustomText secondary weight="bold" className="mb-2">
              YOUR RIGHTS ARE SERVED
            </CustomText>
            <CustomText secondary className="leading-5">
              We ensure that you are enjoying all the personal and financial
              rights in banking regarding the service you prefer.
            </CustomText>
          </View>

          <View className="mb-4">
            <CustomText secondary weight="bold" className="mb-2">
              YOU WILL BE INFORMED
            </CustomText>
            <CustomText secondary className="leading-5">
              You will be updated on every transaction within your account,
              along with trends, offers, and promotions. Real-time alerts on
              security and policy changes will be sent to you.
            </CustomText>
          </View>

          <View className="mb-4">
            <CustomText secondary weight="bold" className="mb-2">
              THE CONTROLS IN YOUR HANDS
            </CustomText>
            <CustomText secondary className="leading-5">
              Complete control of your banking will be in your hands while we
              make it easier for you. Timely notifications on every action
              happening will be sent to you, and you can use multiple platforms
              to manage the account.
            </CustomText>
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <Button
          title={confirming ? "Confirming..." : "Accept"}
          onPress={onAccept}
          variant="primary"
        />
        <View className="mt-3">
          <Button title="Decline" onPress={onDecline} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RepaymentSchedule;
