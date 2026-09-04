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
import {
  dayOptions,
  frequencyOptions,
  eventServiceItems,
} from "@/app/lib/utils";
import Button from "@/app/components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
const TRANS_PIN_KEY = "transBiometricPin";

export default function ConfirmGeneralPayment() {
  const { serviceType, service, product, email, amount } =
    useLocalSearchParams();
  const router = useRouter();
  const rawAmount = Array.isArray(amount)
    ? amount[0]
    : amount?.toString() || "0";

  const cleanedAmountString = rawAmount.replace(/[₦,\s]/g, "");
  const normalizedAmount = Number(cleanedAmountString);
  const finalAmount = isNaN(normalizedAmount) ? 0 : normalizedAmount;

  // Find the selected service item for label and icon
  const selectedServiceItem = eventServiceItems.find(
    (item) => item.value === (service as string)
  );
  const serviceLabel = selectedServiceItem?.label || "Unknown Service";
  const providerIcon = selectedServiceItem?.icon;

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

  const navigateToAuthorize = () => {
    router.push({
      pathname: "/(root)/other-bills/authorize",
      params: {
        amount: rawAmount,
        description: "Seventy five thousand naira",
        service,
      },
    });
  };

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

      // If biometric is NOT enabled, go straight to authorize (PIN entry)
      if (!isBiometricEnabled || !storedPin || storedPin.length !== 4) {
        setLoading(false);
        navigateToAuthorize();
        return;
      }

      // Biometric IS enabled — check hardware support
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setLoading(false);
        navigateToAuthorize();
        return;
      }

      // Trigger biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to complete payment",
        cancelLabel: "Use PIN",
        disableDeviceFallback: true,
      });

      if (!authResult.success) {
        // Biometric cancelled/failed — fall back to authorize (PIN entry)
        setLoading(false);
        navigateToAuthorize();
        return;
      }

      // Biometric succeeded — skip authorize, go straight to success
      router.replace({
        pathname: "/(root)/other-bills/success",
        params: {
          amount: rawAmount,
          description: "Seventy five thousand naira",
          service,
          status: "success",
        },
      });
    } catch (err: any) {
      console.log("Biometric payment process error:", err);
      setError(
        err?.message || "An error occurred during biometric authentication"
      );
      Vibration.vibrate(400);
    } finally {
      setLoading(false);
    }
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
          description="Seventy five thousand naira"
        />

        <PaymentInfoCard
          provider={serviceLabel}
          phone={Array.isArray(email) ? email[0] : email || ""}
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
