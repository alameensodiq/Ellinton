import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import icons from "@/app/assets/icons/icons";
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

const normalizeAirtimeProvider = (value: string) => {
  const v = value.toLowerCase().trim();

  if (v.includes("mtn")) return "MTN_VTU";
  if (v.includes("airtel")) return "AIRTEL_VTU";
  if (v.includes("glo")) return "GLO_VTU";
  if (v.includes("9mobile") || v.includes("etisalat")) return "9MOBILE_VTU";

  return value;
};

export default function ConfirmBuyAirtime() {
  const { provider, phone, amount } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const rawAmount = Array.isArray(amount)
    ? amount[0]
    : amount?.toString() || "0";

  const cleanedAmountString = rawAmount.replace(/[₦,\s]/g, "");
  const normalizedAmount = Number(cleanedAmountString);
  const finalAmount = isNaN(normalizedAmount) ? 0 : normalizedAmount;

  const fee = 0;
  const totalDebit = finalAmount + fee;

  const providerIcon = icons[provider as keyof typeof icons];

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
            router.push({
              pathname: "/(root)/airtime/authorize",
              params: {
                provider: provider?.toString() || "",
                phone: Array.isArray(phone) ? phone[0] : phone || "",
                amount: finalAmount.toString(),
                fee: fee.toString(),
                totalDebit: totalDebit.toString(),
                scheduleEnabled: scheduleEnabled ? "true" : "false",
                scheduleName,
                frequency,
                dayOfWeek,
                startDate,
                endDate,
              },
            });
            return;
          }

          const providerStr = provider?.toString() || "";
          const phoneStr = Array.isArray(phone) ? phone[0] : phone || "";
          const payload = {
            type: "airtime",
            provider: normalizeAirtimeProvider(providerStr),
            amount: finalAmount,
            bundleSlug: normalizeAirtimeProvider(providerStr),
            customerId: phoneStr,
            transactionPin: storedPin,
          };

          try {
            const result = await dispatch(payBill(payload)).unwrap();
            dispatch(clearError());

            router.replace({
              pathname: "/(root)/airtime/success",
              params: {
                provider: providerStr,
                phone: phoneStr,
                amount: finalAmount.toString(),
                fee: fee.toString(),
                totalDebit: totalDebit.toString(),
                reference: result?.reference,
                status: "success",
              },
            });
            setLoading(false);
            return;
          } catch (err: any) {
            setError(
              err?.message ||
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
      pathname: "/(root)/airtime/authorize",
      params: {
        provider: provider?.toString() || "",
        phone: Array.isArray(phone) ? phone[0] : phone || "",
        amount: finalAmount.toString(),
        fee: fee.toString(),
        totalDebit: totalDebit.toString(),

        scheduleEnabled: scheduleEnabled ? "true" : "false",
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
        <AmountCard amount={rawAmount} description="" />

        <PaymentInfoCard
          provider={provider?.toString() || ""}
          phone={Array.isArray(phone) ? phone[0] : phone || ""}
          icon={providerIcon}
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

        {loading ? (
          <ActivityIndicator size="large" color="#fff" className="my-4" />
        ) : (
          <Button title="Pay" variant="primary" onPress={handleContinue} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
