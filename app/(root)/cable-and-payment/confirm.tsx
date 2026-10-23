import React, { useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, Vibration } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import ErrorModal from "@/app/components/ErrorModal";
import AmountCard from "@/app/components/home/cards/AmountCard";
import PaymentInfoCard from "@/app/components/home/biils/PaymentInfoCard";
import TransferSummaryCard from "@/app/components/TransferSummaryCard";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import ScheduleTransaction from "@/app/components/ScheduleTransaction";
import { dayOptions, frequencyOptions } from "@/app/lib/utils";

import { svgIcons } from "@/app/assets/icons/icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { payBill } from "@/app/lib/thunks/billsThunks";

const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
const TRANS_PIN_KEY = "transBiometricPin";

export default function ConfirmCablePayment() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    accountId,
    amount,
    service,
    providerId,
    providerName,
    providerSlug,
    packageId,
    packageName,
    packageSlug,
    customerFirstName,
    customerLastName,
    customerName,
  } = params;

  const rawAmount = Array.isArray(amount)
    ? amount[0]
    : amount?.toString() || "0";
  const serviceLabel = Array.isArray(providerName)
    ? providerName[0]
    : providerName || "Unknown Service";
  const accountIdStr = Array.isArray(accountId)
    ? accountId[0]
    : accountId || "";
  const packageNameStr = Array.isArray(packageName)
    ? packageName[0]
    : packageName || "";
  const providerSlugStr = Array.isArray(providerSlug)
    ? providerSlug[0]
    : providerSlug || "";
  const packageSlugStr = Array.isArray(packageSlug)
    ? packageSlug[0]
    : packageSlug || "";
  const customerFirstNameStr = Array.isArray(customerFirstName)
    ? customerFirstName[0]
    : customerFirstName || "";
  const customerLastNameStr = Array.isArray(customerLastName)
    ? customerLastName[0]
    : customerLastName || "";
  const customerNameStr = Array.isArray(customerName)
    ? customerName[0]
    : customerName || "";

  const fee = 0;
  const totalDebit = Number(rawAmount) + fee;

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const isScheduleIncomplete =
    scheduleEnabled &&
    (!scheduleName.trim() ||
      !frequency ||
      !startDate ||
      !endDate ||
      (frequency.toLowerCase() === "weekly" && !dayOfWeek));

  const navigateToAuthorize = () => {
    router.push({
      pathname: "/(root)/cable-and-payment/authorize",
      params: {
        amount: rawAmount,
        accountId: accountIdStr,
        providerId,
        providerName,
        providerSlug,
        packageId,
        packageName: packageNameStr,
        packageSlug,
        scheduleEnabled: scheduleEnabled.toString(),
        scheduleName,
        frequency,
        dayOfWeek,
        startDate,
        endDate,
      },
    });
  };

  const handleContinue = async () => {
    if (isScheduleIncomplete) {
      setShowScheduleModal(true);
      return;
    }

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

      // Biometric succeeded — call API directly, skip authorize
      const payload = {
        type: "cable",
        provider: providerSlugStr,
        amount: Number(rawAmount),
        bundleSlug: packageSlugStr,
        customerId: accountIdStr,
        transactionPin: storedPin,
        ...(scheduleEnabled && {
          isScheduled: true,
          scheduleName,
          scheduleType: frequency,
          ...(dayOfWeek && { dayOfWeek }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        }),
      };

      const result = await dispatch(payBill(payload)).unwrap();

      router.replace({
        pathname: "/(root)/cable-and-payment/success",
        params: {
          ...params,
          reference: result?.reference,
          status: "success",
        },
      });
    } catch (err: any) {
      console.log("Biometric payment process error:", err);
      setError(
        err?.message ||
        (typeof err === "string" ? err : null) ||
        "Service not available at this time, please try again later"
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
        contentContainerStyle={{ padding: 16, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
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

        <View className="mb-4 rounded-xl bg-primary-400 p-4">
          <Text className="mb-3 text-base font-bold text-white">
            Confirm customer details
          </Text>
          <View className="flex-row items-center justify-between border-b border-primary-300 py-2">
            <Text className="text-xs text-accent-200">Customer Name</Text>
            <Text className="text-sm font-semibold text-white">
              {customerNameStr || "Not provided"}
            </Text>
          </View>
          <View className="flex-row items-center justify-between border-b border-primary-300 py-2">
            <Text className="text-xs text-accent-200">First Name</Text>
            <Text className="text-sm font-semibold text-white">
              {customerFirstNameStr || "Not provided"}
            </Text>
          </View>
          <View className="flex-row items-center justify-between pt-2">
            <Text className="text-xs text-accent-200">Last Name</Text>
            <Text className="text-sm font-semibold text-white">
              {customerLastNameStr || "Not provided"}
            </Text>
          </View>
        </View>

        <TransferSummaryCard
          amount={rawAmount}
          fee={fee}
          totalDebit={totalDebit}
        />

        <SenderCard />

        {/* <ScheduleTransaction
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
        /> */}

        {error && (
          <Text className="text-red-500 text-sm mb-4 text-center">
            {error}
          </Text>
        )}

        <View className="mt-4">
          {loading ? (
            <ActivityIndicator size="large" color="#fff" className="my-4" />
          ) : (
            <Button
              title="Pay"
              variant="primary"
              onPress={handleContinue}
              disabled={isScheduleIncomplete}
              className={isScheduleIncomplete ? "opacity-50" : ""}
            />
          )}
        </View>
      </ScrollView>

      <ErrorModal
        visible={showScheduleModal}
        title="Incomplete Schedule"
        message="Please fill all required schedule details before proceeding."
        buttonText="OK"
        onDismiss={() => setShowScheduleModal(false)}
      />
    </SafeAreaView>
  );
}
