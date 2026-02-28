import React from "react";
import { View, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";

export default function GoldSuccess() {
  const params = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();

  const transactionType =
    params.type === "sell"
      ? "sell"
      : params.type === "withdraw"
      ? "withdraw"
      : "buy";

  const isSell = transactionType === "sell";
  const isBuy = transactionType === "buy";
  const isWithdraw = transactionType === "withdraw";
  const isTrigger = params.trigger === "true" || params.trigger === "1";

  const successMessage = isTrigger
    ? "Your trigger was successful"
    : isSell
    ? "Your gold sale is confirmed."
    : isWithdraw
    ? "Your gold withdrawal is confirmed."
    : "Your gold order is confirmed.";

  // ✅ If it's trigger, go to gold home. If it's sell or buy, go to dashboard. If it's withdraw, go to gold home.
  const doneRoute = isTrigger ? "/(root)/gold" : isSell || isBuy ? "/(root)/gold/dashboard" : "/(root)/gold";

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="" />

      <View className="flex-1 px-6 pt-32 items-center">
        <Text className="text-5xl">🎉</Text>
        <Text className="text-white text-2xl font-outfit-bold mt-6">
          {successMessage}
        </Text>
        <Text className="text-white mt-2">your transaction was successful</Text>

        <View className="flex-1 justify-end w-full pb-8">
          <Button
            title="Done"
            variant="primary"
            onPress={() => router.replace({ pathname: doneRoute })}
            className="mb-4"
          />

          {/* optional: keep secondary button only if you want */}
          <Button
            title={isSell || isBuy ? "View dashboard" : "Back to gold"}
            variant="secondary"
            onPress={() => router.replace({ pathname: doneRoute })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
