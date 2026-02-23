// app/(root)/savings/estimated-outcome.tsx
// ✅ Screen design like your screenshot
// ✅ Continue -> opens BottomSheet confirmation -> Ok -> moves to next screen

import React, { useMemo, useState, useEffect } from "react";
import { View, ScrollView, StatusBar, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { calculateSavingsEstimate } from "@/app/lib/thunks/savingsThunks";

import Header from "@/app/components/header-back";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import BottomSheet from "@/app/components/BottomSheet";

const money = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export default function EstimatedOutcome() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, any>>();

  const dispatch = useAppDispatch();
  const { estimate } = useAppSelector((s) => s.savings);

  // Use estimate from API if available, else fallbacks
  const estimatedAmount = Number(estimate?.maturityAmount ?? params.estimated_amount ?? 0);
  const interestRate = estimate?.rate != null ? `${estimate.rate}%` : String(params.interest_rate || "0.00%");
  const estimatedInterest = Number(estimate?.estimatedInterest ?? params.estimated_interest ?? 0);
  const maturityDateText = String(params.maturity_date || params.endDate || "");
  const frequencyLabel = String(params.frequency_label || `${params.amount || params.targetAmount || "0"} ${params.frequency || "once"}`);
  const times = String(estimate?.deposits ?? params.times ?? "");

  const nextRoute = useMemo(() => {
    const n = params.next;
    return typeof n === "string" && n.length > 0 ? n : "/";
  }, [params.next]);

  const [interestEnabled, setInterestEnabled] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    const amount = Number(params.estimated_amount || params.amount || params.targetAmount || 0);
    const tenure = params.tenure ? Number(params.tenure) : undefined;
    const type = params.type || "basic";
    const frequency = params.frequency || "once";

    if (amount && tenure) {
      dispatch(calculateSavingsEstimate({ amount, type, tenure, frequency }));
    }
  }, [params, dispatch]);

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mb-6">
          <ProgressBar currentStep={4} totalSteps={4} />
        </View>

        <CustomText size="lg" weight="bold">
          Your estimated outcome
        </CustomText>
        <CustomText size="sm" secondary className="mt-1 mb-8">
          Review your savings plan summary
        </CustomText>

        <View className="bg-primary-400 rounded-2xl border border-white/10 overflow-hidden">
          {/* Estimated amount */}
          <View className="flex-row items-center px-5 py-5">
            <View className="w-10 items-center">
              <Ionicons name="wallet-outline" size={22} color="#9AA040" />
            </View>
            <View className="flex-1">
              <CustomText size="sm" secondary>
                Estimated amount
              </CustomText>
              <CustomText size="lg" weight="bold">
                {money(estimatedAmount)}
              </CustomText>
            </View>
          </View>

          <View className="h-[1px] bg-white/10 mx-5" />

          {/* Interest rate */}
          <View className="flex-row items-center px-5 py-5">
            <View className="w-10 items-center">
              <Ionicons name="stats-chart-outline" size={22} color="#9AA040" />
            </View>
            <View className="flex-1">
              <CustomText size="sm" secondary>
                Interest rate
              </CustomText>
              <CustomText size="lg" weight="bold">
                {interestEnabled ? interestRate : "0.00%"}
              </CustomText>
            </View>
          </View>

          <View className="h-[1px] bg-white/10 mx-5" />

          {/* Estimated interest */}
          <View className="flex-row items-center px-5 py-5">
            <View className="w-10 items-center">
              <Ionicons name="cash-outline" size={22} color="#9AA040" />
            </View>
            <View className="flex-1">
              <CustomText size="sm" secondary>
                Estimated Interest
              </CustomText>
              <CustomText size="lg" weight="bold">
                {interestEnabled ? money(estimatedInterest) : money(0)}
              </CustomText>
            </View>
          </View>

          <View className="h-[1px] bg-white/10 mx-5" />

          {/* Maturity date */}
          <View className="flex-row items-center px-5 py-5">
            <View className="w-10 items-center">
              <Ionicons name="calendar-outline" size={22} color="#9AA040" />
            </View>
            <View className="flex-1">
              <CustomText size="sm" secondary>
                Maturity date
              </CustomText>
              <CustomText size="lg" weight="bold">
                {maturityDateText}
              </CustomText>
            </View>
          </View>
        </View>

        <CustomText size="sm" secondary className="mt-6 leading-6">
          This estimate assumes you save {frequencyLabel}, {times} times between
          your today and maturity date without earning interests.
        </CustomText>
      </ScrollView>

      {/* Continue button */}
      <View className="px-5 pb-10 absolute w-full bottom-0 bg-primary-100">
        <Button
          title="Continue"
          variant="primary"
          onPress={() => setConfirmVisible(true)}
          disabled={!estimate}
        />
      </View>

      {/* Confirmation BottomSheet */}
      <BottomSheet
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title="Confirmation"
        buttonText="Ok"
        onConfirm={() => {
          setConfirmVisible(false);
          // pass estimate and accumulated params to plan-details
          router.push({
            pathname: "./plan-details",
            params: {
              ...params,
              maturityAmount: estimate?.maturityAmount,
              estimatedInterest: estimate?.estimatedInterest,
              principal: estimate?.principal,
              deposits: estimate?.deposits,
              rate: estimate?.rate,
              productCode: params.productCode || estimate?.productCode,
            },
          } as any);
        }}
      >
        <View className="items-center mt-6">
          <View
            style={{
              width: 86,
              height: 86,
              borderRadius: 43,
              backgroundColor: "#2FA8FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <Ionicons name="information" size={46} color="#fff" />
          </View>

          <CustomText size="lg" weight="bold" style={{ textAlign: "center" }}>
            Please confirm
          </CustomText>

          <CustomText
            size="sm"
            secondary
            className="mt-3"
            style={{ textAlign: "center", lineHeight: 22 }}
          >
            You are about to create a saving plan.{"\n"}
            Please select payment option
          </CustomText>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
