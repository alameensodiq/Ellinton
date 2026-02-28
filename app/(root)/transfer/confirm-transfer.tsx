import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import AmountCard from "@/app/components/home/cards/AmountCard";
import TransferSummaryCard from "@/app/components/TransferSummaryCard";
import ScheduleTransaction from "@/app/components/ScheduleTransaction";
import { dayOptions, frequencyOptions } from "@/app/lib/utils";
import { svgIcons } from "@/app/assets/icons/icons";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const numberToWords = (num: number): string => {
  if (num === 0) return "zero naira";

  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];

  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  const scales = ["", "thousand", "million", "billion"];

  const convertChunk = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one ? " " + ones[one] : "");
    }
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return (
      ones[hundred] + " hundred" + (rest ? " and " + convertChunk(rest) : "")
    );
  };

  const chunks: string[] = [];
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertChunk(chunk);
      const scale = scales[scaleIndex];
      chunks.unshift(chunkWords + (scale ? " " + scale : ""));
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return chunks.join(", ") + " naira";
};

export default function ConfirmTransfer() {
  const params = useLocalSearchParams();
  const router = useRouter();
  console.log(params);
  const accountNumber = params.accountNumber as string;
  const bank = params.bank as string;
  const amount = params.amount as string;
  const receiverNameParam = params.receiverName as string;
  const addAsBeneficiaryParam = params.addAsBeneficiary as string;
  const beneficiaryJson = params.beneficiary as string;
  const bankCodeParam = params.bankCode as string;

  const addAsBeneficiary = addAsBeneficiaryParam === "true";

  let beneficiary = null;
  if (beneficiaryJson) {
    try {
      beneficiary = JSON.parse(beneficiaryJson);
    } catch (e) {
      beneficiary = null;
    }
  }

  const receiverName =
    receiverNameParam ||
    (beneficiary ? beneficiary.name : `Account • ${accountNumber}`);

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remark, setRemark] = useState("");

  const fee = 10;
  const numericAmount = parseFloat(amount.replace(/,/g, ""));
  const totalDebit = numericAmount + fee;

  const goldBalance = useAppSelector((s: any) => s.gold.dashboard?.wallet?.balance_grams ?? 0);
  const amountGramsParam = params.amount_grams as string | undefined;

  const amountInWords = useMemo(() => {
    const num = Math.floor(numericAmount);
    const words = numberToWords(num);
    return words.charAt(0).toUpperCase() + words.slice(1);
  }, [numericAmount]);

  const handlePay = () => {
    if (
      scheduleEnabled &&
      (!scheduleName || !frequency || !startDate || !endDate)
    ) {
      Alert.alert("Incomplete Schedule", "Please fill all schedule details");
      return;
    }
    if (scheduleEnabled && frequency === "weekly" && !dayOfWeek) {
      Alert.alert("Incomplete Schedule", "Please select day of week");
      return;
    }

    console.log({
      accountNumber,
      bank,
      amount,
      remark,
      scheduleEnabled,
      scheduleName,
      frequency,
      dayOfWeek,
      startDate,
      endDate,
      addAsBeneficiary,
    });

    const transferData = {
      accountNumber,
      bankCode: bankCodeParam || undefined,
      bank,
      amount: numericAmount,
      receiverName,
      addAsBeneficiary,
      remark,
      ...(amountGramsParam && { amount_grams: Number(amountGramsParam) }),
      ...(params?.gift && { gift: params.gift === "true" }),
      isScheduled: scheduleEnabled,
      ...(scheduleEnabled && {
        scheduleName,
        frequency,
        dayOfWeek,
        startDate,
        endDate,
      }),
    };

    router.push({
      pathname: "/(root)/transfer/authorize-payment",
      params: {
        ...params,
        transferData: JSON.stringify(transferData),
      },
    });
  };

  const Transfer = svgIcons.chip;
  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Confirm payment" />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <AmountCard amount={amount} description={amountInWords} />
        <Text className="text-sm text-white/60 mt-3">Sending to</Text>
        <View className="flex-row items-start justify-between mb-4 bg-primary-400 rounded-xl p-4 mt-4">
          <View className="flex-1">
            <Text className="text-white font-semibold mb-1">
              {receiverName}
            </Text>
            <Text className="text-sm text-white/60">
              {bank} • {accountNumber}
            </Text>
          </View>
          <View className=" bg-primary-300 p-3 rounded-full">
            <Transfer />
          </View>
        </View>
        <TransferSummaryCard
          amount={amount}
          fee={fee}
          totalDebit={totalDebit}
        />
        <TextInputField
          label="Remark"
          value={remark}
          onChangeText={setRemark}
          placeholder="Enter a remark"
        />
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
        <Button
          title="Authorize Payment"
          variant="primary"
          onPress={handlePay}
          className="bg-accent-100 w-full"
        />
      </ScrollView>

    </SafeAreaView>
  );
}
