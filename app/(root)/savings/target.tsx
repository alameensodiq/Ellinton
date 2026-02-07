import React, { useMemo, useState } from "react";
import { View, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import AmountInput from "@/app/components/inputs/AmountInput";

const QUICK_AMOUNTS = ["1000", "2000", "3000", "5000", "10000", "20000"];

export default function Target() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();

  const planName = useMemo(() => params.planName || "", [params.planName]);
  const type = useMemo(() => params.type || "basic", [params.type]);

  const [targetAmount, setTargetAmount] = useState("0");

  const amountNumber = useMemo(() => {
    const cleaned = String(targetAmount || "").replace(/[^\d]/g, "");
    return Number(cleaned || 0);
  }, [targetAmount]);

  const canContinue = amountNumber > 0;

  const handleQuickPick = (value: string) => {
    setTargetAmount(value);
  };

  const handleContinue = () => {
    if (!canContinue) return;

    router.push({
      pathname: "/(root)/savings/timeline",
      params: {
        ...params,
        planName,
        type,
        targetAmount: String(amountNumber),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 p-4">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ProgressBar currentStep={2} totalSteps={4} />

        <CustomText size="lg" weight="bold" className="mt-2">
          Choose your amount
        </CustomText>
        <CustomText size="sm" secondary className="mt-1 mb-6">
          Select how much you want to start saving with.
        </CustomText>

        {/* Quick select */}
        <CustomText size="sm" weight="bold" className="mb-3">
          Quick Select
        </CustomText>

        <View className="flex-row flex-wrap justify-between">
          {QUICK_AMOUNTS.map((amt) => {
            const active = String(amountNumber) === amt;

            return (
              <Pressable
                key={amt}
                onPress={() => handleQuickPick(amt)}
                className={`w-[31%] mb-3 rounded-xl px-3 py-3 items-center justify-center border ${
                  active
                    ? "bg-primary-200 border-primary-600"
                    : "bg-primary-400 border-white/10"
                }`}
              >
                <CustomText weight="bold" className="text-white">
                  ₦{Number(amt).toLocaleString()}
                </CustomText>
              </Pressable>
            );
          })}
        </View>

        {/* Manual */}
        <CustomText size="sm" weight="bold" className="mt-4 mb-3">
          Enter manually
        </CustomText>

        <AmountInput
          value={targetAmount}
          onChange={setTargetAmount}
          placeholder="0"
        />

        <View className="flex-1" />

        <Button
          title="Continue"
          variant="primary"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
