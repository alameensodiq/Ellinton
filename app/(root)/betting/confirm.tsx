import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, ActivityIndicator, Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

import Header from "@/app/components/header-back";
import AmountCard from "@/app/components/home/cards/AmountCard";
import PaymentInfoCard from "@/app/components/home/biils/PaymentInfoCard";
import TransferSummaryCard from "@/app/components/TransferSummaryCard";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import ScheduleTransaction from "@/app/components/ScheduleTransaction";
import Button from "@/app/components/Button";

import {
  dayOptions,
  frequencyOptions,
  utilityserviceItems,
} from "@/app/lib/utils";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { payBill } from "@/app/lib/thunks/billsThunks";
import { clearError } from "@/app/lib/slices/billsSlice";

const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
const TRANS_PIN_KEY = "transBiometricPin";

export default function ConfirmBuyAirtime() {
  const { service, product, meterNumber, amount, providerName } =
    useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const rawAmount = Array.isArray(amount)
    ? amount[0]
    : amount?.toString() || "0";
  const cleanedAmountString = rawAmount.replace(/[₦,\s]/g, "");
  const finalAmount = Number(cleanedAmountString) || 0;

  const safeProviderName = Array.isArray(providerName)
    ? providerName[0]
    : providerName || "";

  const selectedServiceItem = utilityserviceItems.find(
    (item) => item.value === service
  );
  const serviceLabel =
    safeProviderName || selectedServiceItem?.label || "Unknown Service";
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
              pathname: "/(root)/betting/authorize",
              params: {
                service,
                product,
                meterNumber,
                amount: rawAmount,
                fee,
                totalDebit,
                scheduleName,
                frequency,
                dayOfWeek,
                startDate,
                endDate,
              },
            });
            return;
          }

          const serviceStr = Array.isArray(service) ? service[0] : service || "";
          const productStr = Array.isArray(product) ? product[0] : product || "";
          const meterStr = Array.isArray(meterNumber) ? meterNumber[0] : meterNumber || "";

          const payload = {
            type: "betting",
            provider: serviceStr,
            amount: finalAmount,
            bundleSlug: productStr,
            customerId: meterStr,
            transactionPin: storedPin,
          };

          try {
            const result = await dispatch(payBill(payload)).unwrap();
            dispatch(clearError());

            router.replace({
              pathname: "/(root)/betting/success",
              params: {
                service,
                product,
                meterNumber,
                amount: rawAmount,
                fee,
                totalDebit,
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
      pathname: "/(root)/betting/authorize",
      params: {
        service,
        product,
        meterNumber,
        amount: rawAmount,
        fee,
        totalDebit,
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
          description={`Payment for ${serviceLabel}`}
        />

        <PaymentInfoCard
          provider={serviceLabel}
          phone={
            Array.isArray(meterNumber) ? meterNumber[0] : meterNumber || ""
          }
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
