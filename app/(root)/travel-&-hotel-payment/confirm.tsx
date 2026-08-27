import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { svgIcons } from "@/app/assets/icons/icons";
import Header from "@/app/components/header-back";
import AmountCard from "@/app/components/home/cards/AmountCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, ActivityIndicator, Vibration } from "react-native";
import PaymentInfoCard from "@/app/components/home/biils/PaymentInfoCard";
import TransferSummaryCard from "@/app/components/TransferSummaryCard";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import ScheduleTransaction from "@/app/components/ScheduleTransaction";
import { dayOptions, frequencyOptions } from "@/app/lib/utils";
import Button from "@/app/components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { payBill } from "@/app/lib/thunks/billsThunks";
import { clearError } from "@/app/lib/slices/billsSlice";

const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
const TRANS_PIN_KEY = "transBiometricPin";

export default function ConfirmTravelPayment() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    accountId,
    amount,
    providerId,
    providerName,
    providerSlug,
    packageId,
    packageName,
    packageAmount,
    packageSlug,
  } = params;

  const rawAmount = Array.isArray(amount)
    ? amount[0]
    : amount?.toString() || "0";
  const cleanedAmountString = rawAmount.replace(/[₦,\s]/g, "");
  const normalizedAmount = Number(cleanedAmountString);
  const finalAmount = isNaN(normalizedAmount) ? 0 : normalizedAmount;

  const serviceLabel = Array.isArray(providerName)
    ? providerName[0]
    : providerName || "Unknown Service";

  const accountIdStr = Array.isArray(accountId)
    ? accountId[0]
    : accountId || "";
  const providerSlugStr = Array.isArray(providerSlug)
    ? providerSlug[0]
    : providerSlug || "";
  const packageSlugStr = Array.isArray(packageSlug)
    ? packageSlug[0]
    : packageSlug || "";

  const fee = 0;
  const totalDebit = finalAmount + fee;

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);
    setLoading(true);

    try {
      const storedBiometric = await AsyncStorage.getItem(TRANS_BIOMETRIC_KEY);
      const storedPin = await AsyncStorage.getItem(TRANS_PIN_KEY);

      let isBiometricEnabled = false;
      if (storedBiometric) {
        try {
          isBiometricEnabled = JSON.parse(storedBiometric) === true;
        } catch {
          isBiometricEnabled = storedBiometric === "true";
        }
      }

      if (isBiometricEnabled && storedPin && storedPin.length === 4) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: "Authenticate to complete payment",
            cancelLabel: "Use PIN",
            disableDeviceFallback: true,
          });

          if (!authResult.success) {
            setLoading(false);
            return;
          }

          const payload = {
            type: "cable",
            provider: providerSlugStr,
            amount: Number(rawAmount),
            bundleSlug: packageSlugStr,
            customerId: accountIdStr,
            transactionPin: storedPin,
          };

          try {
            const result = await dispatch(payBill(payload)).unwrap();
            dispatch(clearError());

            router.replace({
              pathname: "/(root)/travel-&-hotel-payment/success",
              params: {
                ...params,
                reference: result?.reference,
                status: "success",
              },
            });
            setLoading(false);
            return;
          } catch (err: any) {
            setError(
              err?.message ||
                (typeof err === "string" ? err : null) ||
                "Service not available at this time, please try again later"
            );
            Vibration.vibrate(400);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err: any) {
      console.log("Biometric payment process error:", err);
      setError(
        err?.message || "An error occurred during biometric authentication"
      );
      setLoading(false);
      return;
    }

    setLoading(false);

    router.push({
      pathname: "/(root)/travel-&-hotel-payment/authorize",
      params: {
        amount: rawAmount,
        accountId: accountIdStr,
        providerId,
        providerName,
        providerSlug,
        packageId,
        packageSlug,
        packageName,
        packageAmount,
        scheduleEnabled: scheduleEnabled.toString(),
        scheduleName,
        frequency,
        dayOfWeek,
        startDate,
        endDate,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Confirm payment" showClose />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingTop: 24 }}
      >
        <AmountCard
          amount={rawAmount}
          description={`Payment to ${serviceLabel}`}
        />

        <PaymentInfoCard
          provider={serviceLabel}
          phone={accountIdStr}
          icon={svgIcons.chip}
        />

        <TransferSummaryCard
          amount={rawAmount}
          fee={fee}
          totalDebit={totalDebit}
        />

        <SenderCard />

        <ScheduleTransaction
          scheduleEnabled={scheduleEnabled}
          setScheduleEnabled={setScheduleEnabled}
          scheduleName={scheduleName}
          setScheduleName={setScheduleName}
          frequency={frequency}
          setFrequency={setFrequency}
          dayOfWeek={dayOfWeek}
          setDayOfWeek={setDayOfWeek}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          frequencyOptions={frequencyOptions}
          dayOptions={dayOptions}
        />

        {error && (
          <Text className="text-red-500 text-sm mb-4 text-center">
            {error}
          </Text>
        )}

        <View className="mt-4">
          {loading ? (
            <ActivityIndicator size="large" color="#fff" className="my-4" />
          ) : (
            <Button title="Pay" variant="primary" onPress={handleContinue} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
