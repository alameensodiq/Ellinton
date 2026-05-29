import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";

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
  utilityserviceItems
} from "@/app/lib/utils";
import ValidationResultCard from "@/app/components/VerificationResultCard";

export default function ConfirmBuyAirtime() {
  const {
    service,
    product,
    meterNumber,
    amount,
    providerName,
    validationResult
  } = useLocalSearchParams();
  console.log(validationResult);

  const parsedValidationResult = React.useMemo(() => {
    try {
      const raw = Array.isArray(validationResult)
        ? validationResult[0]
        : validationResult;
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to parse validationResult:", e);
      return null;
    }
  }, [validationResult]);
  const router = useRouter();

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

  const handleContinue = () => {
    router.push({
      pathname: "/(root)/utility/authorize",
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
        endDate
      }
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

        {parsedValidationResult && (
          <ValidationResultCard {...parsedValidationResult} />
        )}

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

        <Button title="Pay" variant="primary" onPress={handleContinue} />
      </ScrollView>
    </SafeAreaView>
  );
}
