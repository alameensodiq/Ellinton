import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import icons from "@/app/assets/icons/icons";
import Header from "@/app/components/header-back";
import AmountCard from "@/app/components/home/cards/AmountCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View } from "react-native";
import PaymentInfoCard from "@/app/components/home/biils/PaymentInfoCard";
import TransferSummaryCard from "@/app/components/TransferSummaryCard";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import ScheduleTransaction from "@/app/components/ScheduleTransaction";
import { dayOptions, frequencyOptions } from "@/app/lib/utils";
import Button from "@/app/components/Button";

export default function ConfirmBuyAirtime() {
  const { provider, phone, amount } = useLocalSearchParams();
  const router = useRouter();
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
  const handleContinue = () => {
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
        <AmountCard
          amount={rawAmount}
          description=""
        />

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
        <Button title="Pay" variant="primary" onPress={handleContinue} />
      </ScrollView>
    </SafeAreaView>
  );
}
