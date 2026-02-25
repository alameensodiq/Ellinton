import React, { useEffect, useMemo, useRef } from "react";
import { View, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { calculateSavingsEstimate } from "@/app/lib/thunks/savingsThunks";

import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import Loading from "@/app/components/Loading";
import Button from "@/app/components/Button";

const money = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export default function EstimatedOutcome() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, any>>();

  const dispatch = useAppDispatch();
  const { estimate, isLoading } = useAppSelector((s) => s.savings);

  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;

    const amount = Number(params.amount || params.targetAmount || 0);
    const tenure = params.tenure ? Number(params.tenure) : undefined;
    const type = params.type || "basic";
    const frequency = params.frequency || "once";

    if (amount && tenure) {
      didFetchRef.current = true;
      dispatch(calculateSavingsEstimate({ amount, type, tenure, frequency }));
    }
  }, [
    dispatch,
    params.amount,
    params.targetAmount,
    params.tenure,
    params.type,
    params.frequency,
  ]);

  const computed = useMemo(() => {
    const estimatedAmount = Number(estimate?.maturityAmount ?? 0);
    const interestRate =
      estimate?.rate != null
        ? `${estimate.rate}%`
        : `${params.productRate || "0"}%`;
    const estimatedInterest = Number(estimate?.estimatedInterest ?? 0);

    const maturityDateText = String(
      params.maturity_date || params.endDate || ""
    );
    const times = String(estimate?.deposits ?? "");
    const frequencyLabel = String(
      `${params.amount || params.targetAmount || "0"} ${
        params.frequency || "once"
      }`
    );

    return {
      estimatedAmount,
      interestRate,
      estimatedInterest,
      maturityDateText,
      frequencyLabel,
      times,
    };
  }, [estimate, params]);

  const showLoading = isLoading && !estimate;

  const onContinue = () => {
    router.push({
      pathname: "./plan-details",
      params: {
        ...params,

        maturityAmount: estimate?.maturityAmount ?? computed.estimatedAmount,
        estimatedInterest:
          estimate?.estimatedInterest ?? computed.estimatedInterest,
        principal: estimate?.principal,
        deposits: estimate?.deposits,
        rate: estimate?.rate ?? params.productRate,

        // keep these for view plan screen
        maturity_date: computed.maturityDateText,
      },
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      {showLoading ? (
        <Loading visible />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
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
              <View className="flex-row items-center px-5 py-5">
                <View className="w-10 items-center">
                  <Ionicons name="wallet-outline" size={22} color="#9AA040" />
                </View>
                <View className="flex-1">
                  <CustomText size="sm" secondary>
                    Estimated amount
                  </CustomText>
                  <CustomText size="lg" weight="bold">
                    {money(computed.estimatedAmount)}
                  </CustomText>
                </View>
              </View>

              <View className="h-[1px] bg-white/10 mx-5" />

              <View className="flex-row items-center px-5 py-5">
                <View className="w-10 items-center">
                  <Ionicons
                    name="stats-chart-outline"
                    size={22}
                    color="#9AA040"
                  />
                </View>
                <View className="flex-1">
                  <CustomText size="sm" secondary>
                    Interest rate
                  </CustomText>
                  <CustomText size="lg" weight="bold">
                    {computed.interestRate}
                  </CustomText>
                </View>
              </View>

              <View className="h-[1px] bg-white/10 mx-5" />

              <View className="flex-row items-center px-5 py-5">
                <View className="w-10 items-center">
                  <Ionicons name="cash-outline" size={22} color="#9AA040" />
                </View>
                <View className="flex-1">
                  <CustomText size="sm" secondary>
                    Estimated Interest
                  </CustomText>
                  <CustomText size="lg" weight="bold">
                    {money(computed.estimatedInterest)}
                  </CustomText>
                </View>
              </View>

              <View className="h-[1px] bg-white/10 mx-5" />

              <View className="flex-row items-center px-5 py-5">
                <View className="w-10 items-center">
                  <Ionicons name="calendar-outline" size={22} color="#9AA040" />
                </View>
                <View className="flex-1">
                  <CustomText size="sm" secondary>
                    Maturity date
                  </CustomText>
                  <CustomText size="lg" weight="bold">
                    {computed.maturityDateText}
                  </CustomText>
                </View>
              </View>
            </View>

            <CustomText size="sm" secondary className="mt-6 leading-6">
              This estimate assumes you save {computed.frequencyLabel},{" "}
              {computed.times} times between today and maturity date.
            </CustomText>
          </ScrollView>

          <View className="absolute left-0 right-0 bottom-5 px-4 pb-6 pt-3 bg-primary-100 border-t border-white/10">
            <Button
              title="Continue"
              onPress={onContinue}
              variant="primary"
              disabled={!estimate && !computed.estimatedAmount}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
