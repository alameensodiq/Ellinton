import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function PlanNameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    productCode?: string;
    productName?: string;
    productRate?: string;
    productTenure?: string;
  }>();

  const [planName, setPlanName] = useState("");
  const [planNameError, setPlanNameError] = useState("");

  const productName = params.productName || "";
  const productRate = params.productRate || "0";
  const productTenure = params.productTenure || "0";
  const productCode = params.productCode || "";
  const planType = params.type || "basic";

  const handleContinue = () => {
    const name = planName.trim();

    if (!name) {
      setPlanNameError("Plan name is required");
      return;
    }

    setPlanNameError("");

    router.push({
      pathname: "/(root)/savings/target",
      params: {
        type: planType,
        planName: name,
        productCode,
        productRate,
        productTenure,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 p-4">
      <ProgressBar currentStep={2} totalSteps={4} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <CustomText size="lg" weight="bold" className="mt-4">
          Name your plan
        </CustomText>

        <CustomText size="sm" secondary className="mt-2 mb-6">
          Give your savings plan a meaningful name
        </CustomText>

        <TextInputField
          label="Plan name"
          value={planName}
          onChangeText={(t) => {
            setPlanName(t);
            if (planNameError) setPlanNameError("");
          }}
          placeholder="e.g. Vacation Fund, Emergency Fund"
          error={planNameError}
        />

        <CustomText size="sm" secondary className="mt-3 mb-6">
          A descriptive name makes it easier to track your goals
        </CustomText>

        <View className="bg-primary-400 rounded-2xl p-4">
          <CustomText size="lg" weight="bold" className="mb-4">
            {productName}
          </CustomText>

          <View className="gap-3">
            <View className="flex-row justify-between">
              <CustomText size="sm" secondary>
                Tenure
              </CustomText>
              <CustomText size="sm" weight="bold">
                {productTenure} days
              </CustomText>
            </View>
            <View className="flex-row justify-between">
              <CustomText size="sm" secondary>
                Interest Rate
              </CustomText>
              <CustomText size="sm" weight="bold">
                {productRate}% p.a.
              </CustomText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-primary-100 p-4 border-t border-primary-400 gap-3 flex-row">
        <Button
          title="Back"
          variant="secondary"
          onPress={() => router.back()}
          className="flex-1"
        />
        <Button
          title="Continue"
          variant="primary"
          onPress={handleContinue}
          className="flex-1"
        />
      </View>
    </SafeAreaView>
  );
}
