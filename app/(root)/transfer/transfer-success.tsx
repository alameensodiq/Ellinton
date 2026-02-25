import React from "react";
import { View, Text, StatusBar, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AmountCard from "@/app/components/home/cards/AmountCard";
import Button from "@/app/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "@/app/components/CustomText";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/lib/store";
import { clearValidation } from "@/app/lib/slices/accountSlice";

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
  if (num < 0) return "minus " + numberToWords(-num);

  if (num < 20) return ones[num];
  if (num < 100)
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000)
    return (
      ones[Math.floor(num / 100)] +
      " hundred" +
      (num % 100 ? " " + numberToWords(num % 100) : "")
    );
  if (num < 1_000_000)
    return (
      numberToWords(Math.floor(num / 1000)) +
      " thousand" +
      (num % 1000 ? " " + numberToWords(num % 1000) : "")
    );
  if (num < 1_000_000_000)
    return (
      numberToWords(Math.floor(num / 1_000_000)) +
      " million" +
      (num % 1_000_000 ? " " + numberToWords(num % 1_000_000) : "")
    );
  return (
    numberToWords(Math.floor(num / 1_000_000_000)) +
    " billion" +
    (num % 1_000_000_000 ? " " + numberToWords(num % 1_000_000_000) : "")
  );
}

function amountToDescription(amountStr: string): string {
  const num = parseFloat(amountStr.replace(/,/g, ""));
  if (isNaN(num)) return "";
  const naira = Math.floor(num);
  const kobo = Math.round((num - naira) * 100);
  let result = numberToWords(naira) + " naira";
  if (kobo > 0) result += " " + numberToWords(kobo) + " kobo";
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export default function TransferSuccess() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const router = useRouter();

  const amount = params.amount as string;
  const receiverName = params.receiverName || "recipient";

  let transferResult;
  try {
    transferResult = JSON.parse(params.transferResult as string);
  } catch {
    transferResult = null;
  }

  const handleDone = () => {
    dispatch(clearValidation());
    router.replace("/(root)/(tabs)");
  };

  const handleShareReceipt = () => {
    if (!transferResult) return;
    router.replace({
      pathname: "/(root)/transfer/receipt-details",
      params: {
        transferResult: JSON.stringify(transferResult),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-400">
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        onPress={handleDone}
        className="absolute top-16 left-6 z-10"
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      <View className="flex-1 px-6 pt-24 justify-start">
        <AmountCard
          amount={amount || ""}
          description={amountToDescription(amount || "0")}
        />

        <View className="items-center mt-10 mb-4 px-4">
          <Text className="text-9xl mb-4">🎉</Text>
          <Text className="text-white text-2xl font-bold mb-2">
            Transfer successful
          </Text>
          <Text className="text-white/60 text-center px-6">
            Your transfer of ₦{amount} to {receiverName} was successful
          </Text>
        </View>
      </View>

      <View className="px-6 pb-10 gap-3">
        <Button
          title="Done"
          variant="primary"
          onPress={handleDone}
          className="rounded-2xl mb-3"
        />
        <Button
          title="Share receipt"
          variant="secondary"
          onPress={handleShareReceipt}
          className="rounded-2xl flex-row justify-center"
          icon={<Ionicons name="share-outline" size={20} color="#2a2a1a" />}
        />
      </View>
    </SafeAreaView>
  );
}
