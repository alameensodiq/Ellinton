

import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, StatusBar, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import { useLocalSearchParams } from "expo-router";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { calculateSavingsEstimate, createSaving } from "@/app/lib/thunks/savingsThunks";
import Loading from "@/app/components/Loading";

export default function PlanDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, any>>();
  const dispatch = useAppDispatch();
  const { estimate, isLoading, savingsDetail } = useAppSelector((s) => s.savings);

  const [localEstimate, setLocalEstimate] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  // Accept estimate passed via params or fetch using calculate thunk
  useEffect(() => {
    // If estimate fields passed in params, use them
    if (params.maturityAmount || params.estimatedInterest || params.principal) {
      setLocalEstimate({
        maturityAmount: Number(params.maturityAmount) || null,
        estimatedInterest: Number(params.estimatedInterest) || null,
        principal: Number(params.principal) || null,
        deposits: Number(params.deposits) || null,
        rate: Number(params.rate) || null,
        productCode: params.productCode || params.productCode,
      });
      return;
    }

    // Otherwise, attempt to calculate from provided inputs
    const amount = params.amount ?? params.targetAmount ?? params.initialAmount;
    const type = params.type ?? "basic";
    const tenure = params.tenure ? Number(params.tenure) : undefined;
    const frequency = params.frequency ?? "once";

    if (amount && tenure) {
      dispatch(
        calculateSavingsEstimate({
          amount: Number(amount),
          type,
          tenure: Number(tenure),
          frequency,
        })
      );
    }
  }, [params, dispatch]);

  // Mirror redux estimate to local state when available
  useEffect(() => {
    if (estimate) setLocalEstimate(estimate);
  }, [estimate]);

  // Navigate to success once saving created
  useEffect(() => {
    if (savingsDetail) {
      setCreating(false);
      // show success screen with maturity amount if available
      const amt = savingsDetail.maturityAmount || savingsDetail.amount || localEstimate?.maturityAmount || params.amount;
      router.replace({
        pathname: "/(root)/savings/success",
        params: { amount: String(amt ?? "0"), description: "Basic saving created successful" },
      });
    }
  }, [savingsDetail, router, localEstimate, params.amount]);

  const estimateDisplay = useMemo(() => {
    return (
      localEstimate || {
        maturityAmount: null,
        estimatedInterest: null,
        principal: params.amount ? Number(params.amount) : null,
        deposits: params.deposits ? Number(params.deposits) : null,
        rate: params.rate ? Number(params.rate) : null,
      }
    );
  }, [localEstimate, params.amount, params.deposits, params.rate]);

  const handleCreate = async () => {
    setCreating(true);

    const payload: any = {
      name: params.planName || "My savings plan",
      productCode: params.productCode || params.productCode || "",
      amount: Number(params.amount ?? params.initialAmount ?? params.targetAmount ?? 0),
      frequency: params.frequency || "once",
      tenure: params.tenure ? Number(params.tenure) : undefined,
      startDate: params.startDate || params.start || undefined,
      endDate: params.endDate || params.end || undefined,
      dayOfWeek: params.dayOfWeek || undefined,
      dateInMonth: params.dateInMonth ? Number(params.dateInMonth) : undefined,
      debitSource: params.debitSource || "CARD",
      maturityAction: params.maturityAction || "TRANSFER_TO_ACCOUNT",
    };

    if (params.targetAmount) payload.targetAmount = Number(params.targetAmount);
    if (params.participants) payload.participants = params.participants;

    try {
      await dispatch(createSaving(payload));
    } catch (e) {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <CustomText size="sm" weight="bold">
            View plan details
          </CustomText>

          <View style={{ width: 34 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Card */}
        <LinearGradient
          colors={["#212207", "#515220"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <View className="bg-primary-400/60 border border-white/10 rounded-2xl p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <View className="w-10 h-10 rounded-full bg-primary-300 items-center justify-center mb-4">
                  <Ionicons name="car-outline" size={18} color="#fff" />
                </View>

                <CustomText size="xl" weight="bold">
                  Car Savings
                </CustomText>
                <CustomText size="sm" secondary className="mt-1">
                  Basic savings
                </CustomText>
              </View>

              {/* faint logo block (right) */}
              <View className="w-20 h-20 rounded-2xl bg-white/5 border border-white/5 items-center justify-center">
                <CustomText size="xxl" weight="bold" className="text-white/10">
                  ₦
                </CustomText>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Details Card */}
        <View className="mt-5 bg-primary-400 rounded-2xl border border-white/10 overflow-hidden">
          {[
            { label: "Amount", value: "₦1,000" },
            { label: "Duration", value: "30 day" },
            { label: "Frequency", value: "Weekly/Wednesdays" },
            { label: "Start date", value: "Nov 22, 2025" },
            { label: "Maturity date", value: "Feb 20,2026" },
            { label: "Goal amount", value: "₦100,000" },
            { label: "Payment Type", value: "My Account" },
          ].map((row, idx, arr) => (
            <View key={row.label}>
              <View className="flex-row items-center justify-between px-5 py-5">
                <CustomText size="sm" secondary>
                  {row.label}
                </CustomText>
                <CustomText size="sm" weight="bold">
                  {row.value}
                </CustomText>
              </View>

              {idx !== arr.length - 1 && (
                <View className="h-[1px] bg-white/10 mx-5" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="px-5 pb-10 absolute w-full bottom-0 bg-primary-100">
        <Button
          title="Create plan"
          variant="primary"
          onPress={() => router.push("/")}
        />
      </View>
    </SafeAreaView>
  );
}
