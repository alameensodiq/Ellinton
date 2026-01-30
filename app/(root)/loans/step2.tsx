import { View, StatusBar, Pressable } from "react-native";
import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { useLocalSearchParams, useRouter } from "expo-router";

type ConsentChoice = "consent" | "decline" | null;

const DataConsent = () => {
  const [choice, setChoice] = useState<ConsentChoice>(null);

  const { productCode, institutionCode, name } = useLocalSearchParams<{
    productCode?: string;
    institutionCode?: string;
    name?: string;
  }>();

  const canContinue = useMemo(() => choice !== null, [choice]);
  const router = useRouter();

  const Card = ({
    value,
    title,
    subtitle,
    symbol,
  }: {
    value: Exclude<ConsentChoice, null>;
    title: string;
    subtitle: string;
    symbol: "✓" | "✕";
  }) => {
    const isSelected = choice === value;

    return (
      <Pressable
        onPress={() => setChoice(value)}
        className={`mb-4 rounded-2xl p-4 bg-primary-400 border ${
          isSelected ? "border-primary-600" : "border-transparent"
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-primary-300 w-12 h-12 rounded-full items-center justify-center mr-3">
              <CustomText weight="bold" className="text-white text-xl">
                {symbol}
              </CustomText>
            </View>

            <View className="flex-1">
              <CustomText weight="bold" className="text-white">
                {title}
              </CustomText>

              <CustomText size="xs" className="text-white/70 mt-1">
                {subtitle}
              </CustomText>
            </View>
          </View>

          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              isSelected ? "border-primary-600" : "border-white/30"
            }`}
          >
            {isSelected && (
              <View className="w-3.5 h-3.5 rounded-full bg-primary-600" />
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const goNext = () => {
    const commonParams = {
      productCode: productCode ?? "",
      institutionCode: institutionCode ?? "",
      name: name ?? "",
    };

    if (choice === "consent") {
      router.push({
        pathname: "/(root)/loans/step3",
        params: commonParams,
      });
      return;
    }

    router.push({
      pathname: "/(root)/loans/credit-check-fail",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header title="Data Consent Required" />

      <View className="px-6 mb-6">
        <CustomText size="base">
          Your data will be retrieved from our partners to determine your
          eligibility for the Salah loan
        </CustomText>
      </View>

      <View className="px-6 flex-1">
        <Card
          value="consent"
          title="Yes, I consent"
          subtitle="I agree to share my data for loan eligibility assessment"
          symbol="✓"
        />

        <Card
          value="decline"
          title="No, I decline"
          subtitle="I do not wish to proceed with the loan application"
          symbol="✕"
        />
      </View>

      <View className="px-6 pb-6">
        <Button
          title="Continue"
          disabled={!canContinue}
          onPress={goNext}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

export default DataConsent;
