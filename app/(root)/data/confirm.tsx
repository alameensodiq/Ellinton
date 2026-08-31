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
  const v = value.toLowerCase();

  if (v.includes("mtn")) return "MTN_VTU";
  if (v.includes("airtel")) return "AIRTEL_VTU";
  if (v.includes("glo")) return "GLO_VTU";
  if (v.includes("9mobile")) return "9MOBILE_VTU";

  return value;
};

export default function ConfirmBuyData() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    provider,
    phone,
    amount,
    productName,
    billerSlug,
    bundle,
    validatedName,
  } = params;

  const rawAmount = Array.isArray(amount) ? amount[0] : amount ?? "0";
  const phoneStr = Array.isArray(phone) ? phone[0] : phone ?? "";
  const providerStr = Array.isArray(provider) ? provider[0] : provider ?? "";
  const billerSlugStr = Array.isArray(billerSlug) ? billerSlug[0] : billerSlug ?? "";
  const validatedNameStr = Array.isArray(validatedName)
    ? validatedName[0]
    : validatedName || "";

  const numericAmount = Number(rawAmount);
  const fee = 0;
  const totalDebit = numericAmount + fee;

  const providerIcon = icons[providerStr as keyof typeof icons];

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
              pathname: "/(root)/data/authorize",
              params: {
                amount: rawAmount,
                phone: phoneStr,
                provider: providerStr,
                productName,
                billerSlug,
                bundle,
                validatedName: validatedNameStr,
                scheduleEnabled: scheduleEnabled.toString(),
                scheduleName,
                frequency,
                dayOfWeek,
                startDate,
                endDate,
              },
            });
            return;
          }

          const payload = {
            type: "data",
            provider: normalizeAirtimeProvider(providerStr),
            amount: numericAmount,
            bundleSlug: billerSlugStr,
            customerId: phoneStr,
            transactionPin: storedPin,
          };

          try {
            const result = await dispatch(payBill(payload)).unwrap();
            dispatch(clearError());

            router.replace({
              pathname: "/(root)/data/success",
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
      pathname: "/(root)/data/authorize",
      params: {
        amount: rawAmount,
        phone: phoneStr,
        provider: providerStr,
        productName,
        billerSlug,
        bundle,
        validatedName: validatedNameStr,
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
          description={`${productName || "Data bundle"}`}
        />

        <PaymentInfoCard
          provider={providerStr}
          phone={phoneStr}
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
