import React from "react";
import { StatusBar, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { LinearGradient } from "expo-linear-gradient";

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

function numberToWords(num: number): string {
  if (num === 0) return "zero";
  if (num < 20) return ones[num];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 ? ` ${ones[num % 10]}` : "");
  }
  if (num < 1000) {
    return (
      `${ones[Math.floor(num / 100)]} hundred` +
      (num % 100 ? ` ${numberToWords(num % 100)}` : "")
    );
  }
  if (num < 1_000_000) {
    return (
      `${numberToWords(Math.floor(num / 1000))} thousand` +
      (num % 1000 ? ` ${numberToWords(num % 1000)}` : "")
    );
  }
  return `${num}`;
}

function amountToWords(amount: string) {
  const value = Number(String(amount).replace(/,/g, "")) || 0;
  const text = `${numberToWords(value)} naira`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function ReferralTransferSuccess() {
  const router = useRouter();
  const { amount, receiverName, status, message } = useLocalSearchParams<{
    amount?: string;
    receiverName?: string;
    status?: string;
    message?: string;
  }>();

  const rawAmount = Array.isArray(amount) ? amount[0] : amount || "0";
  const rawReceiver = Array.isArray(receiverName)
    ? receiverName[0]
    : receiverName || "Sabra";
  const rawStatus = Array.isArray(status) ? status[0] : status || "success";
  const rawMessage = Array.isArray(message) ? message[0] : message || "";
  const isFailed = rawStatus === "failed";

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-6">
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        onPress={() => router.replace("/(root)/referral")}
        className="pt-3"
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      <View className="flex-1 justify-center">
        <LinearGradient
          colors={["#27280F", "#53541F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 18, paddingVertical: 28, marginBottom: 48 }}
        >
          <CustomText
            weight="bold"
            size="xxl"
            className="text-center text-white mb-2"
          >
            ₦{rawAmount}
          </CustomText>
          <CustomText className="text-center text-white/60 mb-0">
            {amountToWords(rawAmount)}
          </CustomText>
        </LinearGradient>

        <View className="items-center px-4">
          <CustomText className="text-[5rem] mb-3">🎉</CustomText>
          <CustomText
            weight="bold"
            size="xxl"
            className="text-center text-white mb-3"
          >
            {isFailed ? "Transfer failed" : "Transfer successful"}
          </CustomText>
          <CustomText className="text-center text-white/70 leading-8">
            {rawMessage ||
              (isFailed
                ? `Your transfer of ₦${rawAmount} to ${rawReceiver} failed`
                : `Your transfer of ₦${rawAmount} to ${rawReceiver} was successful`)}
          </CustomText>
        </View>
      </View>

      <View className="pb-8">
        <Button
          title="Done"
          variant="primary"
          onPress={() => router.replace("/(root)/referral")}
          className="py-5"
        />
      </View>
    </SafeAreaView>
  );
}
